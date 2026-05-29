import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { MatchPortfoliosDto } from './dto/match-portfolios.dto';
import {
  MatchCriteria,
  MatchResult,
  ScoringPortfolio,
  matchScore,
  normalizeText,
  roomIndex,
} from './matching.scoring';
import { MIN_SCORE, PRICE_STRETCH } from './matching.constants';

type PortfolioRow = Prisma.PortfolioGetPayload<{
  include: { createdBy: { select: { id: true; fullName: true } } };
}>;

export interface ScoredPortfolio extends MatchResult {
  portfolio: Omit<PortfolioRow, 'price'> & { price: number };
  matchedFeatures: string[];
  isHidden: boolean;
}

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  async matchPortfolios(user: AuthUser, dto: MatchPortfoliosDto): Promise<ScoredPortfolio[]> {
    const officeId = requireOfficeId(user);
    const criteria: MatchCriteria = dto;

    // ── Katman 1: kaba DB filtresi (güvenilir alanlar) ──
    // Türkçe normalizasyon gerektiren eşleşmeler (şehir/oda/özellik) bellekte yapılır.
    const where: Prisma.PortfolioWhereInput = { deletedAt: null, officeId };
    if (dto.types?.length) where.type = { in: dto.types };
    if (dto.listingType) where.listingType = dto.listingType;

    const rows = await this.prisma.portfolio.findMany({
      where,
      include: { createdBy: { select: { id: true, fullName: true } } },
    });

    const wantedCity = normalizeText(criteria.city);
    const priceCeiling =
      criteria.maxBudget != null ? criteria.maxBudget * (1 + PRICE_STRETCH) : null;
    const roomFloorIdx = this.minRoomFloor(criteria.roomPreferences);
    const mustHave = (criteria.mustHaveFeatures ?? []).map(normalizeText);

    const results: ScoredPortfolio[] = [];

    for (const row of rows) {
      const price = Number(row.price);

      // ── Katman 1 (devam): bellekte sert filtreler ──
      if (wantedCity && normalizeText(row.city) !== wantedCity) continue;
      if (priceCeiling != null && price > priceCeiling) continue;
      if (roomFloorIdx >= 0) {
        const rIdx = roomIndex(row.roomCount);
        if (rIdx < 0 || rIdx < roomFloorIdx) continue;
      }
      if (mustHave.length) {
        const have = new Set(row.features.map(normalizeText));
        if (!mustHave.every((f) => have.has(f))) continue;
      }

      // ── Katman 2: skorlama ──
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
      if (result.score < MIN_SCORE) continue;

      results.push({
        ...result,
        portfolio: { ...row, price },
        matchedFeatures: this.matchedFeatures(row.features, criteria),
        isHidden: row.visibility === 'HIDDEN',
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /** Seçilen oda tercihleri içindeki en küçük ordinal indeks (min-oda sert filtre tabanı). */
  private minRoomFloor(prefs?: string[]): number {
    if (!prefs?.length) return -1;
    const idxs = prefs.map(roomIndex).filter((i) => i >= 0);
    return idxs.length ? Math.min(...idxs) : -1;
  }

  /** Kartta gösterilecek eşleşen özellikler (must-have + bonus ∩ portföy). */
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
