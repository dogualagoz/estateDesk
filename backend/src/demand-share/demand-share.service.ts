import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DemandShare, DemandShareMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { MatchingService, demandToCriteria } from '../matching/matching.service';
import { DemandMatchService } from '../demand-match/demand-match.service';
import { CreateShareDto } from './dto/create-share.dto';
import { isShareViewable, sanitizeScoredPortfolio } from './demand-share.sanitize';

const SHARE_TTL_DAYS = 7;

@Injectable()
export class DemandShareService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private matching: MatchingService,
    private demandMatch: DemandMatchService,
  ) {}

  /** Talebe bağlı yeni bir paylaşılabilir defter linki oluşturur. */
  async createShare(user: AuthUser, demandId: string, dto: CreateShareDto) {
    const officeId = requireOfficeId(user);

    const demand = await this.prisma.demand.findFirst({
      where: { id: demandId, deletedAt: null, officeId },
    });
    if (!demand) throw new NotFoundException('Talep bulunamadı');

    const now = new Date();
    const share = await this.prisma.demandShare.create({
      data: {
        demandId,
        officeId,
        mode: dto.mode,
        note: dto.note?.trim() || null,
        createdById: user.id,
        expiresAt: new Date(now.getTime() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return this.toShareResponse(share);
  }

  /** Talebe ait aktif defterleri listeler. */
  async listShares(user: AuthUser, demandId: string) {
    const officeId = requireOfficeId(user);
    const shares = await this.prisma.demandShare.findMany({
      where: { demandId, officeId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    return shares.map((s) => this.toShareResponse(s));
  }

  /** Bir defteri iptal eder (link geçersizleşir). */
  async revokeShare(user: AuthUser, demandId: string, shareId: string) {
    const officeId = requireOfficeId(user);
    const share = await this.prisma.demandShare.findFirst({
      where: { id: shareId, demandId, officeId },
    });
    if (!share) throw new NotFoundException('Defter bulunamadı');
    await this.prisma.demandShare.update({
      where: { id: share.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
    return { success: true };
  }

  /** PUBLIC: Token ile defter içeriğini (kriterler + eşleşmeler) salt-okunur döndürür. */
  async getPublicCollection(token: string) {
    const share = await this.prisma.demandShare.findUnique({ where: { token } });
    if (!share || !isShareViewable(share)) {
      throw new NotFoundException('Defter bulunamadı veya süresi dolmuş');
    }

    const demand = await this.prisma.demand.findFirst({
      where: { id: share.demandId, deletedAt: null },
    });
    if (!demand) throw new NotFoundException('Defter bulunamadı veya süresi dolmuş');

    const office = await this.prisma.office.findUnique({
      where: { id: share.officeId },
      select: { name: true },
    });

    const scored =
      share.mode === DemandShareMode.PINNED
        ? await this.demandMatch.listPinnedForOffice(share.officeId, share.demandId, {
            publicOnly: true,
          })
        : await this.matching.scoreOfficePortfolios(
            share.officeId,
            demandToCriteria(demand),
            { publicOnly: true },
          );

    return {
      mode: share.mode,
      note: share.note,
      expiresAt: share.expiresAt,
      officeName: office?.name ?? '',
      demand: {
        types: demand.types,
        listingType: demand.listingType,
        city: demand.city,
        district: demand.district,
        neighborhood: demand.neighborhood,
        districts: demand.districts,
        neighborhoods: demand.neighborhoods,
        minBudget: demand.minBudget != null ? Number(demand.minBudget) : null,
        maxBudget: demand.maxBudget != null ? Number(demand.maxBudget) : null,
        roomPreferences: demand.roomPreferences,
        minArea: demand.minArea,
        maxArea: demand.maxArea,
        mustHaveFeatures: demand.mustHaveFeatures,
        bonusFeatures: demand.bonusFeatures,
      },
      matches: scored.map(sanitizeScoredPortfolio),
    };
  }

  private toShareResponse(share: DemandShare) {
    const base = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(
      /\/$/,
      '',
    );
    return {
      id: share.id,
      token: share.token,
      mode: share.mode,
      note: share.note,
      status: share.status,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
      link: `${base}/defter/${share.token}`,
    };
  }
}
