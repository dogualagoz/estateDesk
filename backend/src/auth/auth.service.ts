import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Bu e-posta adresine kayıtlı hesap bulunamadı');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hesabınız deaktif edilmiştir. Lütfen destek ekibi ile iletişime geçin');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Şifre yanlış. Lütfen kontrol edip tekrar deneyin');
    }

    return this.buildSession(user);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: Role.AGENT,
      },
    });

    return this.buildSession(user);
  }

  /** Şifresiz, salt-okunur demo oturumu açar. Landing'deki "Demo'yu İncele" çağırır. */
  async demoLogin() {
    const user = await this.prisma.user.findFirst({
      where: { isDemo: true, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!user) {
      throw new UnauthorizedException('Demo hesabı bulunamadı');
    }
    return this.buildSession(user);
  }

  private async buildSession(user: User) {
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
