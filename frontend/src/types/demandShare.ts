import type { DimensionKey, DimensionResult, ScoredPortfolio } from './matching';
import type { ListingType, Portfolio, PropertyType } from './portfolio';

export type DemandShareMode = 'ALL_MATCHES' | 'PINNED';
export type DemandShareStatus = 'ACTIVE' | 'REVOKED';

export const SHARE_MODE_LABELS: Record<DemandShareMode, string> = {
  ALL_MATCHES: 'Tüm eşleşmeler',
  PINNED: 'Eşleştirilenler',
};

/** Emlakçıya dönen defter kaydı (paylaşılabilir link dahil). */
export interface DemandShare {
  id: string;
  token: string;
  mode: DemandShareMode;
  note: string | null;
  status: DemandShareStatus;
  expiresAt: string;
  createdAt: string;
  link: string;
}

/** Ziyaretçiye gönderilen, satıcı iletişimi çıkarılmış portföy. */
export interface PublicPortfolio {
  id: string;
  type: PropertyType;
  listingType: ListingType;
  title: string | null;
  city: string;
  district: string;
  neighborhood: string | null;
  areaSqm: number;
  roomCount: string;
  price: number;
  features: string[];
  images: string[];
}

export interface PublicScoredPortfolio {
  score: number;
  reasons: DimensionKey[];
  gaps: DimensionKey[];
  breakdown: DimensionResult[];
  matchedFeatures: string[];
  portfolio: PublicPortfolio;
}

/** Sol panelde gösterilen talep kriterleri (müşteri/danışman bilgisi yok). */
export interface SharedDemandCriteria {
  types: PropertyType[];
  listingType: ListingType;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  districts: string[];
  neighborhoods: string[];
  minBudget: number | null;
  maxBudget: number | null;
  roomPreferences: string[];
  minArea: number | null;
  maxArea: number | null;
  mustHaveFeatures: string[];
  bonusFeatures: string[];
}

export interface SharedCollectionResponse {
  mode: DemandShareMode;
  note: string | null;
  expiresAt: string;
  officeName: string;
  demand: SharedDemandCriteria;
  matches: PublicScoredPortfolio[];
}

/**
 * Ziyaretçi verisini MatchCard/PortfolioDetailModal'ın beklediği tam Portfolio
 * şekline taşır; satıcı iletişimi placeholder kalır (görünümde gizlenir).
 */
export function toScoredPortfolio(m: PublicScoredPortfolio): ScoredPortfolio {
  const p = m.portfolio;
  const portfolio: Portfolio = {
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
    visibility: 'PUBLIC',
    note: null,
    ownerName: '',
    ownerPhone: '',
    createdById: '',
    createdAt: '',
    updatedAt: '',
  };
  return {
    portfolio,
    score: m.score,
    reasons: m.reasons,
    gaps: m.gaps,
    breakdown: m.breakdown,
    matchedFeatures: m.matchedFeatures,
    isHidden: false,
  };
}
