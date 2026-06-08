import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private matching: MatchingService,
  ) {}

  async stats(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const hasNote = { AND: [{ note: { not: null } }, { note: { not: '' } }] };

    const [
      portfolioCount,
      demandCount,
      activeDemandCount,
      portfoliosWithNotes,
      demandsWithNotes,
      pinnedMatchCount,
      closedDemandCount,
      recentPortfolios,
      recentDemands,
    ] = await this.prisma.$transaction([
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
      this.prisma.demandMatch.count({ where: { officeId } }),
      this.prisma.demand.count({ where: { deletedAt: null, officeId, status: 'CLOSED' } }),
      this.prisma.portfolio.findMany({
        where: { deletedAt: null, officeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          listingType: true,
          city: true,
          district: true,
          price: true,
          createdAt: true,
          title: true,
          createdBy: { select: { fullName: true } },
        },
      }),
      this.prisma.demand.findMany({
        where: { deletedAt: null, officeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          customerName: true,
          types: true,
          regions: true,
          minBudget: true,
          maxBudget: true,
          createdAt: true,
          createdBy: { select: { fullName: true } },
        },
      }),
    ]);

    return {
      portfolioCount,
      demandCount,
      activeDemandCount,
      pinnedMatchCount,
      closedDemandCount,
      portfoliosWithNotes,
      demandsWithNotes,
      recentPortfolios,
      recentDemands,
    };
  }

  async pendingMatches(user: AuthUser) {
    const officeId = requireOfficeId(user);

    const pendingDemands = await this.prisma.demand.findMany({
      where: {
        deletedAt: null,
        officeId,
        status: 'ACTIVE',
        demandMatches: { none: {} },
      },
      orderBy: { createdAt: 'asc' },
      take: 7,
      select: {
        id: true,
        customerName: true,
        types: true,
        listingType: true,
        regions: true,
        city: true,
        district: true,
        neighborhood: true,
        districts: true,
        neighborhoods: true,
        minBudget: true,
        maxBudget: true,
        roomPreferences: true,
        minArea: true,
        maxArea: true,
        featurePrefs: true,
        mustHaveFeatures: true,
        bonusFeatures: true,
        createdAt: true,
        createdBy: { select: { fullName: true } },
      },
    });

    const itemsWithMatches = await Promise.all(
      pendingDemands.map(async (demand) => {
        try {
          const matchedPortfolios = await this.matching.matchPortfolios(user, {
            types: demand.types,
            listingType: demand.listingType,
            city: demand.city ?? undefined,
            district: demand.district ?? undefined,
            neighborhood: demand.neighborhood ?? undefined,
            districts: demand.districts ?? undefined,
            neighborhoods: demand.neighborhoods ?? undefined,
            minBudget: demand.minBudget ? Number(demand.minBudget) : undefined,
            maxBudget: demand.maxBudget ? Number(demand.maxBudget) : undefined,
            roomPreferences: demand.roomPreferences,
            minArea: demand.minArea ?? undefined,
            maxArea: demand.maxArea ?? undefined,
            mustHaveFeatures: demand.mustHaveFeatures,
            bonusFeatures: demand.bonusFeatures,
          });

          return {
            demand,
            topMatch: matchedPortfolios[0] || null,
          };
        } catch (err) {
          return { demand, topMatch: null };
        }
      }),
    );

    return itemsWithMatches;
  }
}
