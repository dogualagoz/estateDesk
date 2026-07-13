import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';

const MESSAGE_PAGE_SIZE = 100;

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  /** Sidebar görünürlüğü + okunmadı rozeti tek çağrıda. */
  async status(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { feedbackEnabled: true },
    });
    if (!office?.feedbackEnabled) return { enabled: false, unreadCount: 0 };

    const thread = await this.prisma.feedbackThread.findUnique({
      where: { officeId },
      select: { id: true, officeLastReadAt: true },
    });
    if (!thread) return { enabled: true, unreadCount: 0 };

    const unreadCount = await this.prisma.feedbackMessage.count({
      where: {
        threadId: thread.id,
        fromAdmin: true,
        ...(thread.officeLastReadAt ? { createdAt: { gt: thread.officeLastReadAt } } : {}),
      },
    });
    return { enabled: true, unreadCount };
  }

  async listMessages(user: AuthUser) {
    const officeId = requireOfficeId(user);
    await this.requireFeedbackEnabled(officeId);

    const thread = await this.prisma.feedbackThread.findUnique({ where: { officeId } });
    if (!thread) return [];

    const messages = await this.prisma.feedbackMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_PAGE_SIZE,
      include: { sender: { select: { fullName: true } } },
    });
    return messages.reverse().map((m) => ({
      id: m.id,
      body: m.body,
      fromAdmin: m.fromAdmin,
      senderName: m.fromAdmin ? 'EstateDesk' : m.sender.fullName,
      createdAt: m.createdAt,
    }));
  }

  async sendMessage(user: AuthUser, body: string) {
    const officeId = requireOfficeId(user);
    const office = await this.requireFeedbackEnabled(officeId);

    const now = new Date();
    const thread = await this.prisma.feedbackThread.upsert({
      where: { officeId },
      create: { officeId, lastMessageAt: now, officeLastReadAt: now },
      update: { lastMessageAt: now, officeLastReadAt: now },
    });
    const message = await this.prisma.feedbackMessage.create({
      data: { threadId: thread.id, senderId: user.id, fromAdmin: false, body },
    });

    this.audit.log({
      action: AUDIT_ACTIONS.FEEDBACK_MESSAGE_SENT,
      userId: user.id,
      officeId,
      targetType: 'feedback_thread',
      targetId: thread.id,
    });

    const notifyEmail =
      this.config.get<string>('FEEDBACK_NOTIFY_EMAIL') || 'alagozdogu@gmail.com';
    // Fire-and-forget: mail hatası mesaj kaydını etkilemez
    void this.email
      .sendFeedbackNotificationEmail(notifyEmail, office.name, user.fullName, body)
      .catch(() => undefined);

    return {
      id: message.id,
      body: message.body,
      fromAdmin: false,
      senderName: user.fullName,
      createdAt: message.createdAt,
    };
  }

  async markRead(user: AuthUser) {
    const officeId = requireOfficeId(user);
    await this.prisma.feedbackThread.updateMany({
      where: { officeId },
      data: { officeLastReadAt: new Date() },
    });
    return { success: true };
  }

  private async requireFeedbackEnabled(officeId: string) {
    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { name: true, feedbackEnabled: true },
    });
    if (!office?.feedbackEnabled) {
      throw new ForbiddenException('Geri bildirim bu ofis için etkin değil');
    }
    return office;
  }
}
