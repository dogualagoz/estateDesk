import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { generateSecureToken } from '../common/token.util';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
import { EmailService } from '../email/email.service';
import { AuthUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Audit kayıtları için controller'dan gelen istek meta bilgisi. */
export interface RequestMeta {
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

// Kayıtlı olmayan e-postalarda da bcrypt.compare çalıştırmak için sahte hash
// (rastgele bir dizinin önceden üretilmiş bcrypt-10 hash'i; hiçbir şifreyle eşleşmez).
// Kullanıcı yokken erken dönmek, yanıt süresi farkından e-posta varlığının
// tespit edilmesine (timing-based user enumeration) izin verirdi.
const DUMMY_PASSWORD_HASH = '$2b$10$5fcElG0ye/oSErR/elKh8ORw8nHlYzHiG3hDQ0xZEQrAqUzoTlLSm';
const PASSWORD_RESET_TTL_HOURS = 1;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
    private email: EmailService,
  ) {}

  async login(dto: LoginDto, meta: RequestMeta = {}) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Tek ortak mesaj + sabit süreli karşılaştırma: kayıtlı e-postaların
    // dışarıdan tespitini (user enumeration) hem mesaj hem zamanlama yönünden engeller
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !ok) {
      this.audit.log({
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        userId: user?.id,
        // Başarısız denemede e-postayı metadata'da tut (brute-force analizi için)
        metadata: { email: dto.email },
        ...meta,
      });
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Hesabınız deaktif edilmiştir. Lütfen destek ekibi ile iletişime geçin',
      );
    }

    this.audit.log({
      action: AUDIT_ACTIONS.AUTH_LOGIN,
      userId: user.id,
      officeId: user.officeId,
      ...meta,
    });

    return this.buildSession(user);
  }

  async register(dto: RegisterDto, meta: RequestMeta = {}) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: Role.AGENT,
      },
    });

    this.audit.log({ action: AUDIT_ACTIONS.AUTH_REGISTER, userId: user.id, ...meta });

    return this.buildSession(user);
  }

  /** Şifresiz, salt-okunur demo oturumu açar. Landing'deki "Demo'yu İncele" çağırır. */
  async demoLogin(meta: RequestMeta = {}) {
    const user = await this.prisma.user.findFirst({
      where: { isDemo: true, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!user) {
      throw new UnauthorizedException('Demo hesabı bulunamadı');
    }

    this.audit.log({ action: AUDIT_ACTIONS.AUTH_DEMO_LOGIN, userId: user.id, ...meta });

    return this.buildSession(user);
  }

  /** Çıkış audit kaydı — token invalidasyonu yapılmaz (bkz. controller yorumu). */
  logout(user: AuthUser, meta: RequestMeta = {}) {
    this.audit.log({
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      userId: user.id,
      officeId: user.officeId,
      ...meta,
    });
    return { success: true };
  }

  /** JWT + istemciye dönen oturum özeti. Davetle kayıt akışı (InviteService) da kullanır. */
  async buildSession(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        officeId: user.officeId,
        isDemo: user.isDemo,
      },
    };
  }

  async requestPasswordReset(email: string, resetUrl: string, meta: RequestMeta = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000);

      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      this.email.sendPasswordResetEmail(user.email, `${resetUrl}/${token}`);

      this.audit.log({
        action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
        userId: user.id,
        metadata: { email: user.email },
        ...meta,
      });
    } else {
      // User enumeration koruması: e-posta olmasa da aynı mesaj
      this.audit.log({
        action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
        metadata: { email: normalizedEmail },
        ...meta,
      });
    }

    return { message: 'E-posta adresine sıfırlama linki gönderdik' };
  }

  async validateResetToken(token: string) {
    const reset = await this.prisma.passwordReset.findUnique({ where: { token } });

    if (!reset) {
      return { valid: false };
    }

    const isExpired = new Date() > reset.expiresAt;
    const isUsed = reset.status === 'USED';

    if (isExpired || isUsed) {
      return { valid: false };
    }

    return { valid: true };
  }

  async resetPassword(token: string, newPassword: string, meta: RequestMeta = {}) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      throw new BadRequestException('Bu link geçersiz veya süresi dolmuş');
    }

    const isExpired = new Date() > reset.expiresAt;
    const isUsed = reset.status === 'USED';

    if (isExpired || isUsed) {
      throw new BadRequestException('Bu link geçersiz veya süresi dolmuş');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { status: 'USED', usedAt: new Date() },
      }),
    ]);

    this.audit.log({
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET,
      userId: reset.userId,
      metadata: { email: reset.user.email },
      ...meta,
    });

    return { message: 'Şifreniz başarıyla güncellenmiştir' };
  }
}
