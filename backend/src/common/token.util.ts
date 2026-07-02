import { randomBytes } from 'crypto';

/**
 * Public link token'ı üretir (davet linki, paylaşılan defter linki).
 *
 * Neden cuid değil: cuid çakışmaya dirençlidir ama tahmin edilemezlik
 * (unguessability) için tasarlanmamıştır — zaman damgası ve sayaç içerir.
 * Dışarıya açılan linklerde token'ın kaba kuvvetle bulunamaz olması gerekir;
 * 256-bit kriptografik rastgelelik bunu garanti eder.
 *
 * @returns 43 karakterlik URL-güvenli (base64url) token
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}
