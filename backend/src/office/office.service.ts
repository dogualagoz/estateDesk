import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { attachMemberCounts } from '../common/member-counts.util';
import { CreateOfficeDto } from './dto/create-office.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { ExportDataset } from './dto/export-query.dto';
import {
  PORTFOLIO_COLUMNS,
  DEMAND_COLUMNS,
  buildCsv,
  buildXlsx,
  type ExportColumn,
} from './office-export';

const INVITE_TTL_DAYS = 7;

@Injectable()
export class OfficeService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  /** Yeni ofis kurar; kurucu ofis yöneticisi (ADMIN) ve üyesi olur. */
  async createOffice(user: AuthUser, dto: CreateOfficeDto) {
    if (user.officeId) throw new ConflictException('Zaten bir ofise bağlısınız');
    const owned = await this.prisma.office.findUnique({ where: { ownerId: user.id } });
    if (owned) throw new ConflictException('Zaten bir ofis kurdunuz');

    const office = await this.prisma.$transaction(async (tx) => {
      const created = await tx.office.create({ data: { name: dto.name, ownerId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: { officeId: created.id, role: Role.ADMIN },
      });
      return created;
    });

    return this.getOfficeSummary(office.id);
  }

  async getMyOffice(user: AuthUser) {
    const officeId = requireOfficeId(user);
    return this.getOfficeSummary(officeId);
  }

  /** Ofis adını günceller (yalnız yönetici). */
  async updateOffice(user: AuthUser, dto: UpdateOfficeDto) {
    const officeId = requireOfficeId(user);
    await this.prisma.office.update({
      where: { id: officeId },
      data: { name: dto.name.trim() },
    });
    return this.getOfficeSummary(officeId);
  }

  /**
   * Bir üyenin rolünü değiştirir (yönetici ↔ danışman).
   * Ofis kurucusunun rolü düşürülemez; yönetici kendi rolünü değiştiremez.
   */
  async changeMemberRole(user: AuthUser, memberId: string, role: Role) {
    const officeId = requireOfficeId(user);

    if (memberId === user.id) {
      throw new BadRequestException('Kendi rolünüzü değiştiremezsiniz');
    }

    const member = await this.prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.officeId !== officeId) {
      throw new NotFoundException('Kullanıcı bu ofisin üyesi değil');
    }

    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { ownerId: true },
    });
    if (office?.ownerId === member.id && role !== Role.ADMIN) {
      throw new BadRequestException('Ofis kurucusunun yöneticiliği kaldırılamaz');
    }

    await this.prisma.user.update({ where: { id: memberId }, data: { role } });
    return { success: true };
  }

  private async getOfficeSummary(officeId: string) {
    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      include: {
        owner: { select: { id: true, fullName: true } },
        _count: { select: { members: true, portfolios: true, demands: true } },
      },
    });
    if (!office) throw new NotFoundException('Ofis bulunamadı');
    return office;
  }

  /** Ofis üyeleri — her üye görebilir (profil linkleri için). */
  async listMembers(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const members = await this.prisma.user.findMany({
      where: { officeId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return attachMemberCounts(this.prisma, members, officeId);
  }

  /** Ofisten üye çıkart (ADMIN tarafından). */
  async removeMember(user: AuthUser, memberId: string) {
    const officeId = requireOfficeId(user);

    const member = await this.prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.officeId !== officeId) {
      throw new NotFoundException('Kullanıcı bu ofisin üyesi değil');
    }

    if (member.id === user.id) {
      throw new BadRequestException('Kendi kendinizi çıkartamazsınız');
    }

    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { ownerId: true },
    });
    if (office?.ownerId === member.id) {
      throw new BadRequestException('Ofis kurucusu çıkartılamaz');
    }

    await this.prisma.user.update({
      where: { id: memberId },
      data: { officeId: null },
    });

    return { success: true };
  }

  /** Ofisten çıkma — kimliği doğrulanmış kullanıcı kendisini çıkartır. */
  async leaveOffice(user: AuthUser) {
    const officeId = requireOfficeId(user);

    // Kurucu kendisini çıkartamaz (ofisini daha sonra silebilir)
    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { ownerId: true },
    });
    if (office?.ownerId === user.id) {
      throw new BadRequestException('Ofis kurucusu ofisten çıkalamaz');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { officeId: null },
    });

    return { success: true };
  }

  /** Yöneticinin davet linki üretmesi (email isteğe bağlı). */
  async createInvite(user: AuthUser, dto: CreateInviteDto) {
    const officeId = requireOfficeId(user);
    const email = dto.email?.toLowerCase().trim();

    // E-posta varsa, o kişinin daha önce davet alıp almadığını kontrol et
    if (email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser?.officeId === officeId) {
        throw new ConflictException('Bu kişi zaten ofisinizde');
      }

      const now = new Date();
      let existingInvite = await this.prisma.invite.findFirst({
        where: { officeId, email, status: 'PENDING' },
      });

      if (existingInvite && existingInvite.expiresAt > now) {
        return this.toInviteResponse(existingInvite);
      }
    }

    const now = new Date();
    const invite = await this.prisma.invite.create({
      data: {
        email,
        officeId,
        invitedById: user.id,
        expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return this.toInviteResponse(invite);
  }

  async listInvites(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const invites = await this.prisma.invite.findMany({
      where: { officeId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => this.toInviteResponse(i));
  }

  async revokeInvite(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const invite = await this.prisma.invite.findFirst({ where: { id, officeId } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');
    await this.prisma.invite.update({ where: { id }, data: { status: 'REVOKED' } });
    return { success: true };
  }

  /**
   * Ofisin tek paylaşılan davet linkini döndürür (Notion/Figma mantığı).
   * Birden fazla geçerli genel (e-postasız) link varsa en yenisini tutar,
   * gerisini iptal eder. Geçerli link yoksa yeni bir tane oluşturur.
   */
  async getInviteLink(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const now = new Date();

    const invites = await this.prisma.invite.findMany({
      where: { officeId, email: null, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const valid = invites.filter((i) => i.expiresAt > now);

    if (valid.length > 0) {
      const [keep, ...extra] = valid;
      // Fazlalık geçerli linkleri ve süresi dolmuşları iptal et — tek link kalsın
      const stale = [...extra, ...invites.filter((i) => i.expiresAt <= now)];
      if (stale.length) {
        await this.prisma.invite.updateMany({
          where: { id: { in: stale.map((i) => i.id) } },
          data: { status: 'REVOKED' },
        });
      }
      return this.toInviteResponse(keep);
    }

    return this.createSharedInvite(user.id, officeId, now);
  }

  /** Mevcut paylaşılan linki iptal edip yeni bir tane üretir. */
  async resetInviteLink(user: AuthUser) {
    const officeId = requireOfficeId(user);
    await this.prisma.invite.updateMany({
      where: { officeId, email: null, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });
    return this.createSharedInvite(user.id, officeId, new Date());
  }

  private async createSharedInvite(userId: string, officeId: string, now: Date) {
    const invite = await this.prisma.invite.create({
      data: {
        officeId,
        invitedById: userId,
        expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return this.toInviteResponse(invite);
  }

  /** Davet linki açıldığında gösterilecek önizleme (public). */
  async previewInvite(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        office: { select: { name: true } },
        invitedBy: { select: { fullName: true } },
      },
    });
    if (!invite) throw new NotFoundException('Davet bulunamadı');

    const now = new Date();
    const valid = invite.status === 'PENDING' && invite.expiresAt > now;
    const expiresInMs = invite.expiresAt.getTime() - now.getTime();
    const expiresInSeconds = Math.max(0, Math.floor(expiresInMs / 1000));
    const expiresInDays = Math.floor(expiresInSeconds / (24 * 3600));

    return {
      officeName: invite.office.name,
      invitedByName: invite.invitedBy.fullName,
      status: invite.status,
      expiresAt: invite.expiresAt,
      expiresInSeconds,
      expiresInDays,
      valid,
    };
  }

  /** Kimliği doğrulanmış, ofissiz kullanıcının daveti kabul edip ofise katılması. */
  async acceptInvite(user: AuthUser, token: string) {
    if (user.officeId) throw new ConflictException('Zaten bir ofistesiniz');

    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');
    if (invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new BadRequestException('Davet artık geçerli değil');
    }

    // Paylaşılan link (email yok) çok kullanımlıdır: PENDING kalır, takımdaki
    // herkes aynı linkle katılabilir. Kişiye özel davet ise tek kullanımlıktır.
    const isShared = invite.email === null;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { officeId: invite.officeId, role: Role.AGENT },
      }),
      ...(isShared
        ? []
        : [
            this.prisma.invite.update({
              where: { id: invite.id },
              data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedByEmail: user.email },
            }),
          ]),
    ]);

    return this.getOfficeSummary(invite.officeId);
  }

  /** Davet linki ile kayıt ol ve ofise katıl (public). */
  async registerWithInvite(
    token: string,
    dto: { email: string; password: string; fullName: string },
  ) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');
    if (invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new BadRequestException('Davet artık geçerli değil');
    }

    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Paylaşılan link (email yok) çok kullanımlıdır: PENDING kalır.
    // Kişiye özel davet ise kabul edilince tükenir (ACCEPTED).
    const isShared = invite.email === null;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          fullName: dto.fullName,
          passwordHash,
          role: Role.AGENT,
          officeId: invite.officeId,
        },
      });

      if (!isShared) {
        await tx.invite.update({
          where: { id: invite.id },
          data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedByEmail: email },
        });
      }

      return this.auth.buildSession(user);
    });
  }

  private toInviteResponse(invite: {
    id: string;
    email?: string | null;
    token: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  }) {
    const base = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const now = new Date();
    const expiresInMs = invite.expiresAt.getTime() - now.getTime();
    const expiresInSeconds = Math.max(0, Math.floor(expiresInMs / 1000));
    const expiresInDays = Math.floor(expiresInSeconds / (24 * 3600));

    return {
      id: invite.id,
      email: invite.email,
      token: invite.token,
      status: invite.status,
      expiresAt: invite.expiresAt,
      expiresInSeconds,
      expiresInDays,
      createdAt: invite.createdAt,
      link: `${base}/invite/${invite.token}`,
    };
  }

  /**
   * Ofis portföy/talep verilerini CSV veya XLSX olarak dışa aktarır.
   * Opsiyonel `memberId` ile tek bir danışmanın kayıtlarıyla sınırlanır.
   * Daima ofis kapsamında çalışır (ofis izolasyonu).
   */
  async exportData(
    user: AuthUser,
    dataset: ExportDataset,
    format: 'csv' | 'xlsx',
    memberId?: string,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const officeId = requireOfficeId(user);

    let memberSlug = 'tum-ofis';
    if (memberId) {
      const member = await this.prisma.user.findFirst({
        where: { id: memberId, officeId },
        select: { fullName: true },
      });
      if (!member) throw new NotFoundException('Danışman bu ofisin üyesi değil');
      memberSlug = slugify(member.fullName);
    }

    const where: any = { officeId, deletedAt: null };
    if (memberId) where.createdById = memberId;

    let columns: ExportColumn[];
    let rows: any[];
    let label: string;

    if (dataset === ExportDataset.PORTFOLIOS) {
      columns = PORTFOLIO_COLUMNS;
      label = 'Portfoyler';
      rows = await this.prisma.portfolio.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { fullName: true } } },
      });
    } else {
      columns = DEMAND_COLUMNS;
      label = 'Talepler';
      rows = await this.prisma.demand.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { fullName: true } } },
      });
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const baseName = `EstateDesk_${label}_${memberSlug}_${stamp}`;

    if (format === 'csv') {
      return {
        buffer: buildCsv(columns, rows),
        filename: `${baseName}.csv`,
        contentType: 'text/csv; charset=utf-8',
      };
    }

    return {
      buffer: await buildXlsx(columns, rows, label),
      filename: `${baseName}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}

/** Türkçe karakterleri sadeleştirip dosya adına uygun slug üretir. */
function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };
  return (
    input
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => map[c] ?? c)
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'danisman'
  );
}
