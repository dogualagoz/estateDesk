import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import {
  MatchCriteria,
  ScoringPortfolio,
  matchScore,
  normalizeText,
} from '../matching/matching.scoring';
import type { ScoredPortfolio } from '../matching/matching.service';

@Injectable()
export class DemandMatchService {
  constructor(private prisma: PrismaService) {}

  async pin(user: AuthUser, demandId: string, portfolioId: string) {
    const officeId = requireOfficeId(user);

    const demand = await this.prisma.demand.findFirst({
      where: { id: demandId, deletedAt: null, officeId },
    });
    if (!demand) throw new NotFoundException('Talep bulunamadı');

    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, deletedAt: null, officeId },
    });
    if (!portfolio) throw new NotFoundException('Portföy bulunamadı');

    return this.prisma.demandMatch.upsert({
      where: { demandId_portfolioId: { demandId, portfolioId } },
      create: { demandId, portfolioId, officeId, pinnedById: user.id },
      update: {},
    });
  }

  async unpin(user: AuthUser, demandId: string, portfolioId: string) {
    const officeId = requireOfficeId(user);
    const match = await this.prisma.demandMatch.findFirst({
      where: { demandId, portfolioId, officeId },
    });
    if (!match) throw new NotFoundException('Eşleştirme bulunamadı');
    await this.prisma.demandMatch.delete({ where: { id: match.id } });
    return { success: true };
  }

  async listPinned(user: AuthUser, demandId: string): Promise<ScoredPortfolio[]> {
    const officeId = requireOfficeId(user);

    const demand = await this.prisma.demand.findFirst({
      where: { id: demandId, deletedAt: null, officeId },
    });
    if (!demand) throw new NotFoundException('Talep bulunamadı');

    const matches = await this.prisma.demandMatch.findMany({
      where: { demandId, officeId },
      include: {
        portfolio: { include: { createdBy: { select: { id: true, fullName: true } } } },
      },
      orderBy: { pinnedAt: 'desc' },
    });

    const criteria: MatchCriteria = {
      types: demand.types.length ? demand.types : undefined,
      listingType: demand.listingType,
      city: demand.city ?? undefined,
      districts: demand.districts.length ? demand.districts : undefined,
      neighborhoods: demand.neighborhoods.length ? demand.neighborhoods : undefined,
      minBudget: demand.minBudget ? Number(demand.minBudget) : undefined,
      maxBudget: demand.maxBudget ? Number(demand.maxBudget) : undefined,
      roomPreferences: demand.roomPreferences.length ? demand.roomPreferences : undefined,
      minArea: demand.minArea ?? undefined,
      maxArea: demand.maxArea ?? undefined,
      mustHaveFeatures: demand.mustHaveFeatures.length ? demand.mustHaveFeatures : undefined,
      bonusFeatures: demand.bonusFeatures.length ? demand.bonusFeatures : undefined,
    };

    return matches.map((m) => {
      const row = m.portfolio;
      const price = Number(row.price);
      const scoringInput: ScoringPortfolio = {
        type: row.type,
        listingType: row.listingType,
        city: row.city,
        district: row.district,
        neighborhood: row.neighborhood,
        areaSqm: row.areaSqm,
        roomCount: row.roomCount,
        price,
        features: row.features,
      };
      const result = matchScore(scoringInput, criteria);
      return {
        ...result,
        portfolio: { ...row, price },
        matchedFeatures: this.matchedFeatures(row.features, criteria),
        isHidden: row.visibility === 'HIDDEN',
      };
    });
  }

  private matchedFeatures(features: string[], c: MatchCriteria): string[] {
    const wanted = [...(c.mustHaveFeatures ?? []), ...(c.bonusFeatures ?? [])];
    const have = new Set(features.map(normalizeText));
    const seen = new Set<string>();
    const out: string[] = [];
    for (const w of wanted) {
      const n = normalizeText(w);
      if (have.has(n) && !seen.has(n)) {
        seen.add(n);
        out.push(w);
      }
    }
    return out;
  }
}
