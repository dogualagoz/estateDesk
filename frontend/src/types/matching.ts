import type { ListingType, Portfolio, PropertyType } from './portfolio';

export type DimensionKey = 'budget' | 'location' | 'room' | 'area' | 'feature';

/** Sol panelden gelen alıcı kriterleri. */
export interface MatchCriteria {
  types?: PropertyType[];
  listingType?: ListingType;
  city?: string;
  district?: string;
  neighborhood?: string;
  districts?: string[];
  neighborhoods?: string[];
  minBudget?: number;
  maxBudget?: number;
  roomPreferences?: string[];
  minArea?: number;
  maxArea?: number;
  mustHaveFeatures?: string[];
  bonusFeatures?: string[];
}

export interface DimensionResult {
  key: DimensionKey;
  active: boolean;
  score: number; // 0..1
  weight: number;
}

export interface ScoredPortfolio {
  portfolio: Portfolio;
  score: number; // 0..100
  reasons: DimensionKey[];
  gaps: DimensionKey[];
  breakdown: DimensionResult[];
  matchedFeatures: string[];
  isHidden: boolean;
}

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  budget: 'Bütçe',
  location: 'Konum',
  room: 'Oda',
  area: 'Metrekare',
  feature: 'Özellikler',
};
