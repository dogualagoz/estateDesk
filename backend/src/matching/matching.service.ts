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

type DemandRow = Prisma.DemandGetPayload<object>;

export interface ScoredPortfolio extends MatchResult {
  portfolio: Omit<PortfolioRow, 'price'> & { price: number };
  matchedFeatures: string[];
  isHidden: boolean;
}

/** Talep kartında gösterilecek hafif en-iyi-eşleşme özeti. */
export interface BestMatchSummary {
  portfolioId: string;
  title: string | null;
  type: string;
  listingType: string;
  city: string;
  district: string;
  neighborhood: string | null;
  roomCount: string;
  price: number;
  image: string | null;
  score: number;
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

    const results = this.scoreRows(rows, criteria);
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Bir grup talep için en iyi eşleşen portföyü tek DB sorgusuyla hesaplar.
   * Talep listesi kartlarında küçük önizleme göstermek için kullanılır.
   */
  async bestMatchForDemands(
    officeId: string,
    demands: DemandRow[],
  ): Promise<Record<string, BestMatchSummary | null>> {
    const out: Record<string, BestMatchSummary | null> = {};
    if (!demands.length) return out;

    const rows = await this.prisma.portfolio.findMany({
      where: { deletedAt: null, officeId, visibility: 'PUBLIC' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    if (!rows.length) {
      for (const d of demands) out[d.id] = null;
      return out;
    }

    for (const demand of demands) {
      const criteria = this.demandToCriteria(demand);
      const scored = this.scoreRows(rows, criteria);
      if (!scored.length) {
        out[demand.id] = null;
        continue;
      }
      const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
      const p = best.portfolio;
      out[demand.id] = {
        portfolioId: p.id,
        title: p.title,
        type: p.type,
        listingType: p.listingType,
        city: p.city,
        district: p.district,
        neighborhood: p.neighborhood,
        roomCount: p.roomCount,
        price: p.price,
        image: p.images?.[0] ?? null,
        score: best.score,
      };
    }
    return out;
  }

  /** Portföy satırlarına bellekte sert filtre + skorlama uygular. */
  private scoreRows(rows: PortfolioRow[], criteria: MatchCriteria): ScoredPortfolio[] {
    const wantedTypes = criteria.types?.length
      ? new Set(criteria.types as string[])
      : null;
    const wantedListing = criteria.listingType ?? null;
    const wantedCity = normalizeText(criteria.city);
    const priceCeiling =
      criteria.maxBudget != null ? criteria.maxBudget * (1 + PRICE_STRETCH) : null;
    const roomFloorIdx = this.minRoomFloor(criteria.roomPreferences);
    const mustHave = (criteria.mustHaveFeatures ?? []).map(normalizeText);

    const results: ScoredPortfolio[] = [];

    for (const row of rows) {
      const price = Number(row.price);

      // ── Sert filtreler ──
      if (wantedTypes && !wantedTypes.has(row.type)) continue;
      if (wantedListing && row.listingType !== wantedListing) continue;
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

      // ── Skorlama ──
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

    return results;
  }

  /** Demand kaydını eşleştirme kriterlerine çevirir. */
  private demandToCriteria(d: DemandRow): MatchCriteria {
    return {
      types: d.types,
      listingType: d.listingType,
      city: d.city ?? undefined,
      district: d.district ?? undefined,
      neighborhood: d.neighborhood ?? undefined,
      districts: d.districts ?? undefined,
      neighborhoods: d.neighborhoods ?? undefined,
      minBudget: d.minBudget != null ? Number(d.minBudget) : undefined,
      maxBudget: d.maxBudget != null ? Number(d.maxBudget) : undefined,
      roomPreferences: d.roomPreferences ?? undefined,
      minArea: d.minArea ?? undefined,
      maxArea: d.maxArea ?? undefined,
      mustHaveFeatures: d.mustHaveFeatures ?? undefined,
      bonusFeatures: d.bonusFeatures ?? undefined,
    };
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
