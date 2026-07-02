import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
import { AdminOfficesQueryDto } from './dto/admin-query.dto';

/** Süper admin ofis yönetimi — tüm ofisler, üye/portföy/talep sayılarıyla. */
@Injectable()
export class AdminOfficesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async list(query: AdminOfficesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.OfficeWhereInput = {};
    if (query.q?.trim()) {
      where.name = { contains: query.q.trim(), mode: 'insensitive' };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.office.count({ where }),
      this.prisma.office.findMany({
        where,
        include: {
          owner: { select: { id: true, fullName: true, email: true } },
          _count: { select: { members: true, portfolios: true, demands: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const office = await this.prisma.office.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { members: true, portfolios: true, demands: true, invites: true } },
      },
    });
    if (!office) throw new NotFoundException('Ofis bulunamadı');

    // Son aktivite: ofisin en yeni portföy/talep kaydı
    const [lastPortfolio, lastDemand] = await this.prisma.$transaction([
      this.prisma.portfolio.findFirst({
        where: { officeId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.demand.findFirst({
        where: { officeId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      ...office,
      lastActivityAt:
        [lastPortfolio?.createdAt, lastDemand?.createdAt]
          .filter((d): d is Date => !!d)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
    };
  }

  /**
   * Ofisi devre dışı bırakır: tüm üyeler deaktive edilir (login edemezler).
   * Hard delete YAPILMAZ — portföy/talep verileri ve denetim izi korunur;
   * ofis kaydı ileride yeniden aktive edilebilir (üyeler tek tek açılır).
   */
  async deactivate(admin: AuthUser, id: string) {
    const office = await this.prisma.office.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!office) throw new NotFoundException('Ofis bulunamadı');

    const result = await this.prisma.user.updateMany({
      where: { officeId: id },
      data: { isActive: false },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.ADMIN_OFFICE_DEACTIVATED,
      userId: admin.id,
      officeId: id,
      targetType: 'office',
      targetId: id,
      metadata: { name: office.name, deactivatedMembers: result.count },
    });

    return { success: true, deactivatedMembers: result.count };
  }
}
