import { SetMetadata } from '@nestjs/common';

/**
 * Veri değiştirmeyen ama POST ile çağrılan endpoint'leri işaretler
 * (örn. eşleştirme hesaplaması). DemoReadOnlyGuard bu işareti görünce
 * demo kullanıcısına izin verir.
 */
export const IS_DEMO_SAFE_KEY = 'isDemoSafe';
export const DemoSafe = () => SetMetadata(IS_DEMO_SAFE_KEY, true);
