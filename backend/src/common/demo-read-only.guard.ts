import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Demo kullanıcılarının (isDemo=true) veri değiştirmesini engeller.
 * GET/HEAD/OPTIONS serbesttir; POST/PUT/PATCH/DELETE reddedilir.
 *
 * JwtAuthGuard'dan sonra çalışacak şekilde APP_GUARD olarak kaydedilir,
 * böylece req.user dolu olur. Public route'larda (login, register, demo)
 * req.user tanımsız olduğundan engelleme uygulanmaz.
 */
@Injectable()
export class DemoReadOnlyGuard implements CanActivate {
  private static readonly MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const method = (req.method || '').toUpperCase();

    if (!DemoReadOnlyGuard.MUTATING.has(method)) return true;
    if (req.user?.isDemo !== true) return true;

    throw new ForbiddenException(
      'Demo modunda değişiklik yapılamaz. Kendi hesabınızı oluşturmak için kaydolun.',
    );
  }
}
