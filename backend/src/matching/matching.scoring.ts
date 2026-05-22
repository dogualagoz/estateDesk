/**
 * Saf (DB'siz) skorlama motoru — birim testi yapılabilir.
 *
 * Tasarım: deterministik, açıklanabilir, ağırlıklı doğrusal skor + aktif boyut
 * normalizasyonu. Trade-off dengeleme her boyutun kendi puan fonksiyonunda:
 * - Fiyat: bütçe üstü convex/penalty (büyük sapma sert düşer).
 * - Oda: ordinal uzaklığa göre diminishing returns.
 * - m²: capped (üst sınır 1.0 — fazla alan fiyat sapmasını kompanse edemez).
 * - Özellik: örtüşme oranı, capped.
 * Her boyut kendi ağırlığıyla sınırlı olduğundan küçük-ağırlıklı pozitifler
 * (m², özellik) büyük-ağırlıklı negatifi (fiyat) telafi edemez.
 */
import {
  DimensionKey,
  MATCH_THRESHOLD,
  NEUTRAL,
  PRICE_STRETCH,
  ROOM_DISTANCE_SCORES,
  ROOM_ORDER,
  TOL,
  WEIGHTS,
} from './matching.constants';

export interface ScoringPortfolio {
  type: string;
  listingType: string;
  city: string;
  district: string;
  neighborhood?: string | null;
  areaSqm: number;
  roomCount: string;
  price: number;
  features: string[];
}

