import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_DEMO_SAFE_KEY } from './demo-safe.decorator';

/**
 * Demo kullanıcılarının (isDemo=true) veri değiştirmesini engeller.
 * GET/HEAD/OPTIONS serbesttir; POST/PUT/PATCH/DELETE reddedilir.
 * @DemoSafe() ile işaretli endpoint'ler (salt-okunur POST'lar) muaftır.
 *
 * JwtAuthGuard'dan sonra çalışacak şekilde APP_GUARD olarak kaydedilir,
 * böylece req.user dolu olur. Public route'larda (login, register, demo)
 * req.user tanımsız olduğundan engelleme uygulanmaz.
 */
@Injectable()
export class DemoReadOnlyGuard implements CanActivate {
  private static readonly MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const method = (req.method || '').toUpperCase();

    if (!DemoReadOnlyGuard.MUTATING.has(method)) return true;
    if (req.user?.isDemo !== true) return true;

    const demoSafe = this.reflector.getAllAndOverride<boolean>(IS_DEMO_SAFE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (demoSafe) return true;

    throw new ForbiddenException(
      'Demo modunda değişiklik yapılamaz. Kendi hesabınızı oluşturmak için kaydolun.',
    );
  }
}
