import { PrismaService } from '../prisma/prisma.service';

/**
 * Üye listesine aktif (silinmemiş) portföy/talep sayılarını ekler.
 * Üye başına ayrı sorgu (N+1) yerine iki groupBy sorgusu kullanır.
 */
export async function attachMemberCounts<T extends { id: string }>(
  prisma: PrismaService,
  members: T[],
  officeId: string,
): Promise<(T & { portfolioCount: number; demandCount: number })[]> {
  if (!members.length) return [];
  const ids = members.map((m) => m.id);

  const [portfolioCounts, demandCounts] = await Promise.all([
    prisma.portfolio.groupBy({
      by: ['createdById'],
      where: { createdById: { in: ids }, officeId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.demand.groupBy({
      by: ['createdById'],
      where: { createdById: { in: ids }, officeId, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const pCounts = new Map(portfolioCounts.map((c) => [c.createdById, c._count._all]));
  const dCounts = new Map(demandCounts.map((c) => [c.createdById, c._count._all]));

  return members.map((m) => ({
    ...m,
    portfolioCount: pCounts.get(m.id) ?? 0,
    demandCount: dCounts.get(m.id) ?? 0,
  }));
}
