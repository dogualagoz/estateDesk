import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { generateSecureToken } from '../common/token.util';
import { uploadsDir } from '../common/uploads.util';
import { sanitizeIntakePreview, getIntakeInvalidReason } from './intake.sanitize';
import { CreateIntakeLinkDto } from './dto/create-intake-link.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ApproveSubmissionDto } from './dto/review-submission.dto';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const INTAKE_TTL_DAYS = 30;
/** Tek link üzerinden kabul edilen azami başvuru (istismar koruması). */
const MAX_SUBMISSIONS_PER_LINK = 50;

@Injectable()
export class PortfolioIntakeService {
  constructor(
    private prisma: PrismaService,
    private portfolio: PortfolioService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  // ── Danışman: link yönetimi ──

  async createLink(user: AuthUser, dto: CreateIntakeLinkDto) {
    const officeId = requireOfficeId(user);
    const link = await this.prisma.portfolioIntakeLink.create({
      data: {
        token: generateSecureToken(),
        officeId,
        createdById: user.id,
        label: dto.label,
        expiresAt: new Date(Date.now() + INTAKE_TTL_DAYS * 24 * 3600 * 1000),
      },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.INTAKE_LINK_CREATED,
      userId: user.id,
      officeId,
      targetType: 'intake_link',
      targetId: link.id,
      metadata: { label: link.label },
    });

    return this.toLinkResponse(link, 0);
  }

  async listLinks(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const links = await this.prisma.portfolioIntakeLink.findMany({
      where: { officeId, status: 'ACTIVE' },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return links.map((l) => this.toLinkResponse(l, l._count.submissions));
  }

  async revokeLink(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const link = await this.prisma.portfolioIntakeLink.findFirst({
      where: { id, officeId },
    });
    if (!link) throw new NotFoundException('Link bulunamadı');

    await this.prisma.portfolioIntakeLink.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.INTAKE_LINK_REVOKED,
      userId: user.id,
      officeId,
      targetType: 'intake_link',
      targetId: id,
    });

    return { success: true };
  }

  // ── Public: önizleme + başvuru ──

  async getPublicPreview(token: string) {
    const link = await this.prisma.portfolioIntakeLink.findUnique({
      where: { token },
      include: {
        office: { select: { name: true } },
        createdBy: { select: { fullName: true } },
      },
    });
    if (!link) throw new NotFoundException('Link bulunamadı');
    return sanitizeIntakePreview(link);
  }

  async createSubmission(
    token: string,
    dto: CreateSubmissionDto,
    files: Express.Multer.File[],
  ) {
    const link = await this.prisma.portfolioIntakeLink.findUnique({
      where: { token },
      include: { _count: { select: { submissions: true } } },
    });
    if (!link) throw new NotFoundException('Link bulunamadı');
    if (getIntakeInvalidReason(link)) {
      throw new BadRequestException('Bu başvuru linki artık geçerli değil');
    }
    if (link._count.submissions >= MAX_SUBMISSIONS_PER_LINK) {
      throw new BadRequestException('Bu link üzerinden başvuru limiti dolmuş');
    }

    const submission = await this.prisma.portfolioSubmission.create({
      data: {
        linkId: link.id,
        officeId: link.officeId,
        submitterName: dto.submitterName,
        submitterPhone: dto.submitterPhone,
        type: dto.type,
        listingType: dto.listingType ?? 'SALE',
        title: dto.title,
        city: dto.city,
        district: dto.district,
        neighborhood: dto.neighborhood,
        areaSqm: dto.areaSqm,
        roomCount: dto.roomCount,
        price: dto.price,
        features: dto.features ?? [],
        description: dto.description,
        kvkkAcceptedAt: new Date(),
      },
    });

    // Görseller portföyle aynı pipeline'dan geçer: sharp re-encode → WebP.
    // Hata olursa yarım başvuru bırakılmaz (kayıt + dizin temizlenir).
    try {
      if (files?.length) {
        const urls = await this.processImages(submission.id, files);
        await this.prisma.portfolioSubmission.update({
          where: { id: submission.id },
          data: { images: urls },
        });
      }
    } catch (err) {
      await this.prisma.portfolioSubmission.delete({ where: { id: submission.id } });
      fs.rmSync(path.join(uploadsDir(), 'intake', submission.id), {
        recursive: true,
        force: true,
      });
      throw err instanceof BadRequestException
        ? err
        : new BadRequestException('Görseller işlenemedi, lütfen tekrar deneyin');
    }

    this.audit.log({
      action: AUDIT_ACTIONS.INTAKE_SUBMISSION_RECEIVED,
      userId: link.createdById,
      officeId: link.officeId,
      targetType: 'intake_submission',
      targetId: submission.id,
      metadata: { linkId: link.id, imageCount: files?.length ?? 0 },
    });

    // Public yanıt: iç id'ler/detay sızdırılmaz
    return { success: true };
  }

  // ── Danışman: başvuru inceleme ──

  async listSubmissions(user: AuthUser, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const officeId = requireOfficeId(user);
    return this.prisma.portfolioSubmission.findMany({
      where: { officeId, ...(status ? { status } : {}) },
      include: {
        link: { select: { label: true, createdById: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pendingCount(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const count = await this.prisma.portfolioSubmission.count({
      where: { officeId, status: 'PENDING' },
    });
    return { count };
  }

  async getSubmission(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const submission = await this.prisma.portfolioSubmission.findFirst({
      where: { id, officeId },
      include: {
        link: { select: { label: true, createdById: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!submission) throw new NotFoundException('Başvuru bulunamadı');
    return submission;
  }

  /**
   * Onay: danışmanın düzenlediği değerlerle mevcut portfolio.create yolundan
   * gerçek portföy oluşturulur (createdById = onaylayan danışman, ofis
   * izolasyonu aynı yoldan). Görseller kopyalanır (zaten WebP, re-encode yok).
   */
  async approveSubmission(user: AuthUser, id: string, dto: ApproveSubmissionDto) {
    const submission = await this.getSubmission(user, id);
    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Bu başvuru zaten sonuçlandırılmış');
    }

    const created = await this.portfolio.create(user, dto);

    const images = this.copySubmissionImages(submission.id, submission.images, created.id);
    if (images.length) {
      await this.prisma.portfolio.update({
        where: { id: created.id },
        data: { images },
      });
    }

    await this.prisma.portfolioSubmission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        portfolioId: created.id,
      },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.INTAKE_SUBMISSION_APPROVED,
      userId: user.id,
      officeId: submission.officeId,
      targetType: 'intake_submission',
      targetId: id,
      metadata: { portfolioId: created.id },
    });

    return { success: true, portfolioId: created.id };
  }

  async rejectSubmission(user: AuthUser, id: string, reason?: string) {
    const submission = await this.getSubmission(user, id);
    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Bu başvuru zaten sonuçlandırılmış');
    }

    await this.prisma.portfolioSubmission.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.INTAKE_SUBMISSION_REJECTED,
      userId: user.id,
      officeId: submission.officeId,
      targetType: 'intake_submission',
      targetId: id,
      metadata: reason ? { reason } : undefined,
    });

    return { success: true };
  }

  // ── Yardımcılar ──

  private async processImages(submissionId: string, files: Express.Multer.File[]) {
    const dir = path.join(uploadsDir(), 'intake', submissionId);
    fs.mkdirSync(dir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
      await sharp(file.buffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(dir, filename));
      urls.push(`/uploads/intake/${submissionId}/${filename}`);
    }
    return urls;
  }

  private copySubmissionImages(
    submissionId: string,
    imageUrls: string[],
    portfolioId: string,
  ): string[] {
    if (!imageUrls.length) return [];
    const srcDir = path.join(uploadsDir(), 'intake', submissionId);
    const destDir = path.join(uploadsDir(), 'portfolio', portfolioId);
    fs.mkdirSync(destDir, { recursive: true });

    const urls: string[] = [];
    for (const url of imageUrls) {
      const filename = path.basename(url);
      const src = path.join(srcDir, filename);
      if (!fs.existsSync(src)) continue;
      fs.copyFileSync(src, path.join(destDir, filename));
      urls.push(`/uploads/portfolio/${portfolioId}/${filename}`);
    }
    return urls;
  }

  private toLinkResponse(
    link: {
      id: string;
      token: string;
      label: string | null;
      status: string;
      expiresAt: Date;
      createdAt: Date;
    },
    submissionCount: number,
  ) {
    const base = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(
      /\/$/,
      '',
    );
    return {
      id: link.id,
      label: link.label,
      status: link.status,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      submissionCount,
      link: `${base}/basvuru/${link.token}`,
    };
  }
}
