import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PortfolioIntakeService } from './portfolio-intake.service';

function makeService(prismaOverrides: Record<string, any> = {}) {
  const prisma = {
    portfolioIntakeLink: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    portfolioSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    portfolio: { update: jest.fn() },
    ...prismaOverrides,
  } as any;
  const portfolio = { create: jest.fn() } as any;
  const audit = { log: jest.fn() } as any;
  const config = { get: jest.fn() } as any;
  const service = new PortfolioIntakeService(prisma, portfolio, audit, config);
  return { service, prisma, portfolio, audit, config };
}

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000);
const pastDate = () => new Date(Date.now() - 60 * 60 * 1000);

const user = {
  id: 'agent-1',
  email: 'a@b.com',
  role: 'AGENT',
  fullName: 'Ali Danışman',
  officeId: 'office-1',
  isDemo: false,
} as any;

const submissionDto = {
  submitterName: 'Mehmet Eczacı',
  submitterPhone: '05551112233',
  type: 'APARTMENT',
  city: 'İstanbul',
  district: 'Kadıköy',
  areaSqm: 120,
  roomCount: '3+1',
  price: 5_000_000,
  kvkkAccepted: true,
} as any;

describe('PortfolioIntakeService.createSubmission', () => {
  it('bilinmeyen token 404 fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.portfolioIntakeLink.findUnique.mockResolvedValue(null);

    await expect(service.createSubmission('tok', submissionDto, [])).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('süresi dolmuş linkte BadRequestException fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.portfolioIntakeLink.findUnique.mockResolvedValue({
      id: 'l1',
      officeId: 'office-1',
      status: 'ACTIVE',
      expiresAt: pastDate(),
      _count: { submissions: 0 },
    });

    await expect(service.createSubmission('tok', submissionDto, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('iptal edilmiş linkte BadRequestException fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.portfolioIntakeLink.findUnique.mockResolvedValue({
      id: 'l1',
      officeId: 'office-1',
      status: 'REVOKED',
      expiresAt: futureDate(),
      _count: { submissions: 0 },
    });

    await expect(service.createSubmission('tok', submissionDto, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('başvuru limiti dolmuş linkte BadRequestException fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.portfolioIntakeLink.findUnique.mockResolvedValue({
      id: 'l1',
      officeId: 'office-1',
      status: 'ACTIVE',
      expiresAt: futureDate(),
      _count: { submissions: 50 },
    });

    await expect(service.createSubmission('tok', submissionDto, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('geçerli linkte başvuru oluşturur, officeId denormalize eder, audit loglar', async () => {
    const { service, prisma, audit } = makeService();
    prisma.portfolioIntakeLink.findUnique.mockResolvedValue({
      id: 'l1',
      officeId: 'office-1',
      createdById: 'agent-1',
      status: 'ACTIVE',
      expiresAt: futureDate(),
      _count: { submissions: 3 },
    });
    prisma.portfolioSubmission.create.mockResolvedValue({ id: 's1' });

    await expect(service.createSubmission('tok', submissionDto, [])).resolves.toEqual({
      success: true,
    });
    expect(prisma.portfolioSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          linkId: 'l1',
          officeId: 'office-1',
          submitterName: 'Mehmet Eczacı',
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'intake.submission_received', officeId: 'office-1' }),
    );
  });
});

describe('PortfolioIntakeService.getSubmission (ofis izolasyonu)', () => {
  it('başka ofisin başvurusu 404 döner (officeId filtresi sorguda)', async () => {
    const { service, prisma } = makeService();
    prisma.portfolioSubmission.findFirst.mockResolvedValue(null);

    await expect(service.getSubmission(user, 's1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.portfolioSubmission.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 's1', officeId: 'office-1' }),
      }),
    );
  });

  it('ofissiz kullanıcı ForbiddenException alır', async () => {
    const { service } = makeService();
    await expect(service.getSubmission({ ...user, officeId: null }, 's1')).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe('PortfolioIntakeService.approveSubmission', () => {
  const pendingSubmission = {
    id: 's1',
    officeId: 'office-1',
    status: 'PENDING',
    images: [],
    link: { label: null, createdById: 'agent-1' },
    reviewedBy: null,
  };

  it('PENDING olmayan başvuru reddedilir', async () => {
    const { service, prisma } = makeService();
    prisma.portfolioSubmission.findFirst.mockResolvedValue({
      ...pendingSubmission,
      status: 'APPROVED',
    });

    await expect(
      service.approveSubmission(user, 's1', submissionDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('onayda portfolio.create çağrılır ve başvuru APPROVED + portfolioId işaretlenir', async () => {
    const { service, prisma, portfolio, audit } = makeService();
    prisma.portfolioSubmission.findFirst.mockResolvedValue(pendingSubmission);
    portfolio.create.mockResolvedValue({ id: 'p1' });

    await expect(service.approveSubmission(user, 's1', submissionDto)).resolves.toEqual({
      success: true,
      portfolioId: 'p1',
    });
    expect(portfolio.create).toHaveBeenCalledWith(user, submissionDto);
    expect(prisma.portfolioSubmission.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({
        status: 'APPROVED',
        reviewedById: 'agent-1',
        portfolioId: 'p1',
      }),
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'intake.submission_approved' }),
    );
  });
});

describe('PortfolioIntakeService.rejectSubmission', () => {
  it('reddi sebep ile işaretler', async () => {
    const { service, prisma } = makeService();
    prisma.portfolioSubmission.findFirst.mockResolvedValue({
      id: 's1',
      officeId: 'office-1',
      status: 'PENDING',
      images: [],
      link: { label: null, createdById: 'agent-1' },
      reviewedBy: null,
    });

    await expect(service.rejectSubmission(user, 's1', 'eksik bilgi')).resolves.toEqual({
      success: true,
    });
    expect(prisma.portfolioSubmission.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({ status: 'REJECTED', rejectReason: 'eksik bilgi' }),
    });
  });
});
