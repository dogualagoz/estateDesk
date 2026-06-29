import type { ScoredPortfolio } from '../matching/matching.service';

/** Ziyaretçiye gönderilen, hassas alanları çıkarılmış skorlu portföy. */
export interface PublicScoredPortfolio {
  score: number;
  reasons: ScoredPortfolio['reasons'];
  gaps: ScoredPortfolio['gaps'];
  breakdown: ScoredPortfolio['breakdown'];
  matchedFeatures: string[];
  portfolio: {
    id: string;
    type: string;
    listingType: string;
    title: string | null;
    city: string;
    district: string;
    neighborhood: string | null;
    areaSqm: number;
    roomCount: string;
    price: number;
    features: string[];
    images: string[];
  };
}

/**
 * Skorlu portföyden satıcı iletişimini (ownerName/ownerPhone), dahili notu,
 * oluşturan kullanıcıyı, officeId ve görünürlük bilgisini çıkarır.
 */
export function sanitizeScoredPortfolio(s: ScoredPortfolio): PublicScoredPortfolio {
  const p = s.portfolio;
  return {
    score: s.score,
    reasons: s.reasons,
    gaps: s.gaps,
    breakdown: s.breakdown,
    matchedFeatures: s.matchedFeatures,
    portfolio: {
      id: p.id,
      type: p.type,
      listingType: p.listingType,
      title: p.title,
      city: p.city,
      district: p.district,
      neighborhood: p.neighborhood,
      areaSqm: p.areaSqm,
      roomCount: p.roomCount,
      price: p.price,
      features: p.features,
      images: p.images,
    },
  };
}

/** Defterin ziyaretçiye gösterilebilir olup olmadığını belirler (aktif ve süresi dolmamış). */
export function isShareViewable(
  share: { status: string; expiresAt: Date },
  now: Date = new Date(),
): boolean {
  return share.status === 'ACTIVE' && share.expiresAt > now;
}
