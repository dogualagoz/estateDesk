/**
 * Favicon + OG görsel üretim script'i.
 *
 * `frontend/public/logo.svg` kaynağından şu dosyaları üretir (hepsi frontend/public/ altına):
 *   - favicon.ico        → 16/32/48 px (PNG gömülü ICO; tarayıcı sekmesi + eski istemciler)
 *   - apple-touch-icon.png → 180 px, açık zemin üzerinde (iOS ana ekran kısayolu)
 *   - icon-192.png / icon-512.png → site.webmanifest (PWA/Android) ikonları
 *   - og-cover.png       → 1200×630 sosyal medya paylaşım kartı (OG/Twitter)
 *
 * Bağımlılık: backend'in sharp paketi (görsel yükleme için zaten kurulu) —
 * ek devDependency eklememek için backend/node_modules'tan çözülür.
 * ICO kabı elle yazılır (aşağıda `pnglerdenIco`): format 3 alandan ibaret
 * olduğu için ayrıca png-to-ico gibi bir pakete gerek yok.
 *
 * Çalıştırma (repo kökünden, backend bağımlılıkları kuruluyken):
 *   node scripts/generate-icons.mjs
 */
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// sharp'ı backend'in node_modules'ından yükle (bkz. üstteki not)
const require = createRequire(path.join(kok, 'backend', 'package.json'));
const sharp = require('sharp');

const publicDir = path.join(kok, 'frontend', 'public');
const logoSvg = await readFile(path.join(publicDir, 'logo.svg'));

// SVG'yi bir kez yüksek çözünürlükte rasterize et, tüm boyutlar buradan
// küçültülür — doğrudan küçük boyutta render etmekten daha keskin sonuç verir.
const buyukLogo = await sharp(logoSvg, { density: 300 })
  .resize(1024, 1024)
  .png()
  .toBuffer();

const logoPng = (boyut) =>
  sharp(buyukLogo).resize(boyut, boyut).png().toBuffer();

/**
 * PNG buffer'larını tek bir .ico dosyasında paketler.
 * ICO formatı: 6 baytlık başlık + her görsel için 16 baytlık dizin girdisi
 * + ardışık görsel verileri. Vista sonrası tüm istemciler PNG gömülü ICO okur.
 */
function pnglerdenIco(pngler /* { boyut, veri }[] */) {
  const baslik = Buffer.alloc(6);
  baslik.writeUInt16LE(1, 2); // tür: 1 = ikon
  baslik.writeUInt16LE(pngler.length, 4);

  let ofset = 6 + 16 * pngler.length; // ilk görsel verisinin dosyadaki yeri
  const girdiler = [];
  for (const { boyut, veri } of pngler) {
    const g = Buffer.alloc(16);
    g.writeUInt8(boyut === 256 ? 0 : boyut, 0); // genişlik (0 = 256)
    g.writeUInt8(boyut === 256 ? 0 : boyut, 1); // yükseklik
    g.writeUInt16LE(1, 4); // renk düzlemi
    g.writeUInt16LE(32, 6); // bit/piksel (RGBA)
    g.writeUInt32LE(veri.length, 8);
    g.writeUInt32LE(ofset, 12);
    ofset += veri.length;
    girdiler.push(g);
  }
  return Buffer.concat([baslik, ...girdiler, ...pngler.map((p) => p.veri)]);
}

// ── favicon.ico ──
const icoBoyutlari = [16, 32, 48];
const icoPngleri = await Promise.all(
  icoBoyutlari.map(async (boyut) => ({ boyut, veri: await logoPng(boyut) })),
);
await writeFile(path.join(publicDir, 'favicon.ico'), pnglerdenIco(icoPngleri));

// ── Manifest ikonları (köşeleri şeffaf, logo olduğu gibi) ──
await writeFile(path.join(publicDir, 'icon-192.png'), await logoPng(192));
await writeFile(path.join(publicDir, 'icon-512.png'), await logoPng(512));

// ── apple-touch-icon (180px) ──
// iOS köşeleri kendisi yuvarladığı için tam kanvas + açık zemin + içe pay
// kullanılır; şeffaf köşeli logoyu doğrudan vermek siyah zemine düşer.
const appleZemin = { r: 246, g: 247, b: 242, alpha: 1 }; // #F6F7F2
await sharp({
  create: { width: 180, height: 180, channels: 4, background: appleZemin },
})
  .composite([{ input: await logoPng(140), gravity: 'center' }])
  .png()
  .toBuffer()
  .then((veri) => writeFile(path.join(publicDir, 'apple-touch-icon.png'), veri));

// ── og-cover.png (1200×630) ──
// Zemin + metinler SVG olarak final boyutta çizilir, logo PNG'si üstüne
// bindirilir (SVG içine SVG gömmek yerine — font/nesting sürprizi olmasın).
const ogZeminSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#F6F7F2"/>
  <rect y="614" width="1200" height="16" fill="#4e604f"/>
  <g font-family="Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif">
    <text x="392" y="308" font-size="78" font-weight="700" fill="#33402F">emlakdefter</text>
    <text x="396" y="368" font-size="33" fill="#5C6B5D">Emlak ofisleri için portföy ve talep yönetimi</text>
    <text x="396" y="428" font-size="26" fill="#8A9584">emlakdefter.com</text>
  </g>
</svg>`;
const ogKapak = await sharp(Buffer.from(ogZeminSvg))
  .composite([{ input: await logoPng(240), left: 116, top: 195 }])
  .png()
  .toBuffer();
await writeFile(path.join(publicDir, 'og-cover.png'), ogKapak);

console.log('Üretildi: favicon.ico, icon-192.png, icon-512.png, apple-touch-icon.png, og-cover.png');
