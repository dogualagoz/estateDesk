import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditLogsQueryDto, AdminRequestLogsQueryDto } from './dto/admin-query.dto';

/**
 * Log inceleme uçlarının sorgu katmanı. Loglarda userId'ler FK'sız
 * tutulduğundan, görünen kayıtlar için kullanıcı adları toplu tek
 * sorguyla eklenir (N+1 yok).
 */
@Injectable()
export class AdminLogsService {
  constructor(private prisma: PrismaService) {}

  async requestLogs(query: AdminRequestLogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.RequestLogWhereInput = {};
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.statusCode) where.statusCode = query.statusCode;
    else if (query.errorsOnly) where.statusCode = { gte: 400 };
    if (query.userId) where.userId = query.userId;
    if (query.path?.trim()) where.path = { contains: query.path.trim(), mode: 'insensitive' };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.requestLog.count({ where }),
      this.prisma.requestLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: await this.attachUserNames(items), total, page, pageSize };
  }

  async auditLogs(query: AdminAuditLogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.action?.trim()) where.action = { startsWith: query.action.trim() };
    if (query.userId) where.userId = query.userId;
    if (query.officeId) where.officeId = query.officeId;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: await this.attachUserNames(items), total, page, pageSize };
  }

  /** Kayıtlardaki userId'lere ad/e-posta ekler (silinmiş kullanıcıda null kalır). */
  private async attachUserNames<T extends { userId: string | null }>(items: T[]) {
    const ids = [...new Set(items.map((i) => i.userId).filter((v): v is string => !!v))];
    if (ids.length === 0) return items.map((i) => ({ ...i, user: null }));

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true, email: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return items.map((i) => ({ ...i, user: i.userId ? (byId.get(i.userId) ?? null) : null }));
  }
}
