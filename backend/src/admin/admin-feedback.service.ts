import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
import { AdminPageDto } from './dto/admin-query.dto';

const SNIPPET_LENGTH = 120;

/**
 * Süper admin geri bildirim sohbetleri. EmailModule bilinçli olarak
 * import edilmez (AdminModule izolasyon sözleşmesi): bildirim maili yalnızca
 * ofis→admin yönünde gerekir ve FeedbackModule'den gönderilir.
 */
@Injectable()
export class AdminFeedbackService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async listThreads(query: AdminPageDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const [total, threads] = await this.prisma.$transaction([
      this.prisma.feedbackThread.count(),
      this.prisma.feedbackThread.findMany({
        include: {
          office: { select: { name: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = await Promise.all(
      threads.map(async (t) => ({
        officeId: t.officeId,
        officeName: t.office.name,
        lastMessageAt: t.lastMessageAt,
        lastMessageSnippet: t.messages[0]?.body.slice(0, SNIPPET_LENGTH) ?? '',
        unreadCount: await this.prisma.feedbackMessage.count({
          where: {
            threadId: t.id,
            fromAdmin: false,
            ...(t.adminLastReadAt ? { createdAt: { gt: t.adminLastReadAt } } : {}),
          },
        }),
      })),
    );

    return { items, total, page, pageSize };
  }

  /** Toplam okunmamış ofis mesajı — panel rozeti poll'u. */
  async unreadTotal() {
    const threads = await this.prisma.feedbackThread.findMany({
      select: { id: true, adminLastReadAt: true },
    });
    let total = 0;
    for (const t of threads) {
      total += await this.prisma.feedbackMessage.count({
        where: {
          threadId: t.id,
          fromAdmin: false,
          ...(t.adminLastReadAt ? { createdAt: { gt: t.adminLastReadAt } } : {}),
        },
      });
    }
    return { total };
  }

  async listMessages(officeId: string) {
    const thread = await this.requireThread(officeId);
    const messages = await this.prisma.feedbackMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { fullName: true } } },
    });
    return messages.map((m) => ({
      id: m.id,
      body: m.body,
      fromAdmin: m.fromAdmin,
      senderName: m.sender.fullName,
      createdAt: m.createdAt,
    }));
  }

  /** Toggle sonradan kapatılsa bile mevcut sohbete cevap verilebilir. */
  async reply(admin: AuthUser, officeId: string, body: string) {
    const thread = await this.requireThread(officeId);
    const now = new Date();
    const message = await this.prisma.feedbackMessage.create({
      data: { threadId: thread.id, senderId: admin.id, fromAdmin: true, body },
    });
    await this.prisma.feedbackThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: now, adminLastReadAt: now },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.FEEDBACK_ADMIN_REPLIED,
      userId: admin.id,
      officeId,
      targetType: 'feedback_thread',
      targetId: thread.id,
    });

    return {
      id: message.id,
      body: message.body,
      fromAdmin: true,
      senderName: admin.fullName,
      createdAt: message.createdAt,
    };
  }

  async markRead(officeId: string) {
    const thread = await this.requireThread(officeId);
    await this.prisma.feedbackThread.update({
      where: { id: thread.id },
      data: { adminLastReadAt: new Date() },
    });
    return { success: true };
  }

  async toggleOffice(admin: AuthUser, officeId: string, enabled: boolean) {
    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { id: true, name: true },
    });
    if (!office) throw new NotFoundException('Ofis bulunamadı');

    await this.prisma.office.update({
      where: { id: officeId },
      data: { feedbackEnabled: enabled },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.ADMIN_OFFICE_FEEDBACK_TOGGLED,
      userId: admin.id,
      officeId,
      targetType: 'office',
      targetId: officeId,
      metadata: { name: office.name, enabled },
    });

    return { success: true, feedbackEnabled: enabled };
  }

  private async requireThread(officeId: string) {
    const thread = await this.prisma.feedbackThread.findUnique({ where: { officeId } });
    if (!thread) throw new NotFoundException('Bu ofis için sohbet bulunamadı');
    return thread;
  }
}
