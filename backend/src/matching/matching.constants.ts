/**
 * Eşleştirme motoru ayar dosyası — tek doğruluk kaynağı.
 * Ağırlıklar ve eşikler buradan değiştirilebilir; skorlama mantığı saf kalır.
 */

export type DimensionKey = 'budget' | 'location' | 'room' | 'area' | 'feature';

/** Boyut ağırlıkları (göreli; toplamları 100 olması şart değil, aktif boyutlara göre normalize edilir). */
export const WEIGHTS: Record<DimensionKey, number> = {
  budget: 35,
  location: 25,
  room: 20,
  area: 10,
  feature: 10,
};

/** Maksimum bütçe üzerindeki sert kesim payı (hard filter). %10. */
export const PRICE_STRETCH = 0.1;

/** Yumuşak yakınlık bandı — kısmi puanın sıfırlandığı sapma oranı (%15). */
export const TOL = 0.15;

/** Bu skorun altındaki adaylar listeden gizlenir (gürültü kesme). */
export const MIN_SCORE = 40;

/** Bir boyutun "neden" mi (reasons) yoksa "eksik" mi (gaps) sayılacağı eşiği. */
export const MATCH_THRESHOLD = 0.6;

/** Hiç kriter girilmediğinde dönen nötr skor. */
export const NEUTRAL = 60;

/** Oda sayısı sıralı listesi — ordinal yakınlık ve min-oda sert filtresi için. */
export const ROOM_ORDER = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1'];

/** Ordinal oda uzaklığına göre kısmi puan (diminishing returns). */
export const ROOM_DISTANCE_SCORES = [1.0, 0.6, 0.3, 0.1];

/**
 * Lokasyon puanlaması için maksimum mesafe (km).
 * Bu değerde veya üstünde mesafe 0 puan alır; altında doğrusal azalış.
 * Farklı ilçe tam eşleşmesi 0.85'te kırpılır; mahalle eşleşmesi 0.9–1.0 verir.
 */
export const LOCATION_MAX_KM = 30;
