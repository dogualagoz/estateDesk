/**
 * İkon seti üretimi — frontend/public/logo.svg'den tüm favicon/PWA/OG görsellerini üretir.
 *
 * Bağımlılıklar backend/node_modules'ten çözülür (sharp + png-to-ico);
 * makinede ImageMagick gerekmez. Çalıştırma (repo kökünden):
 *
 *   node scripts/generate-icons.mjs
 *
 * Üretilenler (frontend/public/):
 *   favicon.ico          — 16/32/48 çoklu boyut (tarayıcı sekmesi, eski tarayıcılar)
 *   apple-touch-icon.png — 180×180, açık zemin (iOS ana ekran)
 *   icon-192.png         — 192×192 (PWA manifest)
 *   icon-512.png         — 512×512 (PWA manifest)
 *   og-cover.png         — 1200×630 sosyal paylaşım kartı (OG/Twitter)
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFile } from 'node:fs/promises';

// sharp ve png-to-ico backend'de kurulu — oradan çözümle
const require = createRequire(new URL('../backend/node_modules/', import.meta.url));
const sharp = require('sharp');
// png-to-ico derlenmiş TS modülü: fonksiyon .default altında
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_DIR = join(ROOT, 'frontend', 'public');
const LOGO_SVG = join(PUBLIC_DIR, 'logo.svg');

/** Marka renkleri (DESIGN.md — adaçayı paleti) */
const BRAND = {
  bg: '#F7F7F2', // açık krem zemin
  primary: '#4e604f',
  muted: '#6B7A6B',
};

/** Logoyu istenen boyutta, şeffaf zeminli PNG buffer'ına çevirir. */
function logoPng(size) {
  return sharp(LOGO_SVG, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** favicon.ico — 16/32/48 çoklu boyut tek dosyada. */
async function buildFavicon() {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => logoPng(s)));
  const ico = await pngToIco(pngs);
  await writeFile(join(PUBLIC_DIR, 'favicon.ico'), ico);
  console.log('✓ favicon.ico (16/32/48)');
}

/** apple-touch-icon — iOS şeffaflığı desteklemez; açık zemin + %12 iç boşluk. */
async function buildAppleTouch() {
  const size = 180;
  const inner = Math.round(size * 0.76);
  const logo = await logoPng(inner);
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND.bg },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180)');
}

/** PWA manifest ikonları — şeffaf zemin, tam boyut. */
async function buildManifestIcons() {
  for (const size of [192, 512]) {
    await writeFile(join(PUBLIC_DIR, `icon-${size}.png`), await logoPng(size));
    console.log(`✓ icon-${size}.png`);
  }
}

/** og-cover — 1200×630 sosyal kart: logo + isim + slogan (SVG kompozisyon). */
async function buildOgCover() {
  const W = 1200;
  const H = 630;
  const logo = await logoPng(240);

  // Metin katmanı SVG olarak çizilir (sharp'ta doğrudan metin API'si yok)
  const textSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="${W / 2}" y="440" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="72" font-weight="700" fill="${BRAND.primary}">emlakdefter</text>
      <text x="${W / 2}" y="510" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="30" font-weight="400" fill="${BRAND.muted}">Emlak ofisleri için portföy ve talep yönetimi</text>
    </svg>
  `);

  await sharp({
    create: { width: W, height: H, channels: 4, background: BRAND.bg },
  })
    .composite([
      { input: logo, top: 110, left: Math.round((W - 240) / 2) },
      { input: textSvg, top: 0, left: 0 },
    ])
    .png()
    .toFile(join(PUBLIC_DIR, 'og-cover.png'));
  console.log('✓ og-cover.png (1200×630)');
}

await buildFavicon();
await buildAppleTouch();
await buildManifestIcons();
await buildOgCover();
console.log('Tüm ikonlar üretildi →', PUBLIC_DIR);
