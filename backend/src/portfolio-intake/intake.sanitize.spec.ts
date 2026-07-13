import { getIntakeInvalidReason, sanitizeIntakePreview } from './intake.sanitize';

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000);
const pastDate = () => new Date(Date.now() - 60 * 60 * 1000);

const baseLink = {
  id: 'link-1',
  token: 'secret-token',
  officeId: 'office-1',
  createdById: 'u1',
  status: 'ACTIVE',
  expiresAt: futureDate(),
  office: { name: 'Deneme Ofis' },
  createdBy: { fullName: 'Ali Danışman' },
};

describe('getIntakeInvalidReason', () => {
  it('aktif ve süresi geçmemiş linkte null döner', () => {
    expect(getIntakeInvalidReason({ status: 'ACTIVE', expiresAt: futureDate() })).toBeNull();
  });

  it('REVOKED linkte REVOKED döner (süre dolmuş olsa bile öncelikli)', () => {
    expect(getIntakeInvalidReason({ status: 'REVOKED', expiresAt: pastDate() })).toBe('REVOKED');
  });

  it('süresi dolmuş aktif linkte EXPIRED döner', () => {
    expect(getIntakeInvalidReason({ status: 'ACTIVE', expiresAt: pastDate() })).toBe('EXPIRED');
  });
});

describe('sanitizeIntakePreview', () => {
  it('geçerli linkte yalnızca ofis/danışman adı döner — id/token/officeId sızmaz', () => {
    const res = sanitizeIntakePreview(baseLink);
    expect(res).toEqual({
      valid: true,
      invalidReason: null,
      officeName: 'Deneme Ofis',
      agentName: 'Ali Danışman',
    });
    const json = JSON.stringify(res);
    expect(json).not.toContain('link-1');
    expect(json).not.toContain('secret-token');
    expect(json).not.toContain('office-1');
    expect(json).not.toContain('u1');
  });

  it('geçersiz linkte ofis/danışman adı da verilmez', () => {
    const res = sanitizeIntakePreview({ ...baseLink, expiresAt: pastDate() });
    expect(res).toEqual({ valid: false, invalidReason: 'EXPIRED' });
    expect(JSON.stringify(res)).not.toContain('Deneme Ofis');
  });
});
