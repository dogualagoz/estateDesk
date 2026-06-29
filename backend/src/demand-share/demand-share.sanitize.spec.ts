import { isShareViewable, sanitizeScoredPortfolio } from './demand-share.sanitize';
import type { ScoredPortfolio } from '../matching/matching.service';

const scored = (): ScoredPortfolio =>
  ({
    score: 87,
    reasons: ['budget', 'location'],
    gaps: ['area'],
    breakdown: [{ key: 'budget', active: true, score: 0.9, weight: 35 }],
    matchedFeatures: ['Asansör'],
    isHidden: false,
    portfolio: {
      id: 'p1',
      type: 'APARTMENT',
      listingType: 'SALE',
      title: 'Moda 3+1',
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Moda',
      areaSqm: 130,
      roomCount: '3+1',
      price: 10_000_000,
      features: ['Asansör', 'Otopark'],
      images: ['a.webp'],
      // Hassas / dahili alanlar — sızmamalı:
      ownerName: 'Ahmet Satıcı',
      ownerPhone: '5551112233',
      note: 'Dahili pazarlık notu',
      visibility: 'PUBLIC',
      officeId: 'office-1',
      createdById: 'user-1',
      createdBy: { id: 'user-1', fullName: 'Danışman' },
    },
  }) as unknown as ScoredPortfolio;

describe('sanitizeScoredPortfolio', () => {
  it('satıcı iletişimini ve dahili alanları sızdırmaz', () => {
    const out = sanitizeScoredPortfolio(scored());
    const serialized = JSON.stringify(out);

    expect(serialized).not.toContain('Ahmet Satıcı');
    expect(serialized).not.toContain('5551112233');
    expect(serialized).not.toContain('Dahili pazarlık notu');
    expect(serialized).not.toContain('office-1');
    expect(serialized).not.toContain('createdBy');

    expect(out.portfolio).not.toHaveProperty('ownerName');
    expect(out.portfolio).not.toHaveProperty('ownerPhone');
    expect(out.portfolio).not.toHaveProperty('note');
    expect(out.portfolio).not.toHaveProperty('officeId');
    expect(out.portfolio).not.toHaveProperty('createdBy');
    expect(out.portfolio).not.toHaveProperty('visibility');
  });

  it('güvenli alanları ve skor verisini korur', () => {
    const out = sanitizeScoredPortfolio(scored());
    expect(out.score).toBe(87);
    expect(out.reasons).toEqual(['budget', 'location']);
    expect(out.matchedFeatures).toEqual(['Asansör']);
    expect(out.portfolio.id).toBe('p1');
    expect(out.portfolio.price).toBe(10_000_000);
    expect(out.portfolio.images).toEqual(['a.webp']);
  });
});

describe('isShareViewable', () => {
  const now = new Date('2026-06-29T12:00:00Z');
  const future = new Date('2026-07-05T12:00:00Z');
  const past = new Date('2026-06-22T12:00:00Z');

  it('aktif ve süresi dolmamış defter görüntülenebilir', () => {
    expect(isShareViewable({ status: 'ACTIVE', expiresAt: future }, now)).toBe(true);
  });

  it('süresi dolmuş defter görüntülenemez', () => {
    expect(isShareViewable({ status: 'ACTIVE', expiresAt: past }, now)).toBe(false);
  });

  it('iptal edilmiş (REVOKED) defter görüntülenemez', () => {
    expect(isShareViewable({ status: 'REVOKED', expiresAt: future }, now)).toBe(false);
  });
});
