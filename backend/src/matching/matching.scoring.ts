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
  LOCATION_MAX_KM,
  MATCH_THRESHOLD,
  NEUTRAL,
  PRICE_STRETCH,
  ROOM_DISTANCE_SCORES,
  ROOM_ORDER,
  TOL,
  WEIGHTS,
} from './matching.constants';
import { DISTRICT_COORDS } from './tr-district-coords';

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

// ── Coğrafi mesafe yardımcıları ─────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** İlçe koordinatını DISTRICT_COORDS'tan döner. Key: "normalizedCity/normalizedDistrict". */
function districtCoord(city: string, district: string): { lat: number; lng: number } | null {
  const key = `${normalizeText(city)}/${normalizeText(district)}`;
  return DISTRICT_COORDS[key] ?? null;
}

/**
 * Konum yakınlık skoru.
 *
 * Puan kademeleri:
 *   1.0        — ilçe tam eşleşti + mahalle belirtilmemiş veya tam eşleşti
 *   0.9        — ilçe tam eşleşti, mahalle tercihi var ama farklı
 *   0..0.85    — farklı ilçe ama koordinat verisi var: haversine mesafeye göre smooth decay
 *   0.35       — farklı ilçe, koordinat verisi yok (fallback kademesi)
 *   0          — farklı il veya mesafe >= LOCATION_MAX_KM
 *
 * Çoklu ilçe/mahalle tercihi (districts[], neighborhoods[]) önceliklidir;
 * geriye dönük uyumluluk için tekil district/neighborhood de desteklenir.
 */
export function locationScore(p: ScoringPortfolio, c: MatchCriteria): number {
  // 1. Şehir kontrolü
  if (c.city && normalizeText(p.city) !== normalizeText(c.city)) return 0;

  // 2. İlçe tercihleri — çoklu öncelikli
  const districtPrefs = (
    c.districts?.length ? c.districts : c.district ? [c.district] : []
  ).map(normalizeText).filter(Boolean);

  if (!districtPrefs.length) return 1;

  const pDistrict = normalizeText(p.district);

  // 3. Tam ilçe eşleşmesi → mahalle kontrolüne geç
  if (districtPrefs.includes(pDistrict)) {
    const hoodPrefs = (
      c.neighborhoods?.length ? c.neighborhoods : c.neighborhood ? [c.neighborhood] : []
    ).map(normalizeText).filter(Boolean);
    if (!hoodPrefs.length) return 1;
    return hoodPrefs.includes(normalizeText(p.neighborhood ?? '')) ? 1 : 0.9;
  }

  // 4. Farklı ilçe — koordinat bazlı mesafe skoru
  if (c.city) {
    const pCoord = districtCoord(p.city, p.district);
    if (pCoord) {
      // Tercih edilen ilçelerden en yakınını bul
      let minKm = Infinity;
      for (const pref of districtPrefs) {
        // Tercih edilen ilçenin orijinal adını bul (normalizeText geri dönüşümsüz)
        const prefOriginal = c.districts?.find((d) => normalizeText(d) === pref) ??
                             (c.district && normalizeText(c.district) === pref ? c.district : pref);
        const prefCoord = districtCoord(c.city, prefOriginal);
        if (!prefCoord) continue;
        const km = haversineKm(pCoord.lat, pCoord.lng, prefCoord.lat, prefCoord.lng);
        if (km < minKm) minKm = km;
      }
      if (minKm < Infinity) {
        // 0km→0.85, LOCATION_MAX_KM→0, doğrusal azalış; 0.85 tavan ile tam eşleşmeden ayrışır
        return clamp01((1 - minKm / LOCATION_MAX_KM) * 0.85);
      }
    }
    // Koordinat verisi yok — şehir eşleşmesi kademesi
    return 0.35;
  }

  return 0;
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
    isActive: (c) => !!(c.districts?.length || normalizeText(c.district) || normalizeText(c.city)),
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

/** Kartta gösterilecek eşleşen özellikler (must-have + bonus ∩ portföy). */
export function matchedFeatures(features: string[], c: MatchCriteria): string[] {
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