export interface MatchCriteria {
  types?: string[];
  listingType?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
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

export interface MatchResult {
  score: number; // 0..100
  reasons: DimensionKey[];
  gaps: DimensionKey[];
  breakdown: DimensionResult[];
}

// ── Normalizasyon yardımcıları ────────────────────────────────────────────

/** Türkçe karakterleri ASCII'ye indirger ve küçük harfe çevirir (İ/ı tuzağı dahil). */
export function normalizeText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** "3 + 1" → "3+1"; karşılaştırma için boşlukları temizler. */
export function normalizeRoom(room: string | null | undefined): string {
  if (!room) return '';
  return room.replace(/\s+/g, '').toLowerCase();
}

/** ROOM_ORDER içindeki ordinal indeks; bulunamazsa -1. */
export function roomIndex(room: string | null | undefined): number {
  return ROOM_ORDER.indexOf(normalizeRoom(room));
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ── Boyut puan fonksiyonları (0..1) ─────────────────────────────────────────

/**
 * Fiyat yakınlığı. Bütçe içi 1.0; üst sınır aşımı convex penalty (sert düşüş);
 * alt sınır altı yumuşak (doğrusal) azalış.
 */
export function budgetScore(price: number, min?: number, max?: number): number {
  if (max != null && price > max) {
    const over = price - max;
    const band = PRICE_STRETCH * max; // sert filtre bandı
    const ratio = band > 0 ? over / band : 1;
    return clamp01(1 - ratio * ratio); // convex
  }
  if (min != null && price < min) {
    const under = min - price;
    const band = TOL * min;
    const ratio = band > 0 ? under / band : 1;
    return clamp01(1 - ratio); // doğrusal, daha yumuşak
  }
  return 1; // band içinde (veya tek taraflı sınırı karşılıyor)
}

/** Oda yakınlığı — ordinal uzaklığa göre diminishing. */
export function roomScore(roomCount: string, prefs: string[]): number {
  const idx = roomIndex(roomCount);
  if (idx < 0) return 0;
  let best = 0;
  for (const pref of prefs) {
    const pIdx = roomIndex(pref);
    if (pIdx < 0) continue;
    const dist = Math.abs(idx - pIdx);
    const s = ROOM_DISTANCE_SCORES[dist] ?? 0;
    if (s > best) best = s;
  }
  return best;
}

/** m² yakınlığı — band içi 1.0; band dışı azalır; üst sınır 1.0 (capped). */
export function areaScore(area: number, minArea?: number, maxArea?: number): number {
  if (maxArea != null && area > maxArea) {
    const over = area - maxArea;
    const band = TOL * maxArea;
    return clamp01(1 - (band > 0 ? over / band : 1));
  }
  if (minArea != null && area < minArea) {
    const under = minArea - area;
    const band = TOL * minArea;
    return clamp01(1 - (band > 0 ? under / band : 1));
  }
  return 1;
}

/** Konum — şehir zaten sert filtre; burada ilçe/mahalle eşleşmesi. */
export function locationScore(p: ScoringPortfolio, c: MatchCriteria): number {
  const district = normalizeText(c.district);
  if (!district) return 1; // ilçe belirtilmemiş (boyut zaten pasif olur)
  if (normalizeText(p.district) !== district) return 0;
  // İlçe tuttu; mahalle de istenmiş ve tutuyorsa tam, tutmuyorsa hafif düşük.
  const wantedHood = normalizeText(c.neighborhood);
  if (wantedHood && normalizeText(p.neighborhood) !== wantedHood) return 0.9;
  return 1;
}

/** Bonus özellik örtüşme oranı (capped). */
export function featureScore(portfolioFeatures: string[], bonus: string[]): number {
  if (!bonus.length) return 1;
  const have = new Set(portfolioFeatures.map(normalizeText));
  const hit = bonus.filter((f) => have.has(normalizeText(f))).length;
  return clamp01(hit / bonus.length);
}

// ── Boyut tanımları ─────────────────────────────────────────────────────────

interface Dimension {
  key: DimensionKey;
  weight: number;
  isActive: (c: MatchCriteria) => boolean;
  score: (p: ScoringPortfolio, c: MatchCriteria) => number;
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'budget',
    weight: WEIGHTS.budget,
    isActive: (c) => c.minBudget != null || c.maxBudget != null,
    score: (p, c) => budgetScore(p.price, c.minBudget, c.maxBudget),
  },
  {
    key: 'location',
    weight: WEIGHTS.location,
    isActive: (c) => !!normalizeText(c.district),
    score: (p, c) => locationScore(p, c),
  },
  {
    key: 'room',
    weight: WEIGHTS.room,
    isActive: (c) => !!c.roomPreferences?.length,
    score: (p, c) => roomScore(p.roomCount, c.roomPreferences ?? []),
  },
  {
    key: 'area',
    weight: WEIGHTS.area,
    isActive: (c) => c.minArea != null || c.maxArea != null,
    score: (p, c) => areaScore(p.areaSqm, c.minArea, c.maxArea),
  },
  {
    key: 'feature',
    weight: WEIGHTS.feature,
    isActive: (c) => !!c.bonusFeatures?.length,
    score: (p, c) => featureScore(p.features, c.bonusFeatures ?? []),
  },
];

/**
 * Ağırlıklı doğrusal skor + aktif boyut normalizasyonu.
 * Yalnız girilmiş (aktif) boyutlar paydaya girer. Hiç kriter yoksa NEUTRAL döner.
 */
export function matchScore(
  p: ScoringPortfolio,
  c: MatchCriteria,
  dims: Dimension[] = DIMENSIONS,
): MatchResult {
  const breakdown: DimensionResult[] = [];
  const reasons: DimensionKey[] = [];
  const gaps: DimensionKey[] = [];

  let totalWeight = 0;
  let earned = 0;

  for (const dim of dims) {
    const active = dim.isActive(c);
    const s = active ? clamp01(dim.score(p, c)) : 0;
    breakdown.push({ key: dim.key, active, score: s, weight: dim.weight });
    if (!active) continue;
    totalWeight += dim.weight;
    earned += s * dim.weight;
    (s >= MATCH_THRESHOLD ? reasons : gaps).push(dim.key);
  }

  const score = totalWeight === 0 ? NEUTRAL : Math.round((earned / totalWeight) * 100);
  return { score, reasons, gaps, breakdown };
}
