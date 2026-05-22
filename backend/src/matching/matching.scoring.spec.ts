import {
  MatchCriteria,
  ScoringPortfolio,
  areaScore,
  budgetScore,
  matchScore,
  normalizeRoom,
  normalizeText,
  roomScore,
} from './matching.scoring';
import { MATCH_THRESHOLD, NEUTRAL } from './matching.constants';

const basePortfolio = (over: Partial<ScoringPortfolio> = {}): ScoringPortfolio => ({
  type: 'APARTMENT',
  listingType: 'SALE',
  city: 'İstanbul',
  district: 'Kadıköy',
  neighborhood: 'Moda',
  areaSqm: 130,
  roomCount: '3+1',
  price: 10_000_000,
  features: ['Asansör', 'Otopark'],
  ...over,
});

describe('normalizeText', () => {
  it('Türkçe karakterleri ASCII\'ye indirger ve küçük harfe çevirir', () => {
    expect(normalizeText('İstanbul')).toBe('istanbul');
    expect(normalizeText('Kadıköy')).toBe('kadikoy');
    expect(normalizeText('Şişli')).toBe('sisli');
    expect(normalizeText('Çağ')).toBe('cag');
    expect(normalizeText('Üsküdar')).toBe('uskudar');
  });

  it('İ/ı tuzağı: noktalı ve noktasız I aynı sonuca düşer', () => {
    expect(normalizeText('IZMIR')).toBe(normalizeText('İzmir'));
  });

  it('boş girdi için boş string döner', () => {
    expect(normalizeText(undefined)).toBe('');
    expect(normalizeText(null)).toBe('');
  });
});

describe('normalizeRoom', () => {
  it('boşlukları temizler', () => {
    expect(normalizeRoom('3 + 1')).toBe('3+1');
    expect(normalizeRoom('3+1')).toBe('3+1');
  });
});

describe('budgetScore', () => {
  it('band içinde tam puan', () => {
    expect(budgetScore(10_000_000, 9_000_000, 12_000_000)).toBe(1);
  });

  it('üst sınır aşımı convex (sert) düşer — küçük sapma az, büyük sapma çok', () => {
    const small = budgetScore(12_600_000, undefined, 12_000_000); // %5 aşım
    const large = budgetScore(13_140_000, undefined, 12_000_000); // ~%9.5 aşım
    expect(small).toBeGreaterThan(0.6);
    expect(large).toBeLessThan(0.2);
    expect(large).toBeLessThan(small);
  });

  it('alt sınır altı yumuşak (doğrusal) düşer', () => {
    const s = budgetScore(8_500_000, 9_000_000, 12_000_000);
    expect(s).toBeGreaterThan(0.5);
    expect(s).toBeLessThan(1);
  });
});

describe('roomScore — diminishing returns', () => {
  it('tam eşleşme 1.0', () => {
    expect(roomScore('3+1', ['3+1'])).toBe(1);
  });
  it('bir adım uzak kısmi puan (3+1 isteyene 4+1)', () => {
    const s = roomScore('4+1', ['3+1']);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
  it('uzaklık arttıkça puan düşer', () => {
    expect(roomScore('2+1', ['3+1'])).toBeGreaterThan(roomScore('1+0', ['3+1']));
  });
  it('birden çok tercihten en yakını alınır', () => {
    expect(roomScore('4+1', ['2+1', '4+1'])).toBe(1);
  });
});

describe('areaScore — capped', () => {
  it('band içi 1.0, asla 1.0\'ı aşmaz (fazla m² ödüllendirilmez)', () => {
    expect(areaScore(150, 120, 180)).toBe(1);
    expect(areaScore(500, 120, 180)).toBeLessThanOrEqual(1);
  });
});

describe('matchScore — aktif boyut normalizasyonu', () => {
  it('hiç kriter yoksa NEUTRAL döner', () => {
    const r = matchScore(basePortfolio(), {});
    expect(r.score).toBe(NEUTRAL);
    expect(r.reasons).toHaveLength(0);
    expect(r.gaps).toHaveLength(0);
  });

  it('girilmemiş boyut paydaya girmez (nötr) — sadece bütçe girilince tam puan 100', () => {
    const r = matchScore(basePortfolio({ price: 10_000_000 }), {
      minBudget: 9_000_000,
      maxBudget: 12_000_000,
    });
    expect(r.score).toBe(100);
    expect(r.breakdown.find((b) => b.key === 'location')!.active).toBe(false);
  });

  it('girilmiş ama tutmayan boyut gaps\'e düşer ve paydada kalır (skoru düşürür)', () => {
    const r = matchScore(basePortfolio({ district: 'Beşiktaş' }), {
      district: 'Kadıköy',
    });
    expect(r.gaps).toContain('location');
    expect(r.score).toBeLessThan(NEUTRAL);
  });

  it('tutan boyut reasons\'a düşer', () => {
    const r = matchScore(basePortfolio({ district: 'Kadıköy' }), { district: 'Kadıköy' });
    expect(r.reasons).toContain('location');
  });
});

describe('trade-off / domination önlemi', () => {
  // Aynı kriter; biri bütçeye uygun küçük, diğeri bütçeyi aşan ama çok büyük m².
  const criteria: MatchCriteria = {
    minBudget: 9_000_000,
    maxBudget: 10_000_000,
    minArea: 100,
    maxArea: 130,
  };

  it('fiyat penaltısı, fazla m² bonusunu domine eder', () => {
    const inBudget = matchScore(
      basePortfolio({ price: 9_800_000, areaSqm: 120 }),
      criteria,
    );
    const overBudgetBigArea = matchScore(
      basePortfolio({ price: 10_900_000, areaSqm: 400 }),
      criteria,
    );
    expect(inBudget.score).toBeGreaterThan(overBudgetBigArea.score);
  });
});

describe('MATCH_THRESHOLD sanity', () => {
  it('eşik 0..1 aralığında', () => {
    expect(MATCH_THRESHOLD).toBeGreaterThan(0);
    expect(MATCH_THRESHOLD).toBeLessThanOrEqual(1);
  });
});
