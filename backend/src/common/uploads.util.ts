import * as path from 'path';

/**
 * Yüklenen dosyaların kök dizini.
 * Varsayılan: çalışma dizinindeki `uploads/` (Docker'da /app/uploads'a denk gelir).
 * Farklı bir konum gerekirse UPLOADS_DIR ortam değişkeniyle ezilir.
 */
export function uploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
}
