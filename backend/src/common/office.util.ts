import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../auth/decorators/current-user.decorator';

/**
 * Ofise bağlı kaynaklara erişimden önce kullanıcının bir ofiste olduğunu garanti eder.
 * Onboarding'i tamamlamamış (officeId === null) kullanıcılar engellenir.
 */
export function requireOfficeId(user: AuthUser): string {
  if (!user.officeId) {
    throw new ForbiddenException('Önce bir ofise katılın veya ofis oluşturun');
  }
  return user.officeId;
}
