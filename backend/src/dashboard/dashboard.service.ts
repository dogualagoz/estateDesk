import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const [portfolioCount, demandCount, activeDemandCount, recentPortfolios, recentDemands] =
      await this.prisma.$transaction([
        this.prisma.portfolio.count({ where: { deletedAt: null } }),
        this.prisma.demand.count({ where: { deletedAt: null } }),
        this.prisma.demand.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        this.prisma.portfolio.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.demand.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    return {
      portfolioCount,
      demandCount,
      activeDemandCount,
      recentPortfolios,
      recentDemands,
    };
  }
}
