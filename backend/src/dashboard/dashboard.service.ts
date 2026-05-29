import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const [portfolioCount, demandCount, activeDemandCount, recentPortfolios, recentDemands] =
      await this.prisma.$transaction([
        this.prisma.portfolio.count({ where: { deletedAt: null, officeId } }),
        this.prisma.demand.count({ where: { deletedAt: null, officeId } }),
        this.prisma.demand.count({ where: { deletedAt: null, officeId, status: 'ACTIVE' } }),
        this.prisma.portfolio.findMany({
          where: { deletedAt: null, officeId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.demand.findMany({
          where: { deletedAt: null, officeId },
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
