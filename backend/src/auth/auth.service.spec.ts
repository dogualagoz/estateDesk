import { plainToInstance } from 'class-transformer';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

function makeService(userOverrides: Record<string, any> = {}) {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      ...userOverrides,
    },
  } as any;
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') } as any;
  const audit = { log: jest.fn() } as any;
  const email = { sendPasswordResetEmail: jest.fn() } as any;
  const service = new AuthService(prisma, jwt, audit, email);
  return { service, prisma, jwt, audit, email };
}

describe('AuthService.register', () => {
  it('RegisterDto @Transform ile normalize edilmiş (lowercase) e-postayı kullanır', async () => {
    const { service, prisma } = makeService({
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'test@x.com',
        fullName: 'Test User',
        role: 'AGENT',
        officeId: null,
        isDemo: false,
      }),
    });
    const dto = plainToInstance(RegisterDto, {
      email: 'Test@X.com',
      fullName: 'Test User',
      password: 'Abcdef12',
    });
    expect(dto.email).toBe('test@x.com');

    await service.register(dto);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@x.com' } });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: 'test@x.com' }) }),
    );
  });

  it('e-posta zaten kayıtlıysa ConflictException fırlatır', async () => {
    const { service } = makeService({
      findUnique: jest.fn().mockResolvedValue({ id: 'existing' }),
    });
    const dto = plainToInstance(RegisterDto, {
      email: 'test@x.com',
      fullName: 'Test User',
      password: 'Abcdef12',
    });

    await expect(service.register(dto)).rejects.toThrow(ConflictException);
  });
});

describe('AuthService.login', () => {
  it('kullanıcı bulunamazsa UnauthorizedException fırlatır (enumeration önleme)', async () => {
    const { service } = makeService({ findUnique: jest.fn().mockResolvedValue(null) });
    const dto = plainToInstance(LoginDto, { email: 'Nope@X.com', password: 'whatever' });

    await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('kullanıcı yokken de bcrypt.compare çağırır (timing enumeration önleme)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcrypt');
    bcrypt.compare.mockClear();
    const { service } = makeService({ findUnique: jest.fn().mockResolvedValue(null) });
    const dto = plainToInstance(LoginDto, { email: 'nope@x.com', password: 'whatever' });

    await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    // Erken dönüş yok: sahte hash ile karşılaştırma yapılmış olmalı
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
  });

  it('deaktif kullanıcıyı reddeder', async () => {
    const { service } = makeService({
      findUnique: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'hashed',
        isActive: false,
      }),
    });
    const dto = plainToInstance(LoginDto, { email: 'a@b.com', password: 'Abcdef12' });

    await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('LoginDto @Transform ile normalize edilmiş e-postayla arama yapar', async () => {
    const { service, prisma } = makeService({
      findUnique: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'hashed',
        isActive: true,
        role: 'AGENT',
        officeId: null,
        isDemo: false,
      }),
    });
    const dto = plainToInstance(LoginDto, { email: 'A@B.com', password: 'Abcdef12' });
    expect(dto.email).toBe('a@b.com');

    await service.login(dto);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });
});
