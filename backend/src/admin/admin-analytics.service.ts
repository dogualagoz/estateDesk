import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sistem geneli metrikler (PostHog benzeri hafif analytics).
 * Veri kaynağı: AuditLog (giriş/kayıt olayları), RequestLog (trafik),
 * domain tabloları (büyüme). dashboard.service'in $transaction([count...])
 * deseni şablon alınmıştır — ama ofis filtresi YOKTUR (cross-office).
 */
@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Üst bar özeti: toplamlar + son 24 saat sinyalleri. */
  async overview() {
    const dayAgo = new Date(Date.now() - DAY_MS);

    const [
      totalUsers,
      activeUsers,
      totalOffices,
      totalPortfolios,
      totalDemands,
      loginsToday,
      errorsToday,
      requestsToday,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.office.count(),
      this.prisma.portfolio.count({ where: { deletedAt: null } }),
      this.prisma.demand.count({ where: { deletedAt: null } }),
      this.prisma.auditLog.count({
        where: { action: AUDIT_ACTIONS.AUTH_LOGIN, createdAt: { gte: dayAgo } },
      }),
      this.prisma.requestLog.count({
        where: { statusCode: { gte: 500 }, createdAt: { gte: dayAgo } },
      }),
      this.prisma.requestLog.count({ where: { createdAt: { gte: dayAgo } } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalOffices,
      totalPortfolios,
      totalDemands,
      last24h: { logins: loginsToday, requests: requestsToday, serverErrors: errorsToday },
    };
  }

  /** DAU/WAU/MAU + dönem içi büyüme + en aktif ofisler. */
  async summary(days: number) {
    const since = new Date(Date.now() - days * DAY_MS);

    const distinctLoginUsers = (from: Date) =>
      this.prisma.auditLog
        .findMany({
          where: { action: AUDIT_ACTIONS.AUTH_LOGIN, createdAt: { gte: from }, userId: { not: null } },
          distinct: ['userId'],
          select: { userId: true },
        })
        .then((rows) => rows.length);

    const [dau, wau, mau, newUsers, newOffices, logins] = await Promise.all([
      distinctLoginUsers(new Date(Date.now() - DAY_MS)),
      distinctLoginUsers(new Date(Date.now() - 7 * DAY_MS)),
      distinctLoginUsers(new Date(Date.now() - 30 * DAY_MS)),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.office.count({ where: { createdAt: { gte: since } } }),
      this.prisma.auditLog.count({
        where: { action: AUDIT_ACTIONS.AUTH_LOGIN, createdAt: { gte: since } },
      }),
    ]);

    // En aktif 10 ofis: dönem içi istek hacmine göre (RequestLog.officeId)
    const topOfficesRaw = await this.prisma.requestLog.groupBy({
      by: ['officeId'],
      where: { createdAt: { gte: since }, officeId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { officeId: 'desc' } },
      take: 10,
    });
    const officeIds = topOfficesRaw.map((r) => r.officeId).filter((v): v is string => !!v);
    const offices = await this.prisma.office.findMany({
      where: { id: { in: officeIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(offices.map((o) => [o.id, o.name]));
    const topOffices = topOfficesRaw.map((r) => ({
      officeId: r.officeId,
      name: r.officeId ? (nameById.get(r.officeId) ?? '(silinmiş ofis)') : '',
      requests: r._count._all,
    }));

    return { days, dau, wau, mau, newUsers, newOffices, logins, topOffices };
  }

  /** Grafik verisi: seçilen metriğin günlük kırılımı (eksik günler 0 doldurulur). */
  async timeseries(metric: 'logins' | 'signups' | 'requests', days: number) {
    const since = new Date(Date.now() - days * DAY_MS);

    let rows: { day: Date; count: number }[];
    if (metric === 'requests') {
      rows = await this.prisma.$queryRaw(Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "RequestLog" WHERE "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1`);
    } else if (metric === 'signups') {
      rows = await this.prisma.$queryRaw(Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "User" WHERE "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1`);
    } else {
      rows = await this.prisma.$queryRaw(Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "AuditLog" WHERE action = ${AUDIT_ACTIONS.AUTH_LOGIN} AND "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1`);
    }

    // Grafikte boşluk olmasın: aralıktaki her gün için 0 dolgusu
    const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r.count]));
    const points: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
      points.push({ date, count: byDay.get(date) ?? 0 });
    }

    return { metric, days, points };
  }

  /** Sistem sağlığı: DB ping, uptime, log tablo boyutları. */
  async system() {
    const dbStart = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbPingMs = Date.now() - dbStart;

    const [requestLogCount, auditLogCount] = await this.prisma.$transaction([
      this.prisma.requestLog.count(),
      this.prisma.auditLog.count(),
    ]);

    return {
      dbPingMs,
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      tables: { requestLogs: requestLogCount, auditLogs: auditLogCount },
    };
  }
}
