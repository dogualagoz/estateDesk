import { ForbiddenException } from '@nestjs/common';
import { OfficeService } from './office.service';
import { AlreadyInOfficeException } from './exceptions/already-in-office.exception';

function makeService(prismaOverrides: Record<string, any> = {}) {
  const prisma = {
    invite: { findUnique: jest.fn(), update: jest.fn() },
    office: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (ops: any) => Promise.all(ops)),
    ...prismaOverrides,
  } as any;
  const auth = { buildSession: jest.fn() } as any;
  const config = { get: jest.fn() } as any;
  const service = new OfficeService(prisma, auth, config);
  return { service, prisma, auth, config };
}

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000);
const pastDate = () => new Date(Date.now() - 60 * 60 * 1000);

const officeSummaryStub = {
  id: 'office-1',
  name: 'Office 1',
  owner: { id: 'owner-1', fullName: 'Owner' },
  _count: { members: 1, portfolios: 0, demands: 0 },
};

describe('OfficeService.acceptInvite', () => {
  it('davet süresi dolmuşsa INVITE_INVALID / EXPIRED fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      id: 'inv1',
      officeId: 'office-1',
      email: null,
      status: 'PENDING',
      expiresAt: pastDate(),
    });
    const user = { id: 'u1', email: 'a@b.com', officeId: null } as any;

    await expect(service.acceptInvite(user, 'tok')).rejects.toMatchObject({
      response: { code: 'INVITE_INVALID', invalidReason: 'EXPIRED' },
    });
  });

  it('kullanıcı zaten aynı ofisteyse sameOffice:true ile ALREADY_IN_OFFICE fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      id: 'inv1',
      officeId: 'office-1',
      email: null,
      status: 'PENDING',
      expiresAt: futureDate(),
    });
    prisma.office.findUnique.mockResolvedValue({ name: 'Office 1', ownerId: 'owner-1' });
    const user = { id: 'u1', email: 'a@b.com', officeId: 'office-1' } as any;

    const err = await service.acceptInvite(user, 'tok').catch((e) => e);
    expect(err).toBeInstanceOf(AlreadyInOfficeException);
    expect(err.response).toMatchObject({ code: 'ALREADY_IN_OFFICE', sameOffice: true, isOwner: false });
  });

  it('kullanıcı mevcut (farklı) ofisin sahibiyse isOwner:true ile ALREADY_IN_OFFICE fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      id: 'inv1',
      officeId: 'office-2',
      email: null,
      status: 'PENDING',
      expiresAt: futureDate(),
    });
    prisma.office.findUnique.mockResolvedValue({ name: 'Office 1', ownerId: 'u1' });
    const user = { id: 'u1', email: 'a@b.com', officeId: 'office-1' } as any;

    const err = await service.acceptInvite(user, 'tok').catch((e) => e);
    expect(err.response).toMatchObject({ code: 'ALREADY_IN_OFFICE', isOwner: true, sameOffice: false });
  });

  it('kişisel davette farklı e-posta 403 ile reddedilir (case-insensitive karşılaştırma)', async () => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      id: 'inv1',
      officeId: 'office-1',
      email: 'invited@x.com',
      status: 'PENDING',
      expiresAt: futureDate(),
    });
    const user = { id: 'u1', email: 'Other@X.com', officeId: null } as any;

    await expect(service.acceptInvite(user, 'tok')).rejects.toThrow(ForbiddenException);
  });

  it('kişisel davette aynı e-posta (case-insensitive) kabul edilir', async () => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      id: 'inv1',
      officeId: 'office-1',
      email: 'invited@x.com',
      status: 'PENDING',
      expiresAt: futureDate(),
    });
    prisma.office.findUnique.mockResolvedValue(officeSummaryStub);
    const user = { id: 'u1', email: 'Invited@X.com', officeId: null } as any;

    await expect(service.acceptInvite(user, 'tok')).resolves.toBeDefined();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('paylaşılan (email:null) davet herhangi bir kullanıcı tarafından kabul edilir', async () => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      id: 'inv1',
      officeId: 'office-1',
      email: null,
      status: 'PENDING',
      expiresAt: futureDate(),
    });
    prisma.office.findUnique.mockResolvedValue(officeSummaryStub);
    const user = { id: 'u1', email: 'anyone@x.com', officeId: null } as any;

    await expect(service.acceptInvite(user, 'tok')).resolves.toBeDefined();
  });
});

describe('OfficeService.previewInvite', () => {
  it.each([
    ['ACCEPTED', futureDate(), 'ACCEPTED'],
    ['REVOKED', futureDate(), 'REVOKED'],
    ['PENDING', pastDate(), 'EXPIRED'],
  ] as const)('status=%s -> invalidReason=%s', async (status, expiresAt, expected) => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      status,
      expiresAt,
      office: { name: 'Office' },
      invitedBy: { fullName: 'Inviter' },
    });

    const result = await service.previewInvite('tok');
    expect(result.invalidReason).toBe(expected);
    expect(result.valid).toBe(false);
  });

  it('geçerli davet için invalidReason null ve valid true döner', async () => {
    const { service, prisma } = makeService();
    prisma.invite.findUnique.mockResolvedValue({
      status: 'PENDING',
      expiresAt: futureDate(),
      office: { name: 'Office' },
      invitedBy: { fullName: 'Inviter' },
    });

    const result = await service.previewInvite('tok');
    expect(result.invalidReason).toBeNull();
    expect(result.valid).toBe(true);
  });
});
