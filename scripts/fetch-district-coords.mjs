/**
 * Nominatim ile hedef şehirlerin ilçe koordinatlarını çeker.
 * Çıktı: backend/src/matching/tr-district-coords.ts
 *
 * Kullanım: node scripts/fetch-district-coords.mjs
 * Rate limit: 1 istek/sn (Nominatim politikası)
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../backend/src/matching/tr-district-coords.ts');

// Sadece büyük emlak şehirleri — diğerleri için kademeli fallback yeterli
const TARGET_CITIES = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Bursa',
  'Antalya',
  'Mersin',
  'Adana',
  'Kocaeli',
  'Konya',
  'Gaziantep',
  'Muğla',
  'Balıkesir',
  'Manisa',
  'Aydın',
  'Trabzon',
  'Samsun',
  'Eskişehir',
  'Denizli',
  'Sakarya',
  'Tekirdağ',
];

// tr-locations.ts kaynaklı ilçe listesi
const DISTRICTS_BY_CITY = {
  'İstanbul': ['Adalar','Arnavutköy','Ataşehir','Avcılar','Bağcılar','Bahçelievler','Bakırköy','Başakşehir','Bayrampaşa','Beşiktaş','Beykoz','Beylikdüzü','Beyoğlu','Büyükçekmece','Çatalca','Çekmeköy','Esenler','Esenyurt','Eyüpsultan','Fatih','Gaziosmanpaşa','Güngören','Kadıköy','Kağıthane','Kartal','Küçükçekmece','Maltepe','Pendik','Sancaktepe','Sarıyer','Silivri','Sultanbeyli','Sultangazi','Şile','Şişli','Tuzla','Ümraniye','Üsküdar','Zeytinburnu'],
  'Ankara': ['Akyurt','Altındağ','Ayaş','Balâ','Beypazarı','Çamlıdere','Çankaya','Çubuk','Elmadağ','Etimesgut','Evren','Gölbaşı','Güdül','Haymana','Kahramankazan','Kalecik','Keçiören','Kızılcahamam','Mamak','Nallıhan','Polatlı','Pursaklar','Sincan','Şereflikoçhisar','Yenimahalle'],
  'İzmir': ['Aliağa','Balçova','Bayındır','Bayraklı','Bergama','Beydağ','Bornova','Buca','Çeşme','Çiğli','Dikili','Foça','Gaziemir','Güzelbahçe','Karabağlar','Karaburun','Karşıyaka','Kemalpaşa','Kınık','Kiraz','Konak','Menderes','Menemen','Narlıdere','Ödemiş','Seferihisar','Selçuk','Tire','Torbalı','Urla'],
  'Bursa': ['Büyükorhan','Gemlik','Gürsu','Harmancık','İnegöl','İznik','Karacabey','Keles','Kestel','Mudanya','Mustafakemalpaşa','Nilüfer','Orhaneli','Orhangazi','Osmangazi','Yenişehir','Yıldırım'],
  'Antalya': ['Akseki','Aksu','Alanya','Demre','Döşemealtı','Elmalı','Finike','Gazipaşa','Gündoğmuş','İbradı','Kaş','Kemer','Kepez','Konyaaltı','Korkuteli','Kumluca','Manavgat','Muratpaşa','Serik'],
  'Mersin': ['Akdeniz','Anamur','Aydıncık','Bozyazı','Çamlıyayla','Erdemli','Gülnar','Mezitli','Mut','Silifke','Tarsus','Toroslar','Yenişehir'],
  'Adana': ['Aladağ','Ceyhan','Çukurova','Feke','İmamoğlu','Karaisalı','Karataş','Kozan','Pozantı','Saimbeyli','Sarıçam','Seyhan','Tufanbeyli','Yumurtalık','Yüreğir'],
  'Kocaeli': ['Başiskele','Çayırova','Darıca','Derince','Dilovası','Gebze','Gölcük','İzmit','Kandıra','Karamürsel','Kartepe','Körfez'],
  'Konya': ['Ahırlı','Akören','Akşehir','Altınekin','Beyşehir','Bozkır','Cihanbeyli','Çeltik','Çumra','Derbent','Derebucak','Doğanhisar','Emirgazi','Ereğli','Güneysinir','Hadim','Halkapınar','Hüyük','Ilgın','Kadınhanı','Karapınar','Karatay','Kulu','Meram','Sarayönü','Selçuklu','Seydişehir','Taşkent','Tuzlukçu','Yalıhüyük','Yunak'],
  'Gaziantep': ['Araban','İslahiye','Karkamış','Nizip','Nurdağı','Oğuzeli','Şahinbey','Şehitkamil','Yavuzeli'],
  'Muğla': ['Bodrum','Dalaman','Datça','Fethiye','Kavaklıdere','Köyceğiz','Marmaris','Menteşe','Milas','Ortaca','Seydikemer','Ula','Yatağan'],
  'Balıkesir': ['Altıeylül','Ayvalık','Balya','Bandırma','Bigadiç','Burhaniye','Dursunbey','Edremit','Erdek','Gömeç','Gönen','Havran','İvrindi','Karesi','Kepsut','Manyas','Marmara','Savaştepe','Sındırgı','Susurluk'],
  'Manisa': ['Ahmetli','Akhisar','Alaşehir','Demirci','Gölmarmara','Gördes','Kırkağaç','Köprübaşı','Kula','Merkez','Salihli','Sarıgöl','Saruhanlı','Selendi','Soma','Şehzadeler','Turgutlu','Yunusemre'],
  'Aydın': ['Bozdoğan','Buharkent','Çine','Didim','Efeler','Germencik','İncirliova','Karacasu','Karpuzlu','Koçarlı','Köşk','Kuşadası','Kuyucak','Nazilli','Söke','Sultanhisar','Yenipazar'],
  'Trabzon': ['Akçaabat','Araklı','Arsin','Beşikdüzü','Çarşıbaşı','Çaykara','Dernekpazarı','Düzköy','Hayrat','Köprübaşı','Maçka','Of','Ortahisar','Şalpazarı','Sürmene','Tonya','Vakfıkebir','Yomra'],
  'Samsun': ['19 Mayıs','Alaçam','Asarcık','Atakum','Ayvacık','Bafra','Canik','Çarşamba','Havza','İlkadım','Kavak','Ladik','Ondokuzmayıs','Salıpazarı','Tekkeköy','Terme','Vezirköprü','Yakakent'],
  'Eskişehir': ['Alpu','Beylikova','Çifteler','Günyüzü','Han','İnönü','Mahmudiye','Mihalgazi','Mihallıççık','Odunpazarı','Sarıcakaya','Seyitgazi','Sivrihisar','Tepebaşı'],
  'Denizli': ['Acıpayam','Babadağ','Baklan','Bekilli','Beyağaç','Bozkurt','Buldan','Çal','Çameli','Çardak','Çivril','Güney','Honaz','Kale','Merkezefendi','Pamukkale','Sarayköy','Serinhisar','Tavas'],
  'Sakarya': ['Adapazarı','Akyazı','Arifiye','Erenler','Ferizli','Geyve','Hendek','Karapürçek','Karasu','Kaynarca','Kocaali','Mithatpaşa','Pamukova','Sapanca','Serdivan','Söğütlü','Taraklı'],
  'Tekirdağ': ['Çerkezköy','Çorlu','Ergene','Hayrabolu','Kapaklı','Malkara','Marmaraereğlisi','Muratlı','Saray','Şarköy','Süleymanpaşa'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocodeDistrict(district, city) {
  const query = `${district}, ${city}, Türkiye`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=tr`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EstateDesk/1.0 (internal tool; district coord enrichment)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${query}`);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function normalizeText(input) {
  if (!input) return '';
  return input
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

async function main() {
  const results = {}; // key: "city/district_normalized" → {lat, lng}
  const failed = [];

  let total = 0;
  let done = 0;

  for (const city of TARGET_CITIES) {
    total += (DISTRICTS_BY_CITY[city] || []).length;
  }

  console.log(`Toplam ${total} ilçe sorgulanacak (~${Math.ceil(total / 60)} dk)`);
  console.log('');

  for (const city of TARGET_CITIES) {
    const districts = DISTRICTS_BY_CITY[city] || [];
    console.log(`[${city}] ${districts.length} ilçe...`);

    for (const district of districts) {
      await sleep(1100); // Nominatim: max 1 req/sn
      try {
        const coord = await geocodeDistrict(district, city);
        if (coord) {
          const key = `${normalizeText(city)}/${normalizeText(district)}`;
          results[key] = coord;
          done++;
          process.stdout.write(`  ✓ ${district} (${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)})\n`);
        } else {
          failed.push(`${city}/${district}`);
          process.stdout.write(`  ✗ ${district} (bulunamadı)\n`);
        }
      } catch (err) {
        failed.push(`${city}/${district}: ${err.message}`);
        process.stdout.write(`  ! ${district} (hata: ${err.message})\n`);
      }
    }
    console.log('');
  }

  // TS dosyası üret
  const lines = [
    '// Auto-generated — do not edit manually.',
    '// Regenerate: node scripts/fetch-district-coords.mjs',
    '//',
    '// Key format: "normalizedCity/normalizedDistrict"',
    '// Kapsam: büyük emlak şehirleri. Diğerleri için locationScore kademeli fallback kullanır.',
    '',
    'export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {',
  ];

  for (const [key, val] of Object.entries(results).sort()) {
    lines.push(`  '${key}': { lat: ${val.lat.toFixed(5)}, lng: ${val.lng.toFixed(5)} },`);
  }

  lines.push('};');
  lines.push('');

  writeFileSync(OUT_PATH, lines.join('\n'), 'utf-8');

  console.log(`✓ ${done} ilçe yazıldı → ${OUT_PATH}`);
  if (failed.length) {
    console.log(`✗ ${failed.length} bulunamadı:`);
    failed.forEach((f) => console.log('  -', f));
  }
}

main().catch((err) => {
  console.error('HATA:', err.message);
  process.exit(1);
});
