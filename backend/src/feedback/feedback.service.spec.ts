import { ForbiddenException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

function makeService(prismaOverrides: Record<string, any> = {}) {
  const prisma = {
    office: { findUnique: jest.fn() },
    feedbackThread: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    feedbackMessage: { count: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    ...prismaOverrides,
  } as any;
  const email = { sendFeedbackNotificationEmail: jest.fn().mockResolvedValue(undefined) } as any;
  const audit = { log: jest.fn() } as any;
  const config = { get: jest.fn() } as any;
  const service = new FeedbackService(prisma, email, audit, config);
  return { service, prisma, email, audit, config };
}

const user = {
  id: 'u1',
  email: 'a@b.com',
  role: 'AGENT',
  fullName: 'Ali Veli',
  officeId: 'office-1',
  isDemo: false,
} as any;

describe('FeedbackService.status', () => {
  it('ofissiz kullanıcıda ForbiddenException fırlatır', async () => {
    const { service } = makeService();
    await expect(service.status({ ...user, officeId: null })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('feedbackEnabled=false ise enabled:false döner, thread sorgulamaz', async () => {
    const { service, prisma } = makeService();
    prisma.office.findUnique.mockResolvedValue({ feedbackEnabled: false });

    await expect(service.status(user)).resolves.toEqual({ enabled: false, unreadCount: 0 });
    expect(prisma.feedbackThread.findUnique).not.toHaveBeenCalled();
  });

  it('okunmadı sayısını officeLastReadAt sonrası admin mesajlarından hesaplar', async () => {
    const { service, prisma } = makeService();
    const lastRead = new Date('2026-07-01');
    prisma.office.findUnique.mockResolvedValue({ feedbackEnabled: true });
    prisma.feedbackThread.findUnique.mockResolvedValue({ id: 't1', officeLastReadAt: lastRead });
    prisma.feedbackMessage.count.mockResolvedValue(3);

    await expect(service.status(user)).resolves.toEqual({ enabled: true, unreadCount: 3 });
    expect(prisma.feedbackMessage.count).toHaveBeenCalledWith({
      where: { threadId: 't1', fromAdmin: true, createdAt: { gt: lastRead } },
    });
  });

  it('officeLastReadAt null ise tarih filtresi olmadan sayar', async () => {
    const { service, prisma } = makeService();
    prisma.office.findUnique.mockResolvedValue({ feedbackEnabled: true });
    prisma.feedbackThread.findUnique.mockResolvedValue({ id: 't1', officeLastReadAt: null });
    prisma.feedbackMessage.count.mockResolvedValue(2);

    await expect(service.status(user)).resolves.toEqual({ enabled: true, unreadCount: 2 });
    expect(prisma.feedbackMessage.count).toHaveBeenCalledWith({
      where: { threadId: 't1', fromAdmin: true },
    });
  });
});

describe('FeedbackService.sendMessage', () => {
  it('feedbackEnabled=false ise ForbiddenException fırlatır', async () => {
    const { service, prisma } = makeService();
    prisma.office.findUnique.mockResolvedValue({ name: 'Ofis', feedbackEnabled: false });

    await expect(service.sendMessage(user, 'merhaba')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('thread upsert eder, mesajı yazar, audit + email tetikler', async () => {
    const { service, prisma, email, audit, config } = makeService();
    prisma.office.findUnique.mockResolvedValue({ name: 'Ofis 1', feedbackEnabled: true });
    prisma.feedbackThread.upsert.mockResolvedValue({ id: 't1' });
    prisma.feedbackMessage.create.mockResolvedValue({
      id: 'm1',
      body: 'merhaba',
      createdAt: new Date(),
    });
    config.get.mockReturnValue('owner@example.com');

    const res = await service.sendMessage(user, 'merhaba');

    expect(res).toMatchObject({ id: 'm1', fromAdmin: false, senderName: 'Ali Veli' });
    expect(prisma.feedbackThread.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { officeId: 'office-1' } }),
    );
    expect(prisma.feedbackMessage.create).toHaveBeenCalledWith({
      data: { threadId: 't1', senderId: 'u1', fromAdmin: false, body: 'merhaba' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'feedback.message_sent', officeId: 'office-1' }),
    );
    expect(email.sendFeedbackNotificationEmail).toHaveBeenCalledWith(
      'owner@example.com',
      'Ofis 1',
      'Ali Veli',
      'merhaba',
    );
  });

  it('email hatası mesaj gönderimini bozmaz (fire-and-forget)', async () => {
    const { service, prisma, email } = makeService();
    prisma.office.findUnique.mockResolvedValue({ name: 'Ofis 1', feedbackEnabled: true });
    prisma.feedbackThread.upsert.mockResolvedValue({ id: 't1' });
    prisma.feedbackMessage.create.mockResolvedValue({
      id: 'm1',
      body: 'merhaba',
      createdAt: new Date(),
    });
    email.sendFeedbackNotificationEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(service.sendMessage(user, 'merhaba')).resolves.toMatchObject({ id: 'm1' });
  });
});

describe('FeedbackService.listMessages', () => {
  it('thread yoksa boş liste döner', async () => {
    const { service, prisma } = makeService();
    prisma.office.findUnique.mockResolvedValue({ name: 'Ofis', feedbackEnabled: true });
    prisma.feedbackThread.findUnique.mockResolvedValue(null);

    await expect(service.listMessages(user)).resolves.toEqual([]);
  });

  it('admin mesajlarında senderName EstateDesk olarak maskelenir', async () => {
    const { service, prisma } = makeService();
    prisma.office.findUnique.mockResolvedValue({ name: 'Ofis', feedbackEnabled: true });
    prisma.feedbackThread.findUnique.mockResolvedValue({ id: 't1' });
    prisma.feedbackMessage.findMany.mockResolvedValue([
      {
        id: 'm2',
        body: 'cevap',
        fromAdmin: true,
        createdAt: new Date(),
        sender: { fullName: 'Gerçek Admin Adı' },
      },
      {
        id: 'm1',
        body: 'soru',
        fromAdmin: false,
        createdAt: new Date(),
        sender: { fullName: 'Ali Veli' },
      },
    ]);

    const res = await service.listMessages(user);
    // desc gelen liste ters çevrilir (eskiden yeniye)
    expect(res.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(res[1].senderName).toBe('EstateDesk');
    expect(res[0].senderName).toBe('Ali Veli');
  });
});
