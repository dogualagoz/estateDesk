import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { generateSecureToken } from '../common/token.util';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AlreadyInOfficeException } from './exceptions/already-in-office.exception';
import { OfficeService } from './office.service';

const INVITE_TTL_DAYS = 7;

type InviteInvalidReason = 'EXPIRED' | 'ACCEPTED' | 'REVOKED';

/**
 * Davet yaşam döngüsünün tamamı: link üretme, önizleme, kabul, davetle kayıt.
 *
 * İki davet türü vardır:
 * - Kişiye özel (email dolu): yalnızca o e-posta kabul edebilir, tek kullanımlık.
 * - Paylaşılan link (email null): Notion/Figma mantığı — çok kullanımlı,
 *   PENDING kalır, ofis başına tek geçerli link tutulur.
 */
@Injectable()
export class InviteService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private config: ConfigService,
    private office: OfficeService,
  ) {}

  /** Yöneticinin davet linki üretmesi (email isteğe bağlı). */
  async createInvite(user: AuthUser, dto: CreateInviteDto) {
    const officeId = requireOfficeId(user);
    const email = dto.email?.toLowerCase().trim();

    // E-posta varsa, o kişinin daha önce davet alıp almadığını kontrol et
    if (email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser?.officeId === officeId) {
        throw new ConflictException('Bu kişi zaten ofisinizde');
      }

      const now = new Date();
      const existingInvite = await this.prisma.invite.findFirst({
        where: { officeId, email, status: 'PENDING' },
      });

      if (existingInvite && existingInvite.expiresAt > now) {
        return this.toInviteResponse(existingInvite);
      }
    }

    const now = new Date();
    const invite = await this.prisma.invite.create({
      data: {
        email,
        token: generateSecureToken(),
        officeId,
        invitedById: user.id,
        expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return this.toInviteResponse(invite);
  }

  async listInvites(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const invites = await this.prisma.invite.findMany({
      where: { officeId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => this.toInviteResponse(i));
  }

  async revokeInvite(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const invite = await this.prisma.invite.findFirst({ where: { id, officeId } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');
    await this.prisma.invite.update({ where: { id }, data: { status: 'REVOKED' } });
    return { success: true };
  }

  /**
   * Ofisin tek paylaşılan davet linkini döndürür (Notion/Figma mantığı).
   * Birden fazla geçerli genel (e-postasız) link varsa en yenisini tutar,
   * gerisini iptal eder. Geçerli link yoksa yeni bir tane oluşturur.
   */
  async getInviteLink(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const now = new Date();

    const invites = await this.prisma.invite.findMany({
      where: { officeId, email: null, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const valid = invites.filter((i) => i.expiresAt > now);

    if (valid.length > 0) {
      const [keep, ...extra] = valid;
      // Fazlalık geçerli linkleri ve süresi dolmuşları iptal et — tek link kalsın
      const stale = [...extra, ...invites.filter((i) => i.expiresAt <= now)];
      if (stale.length) {
        await this.prisma.invite.updateMany({
          where: { id: { in: stale.map((i) => i.id) } },
          data: { status: 'REVOKED' },
        });
      }
      return this.toInviteResponse(keep);
    }

    return this.createSharedInvite(user.id, officeId, now);
  }

  /** Mevcut paylaşılan linki iptal edip yeni bir tane üretir. */
  async resetInviteLink(user: AuthUser) {
    const officeId = requireOfficeId(user);
    await this.prisma.invite.updateMany({
      where: { officeId, email: null, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });
    return this.createSharedInvite(user.id, officeId, new Date());
  }

  private async createSharedInvite(userId: string, officeId: string, now: Date) {
    const invite = await this.prisma.invite.create({
      data: {
        token: generateSecureToken(),
        officeId,
        invitedById: userId,
        expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return this.toInviteResponse(invite);
  }

  /** Davet linki açıldığında gösterilecek önizleme (public). */
  async previewInvite(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        office: { select: { name: true } },
        invitedBy: { select: { fullName: true } },
      },
    });
    if (!invite) throw new NotFoundException('Davet bulunamadı');

    const invalidReason = this.getInviteInvalidReason(invite);
    const valid = invalidReason === null;
    const now = new Date();
    const expiresInMs = invite.expiresAt.getTime() - now.getTime();
    const expiresInSeconds = Math.max(0, Math.floor(expiresInMs / 1000));
    const expiresInDays = Math.floor(expiresInSeconds / (24 * 3600));

    return {
      officeName: invite.office.name,
      invitedByName: invite.invitedBy.fullName,
      status: invite.status,
      expiresAt: invite.expiresAt,
      expiresInSeconds,
      expiresInDays,
      valid,
      invalidReason,
    };
  }

  /** Kimliği doğrulanmış kullanıcının daveti kabul edip ofise katılması. */
  async acceptInvite(user: AuthUser, token: string) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');

    const invalidReason = this.getInviteInvalidReason(invite);
    if (invalidReason) {
      throw new BadRequestException({
        code: 'INVITE_INVALID',
        invalidReason,
        message: this.inviteInvalidReasonMessage(invalidReason),
      });
    }

    if (user.officeId) {
      const currentOffice = await this.prisma.office.findUnique({
        where: { id: user.officeId },
        select: { name: true, ownerId: true },
      });
      throw new AlreadyInOfficeException(
        currentOffice?.name ?? '',
        currentOffice?.ownerId === user.id,
        user.officeId === invite.officeId,
      );
    }

    // Kişiye özel davet: token'ı bilen herkesin değil, yalnızca davet edilen
    // e-postanın sahibinin kabul edebilmesini garanti eder.
    if (invite.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException({
        code: 'INVITE_EMAIL_MISMATCH',
        message: 'Bu davet farklı bir e-posta adresi için oluşturulmuş',
      });
    }

    // Paylaşılan link (email yok) çok kullanımlıdır: PENDING kalır, takımdaki
    // herkes aynı linkle katılabilir. Kişiye özel davet ise tek kullanımlıktır.
    const isShared = invite.email === null;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { officeId: invite.officeId, role: Role.AGENT },
      }),
      ...(isShared
        ? []
        : [
            this.prisma.invite.update({
              where: { id: invite.id },
              data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedByEmail: user.email },
            }),
          ]),
    ]);

    return this.office.getOfficeSummary(invite.officeId);
  }

  /** Davet linki ile kayıt ol ve ofise katıl (public). */
  async registerWithInvite(
    token: string,
    dto: { email: string; password: string; fullName: string },
  ) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');

    const invalidReason = this.getInviteInvalidReason(invite);
    if (invalidReason) {
      throw new BadRequestException({
        code: 'INVITE_INVALID',
        invalidReason,
        message: this.inviteInvalidReasonMessage(invalidReason),
      });
    }

    // dto.email zaten RegisterDto'nun @Transform'u ile normalize edilmiş gelir
    const email = dto.email;

    // Kişiye özel davet: yalnızca davet edilen e-posta bu daveti kullanarak kayıt olabilir
    if (invite.email && invite.email.toLowerCase() !== email) {
      throw new ForbiddenException({
        code: 'INVITE_EMAIL_MISMATCH',
        message: 'Bu davet farklı bir e-posta adresi için oluşturulmuş',
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Paylaşılan link (email yok) çok kullanımlıdır: PENDING kalır.
    // Kişiye özel davet ise kabul edilince tükenir (ACCEPTED).
    const isShared = invite.email === null;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          fullName: dto.fullName,
          passwordHash,
          role: Role.AGENT,
          officeId: invite.officeId,
        },
      });

      if (!isShared) {
        await tx.invite.update({
          where: { id: invite.id },
          data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedByEmail: email },
        });
      }

      return this.auth.buildSession(user);
    });
  }

  /** Davetin PENDING/süre dolmamış dışındaki durumunu ayırt eder (UI'da farklı mesajlar için). */
  private getInviteInvalidReason(invite: {
    status: string;
    expiresAt: Date;
  }): InviteInvalidReason | null {
    if (invite.status === 'ACCEPTED') return 'ACCEPTED';
    if (invite.status === 'REVOKED') return 'REVOKED';
    if (invite.expiresAt < new Date()) return 'EXPIRED';
    return null;
  }

  private inviteInvalidReasonMessage(reason: InviteInvalidReason): string {
    switch (reason) {
      case 'EXPIRED':
        return 'Bu davetin süresi dolmuş';
      case 'ACCEPTED':
        return 'Bu davet zaten kullanılmış';
      case 'REVOKED':
        return 'Bu davet iptal edilmiş';
    }
  }

  private toInviteResponse(invite: {
    id: string;
    email?: string | null;
    token: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  }) {
    const base = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(
      /\/$/,
      '',
    );
    const now = new Date();
    const expiresInMs = invite.expiresAt.getTime() - now.getTime();
    const expiresInSeconds = Math.max(0, Math.floor(expiresInMs / 1000));
    const expiresInDays = Math.floor(expiresInSeconds / (24 * 3600));

    return {
      id: invite.id,
      email: invite.email,
      token: invite.token,
      status: invite.status,
      expiresAt: invite.expiresAt,
      expiresInSeconds,
      expiresInDays,
      createdAt: invite.createdAt,
      link: `${base}/invite/${invite.token}`,
    };
  }
}
