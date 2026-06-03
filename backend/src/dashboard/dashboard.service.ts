import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const hasNote = { AND: [{ note: { not: null } }, { note: { not: '' } }] };

    const [portfolioCount, demandCount, activeDemandCount, portfoliosWithNotes, demandsWithNotes] =
      await this.prisma.$transaction([
        this.prisma.portfolio.count({ where: { deletedAt: null, officeId } }),
        this.prisma.demand.count({ where: { deletedAt: null, officeId } }),
        this.prisma.demand.count({ where: { deletedAt: null, officeId, status: 'ACTIVE' } }),
        this.prisma.portfolio.findMany({
          where: { deletedAt: null, officeId, ...hasNote },
          orderBy: { updatedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            listingType: true,
            city: true,
            district: true,
            price: true,
            note: true,
            updatedAt: true,
            title: true,
            createdBy: { select: { fullName: true } },
          },
        }),
        this.prisma.demand.findMany({
          where: { deletedAt: null, officeId, ...hasNote },
          orderBy: { updatedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            customerName: true,
            minBudget: true,
            maxBudget: true,
            regions: true,
            note: true,
            updatedAt: true,
            status: true,
            createdBy: { select: { fullName: true } },
          },
        }),
      ]);

    return { portfolioCount, demandCount, activeDemandCount, portfoliosWithNotes, demandsWithNotes };
  }
}
