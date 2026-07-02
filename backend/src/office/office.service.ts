import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { attachMemberCounts } from '../common/member-counts.util';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { ExportDataset } from './dto/export-query.dto';
import {
  PORTFOLIO_COLUMNS,
  DEMAND_COLUMNS,
  buildCsv,
  buildXlsx,
  type ExportColumn,
} from './office-export';

/**
 * Ofis yaşam döngüsü ve üyelik yönetimi: kurma, ad güncelleme, üye
 * rolleri/çıkarma ve veri dışa aktarma. Davet akışının tamamı InviteService'te.
 */
@Injectable()
export class OfficeService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
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

    this.audit.log({
      action: AUDIT_ACTIONS.OFFICE_CREATED,
      userId: user.id,
      officeId: office.id,
      targetType: 'office',
      targetId: office.id,
      metadata: { name: office.name },
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

    this.audit.log({
      action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
      userId: user.id,
      officeId,
      targetType: 'user',
      targetId: memberId,
      metadata: { newRole: role },
    });

    return { success: true };
  }

  /** Ofis özeti (sahip + üye/portföy/talep sayıları). InviteService de kullanır. */
  async getOfficeSummary(officeId: string) {
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

    this.audit.log({
      action: AUDIT_ACTIONS.MEMBER_REMOVED,
      userId: user.id,
      officeId,
      targetType: 'user',
      targetId: memberId,
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

    this.audit.log({
      action: AUDIT_ACTIONS.MEMBER_LEFT,
      userId: user.id,
      officeId,
      targetType: 'office',
      targetId: officeId,
    });

    return { success: true };
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

    this.audit.log({
      action: AUDIT_ACTIONS.EXPORT_RUN,
      userId: user.id,
      officeId,
      metadata: { dataset, format, memberId: memberId ?? null, rowCount: rows.length },
    });

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
