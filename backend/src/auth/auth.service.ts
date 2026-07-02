import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
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
}
