import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Curated Unsplash photo IDs by property type
// Format: https://images.unsplash.com/photo-{id}?w=900&auto=format&fit=crop&q=80
const BASE = 'https://images.unsplash.com/photo-';
const OPTS = '?w=900&auto=format&fit=crop&q=80';

const u = (id: string) => `${BASE}${id}${OPTS}`;

const APARTMENT_POOLS: string[][] = [
  [u('1560448204-e02f11c3d0e2'), u('1484154218962-a197022b5858'), u('1556912172-45b7abe8b7e1')],
  [u('1502672260266-1c1ef2d93688'), u('1555041469-a586c61ea9bc'), u('1554995207-c18c203602cb')],
  [u('1522708323590-d24dbb6b0267'), u('1493809842364-78817add7ffb'), u('1618221195710-dd6b41faaea6')],
  [u('1512917774080-9991f1c4c750'), u('1598928506311-c55ded91a20c'), u('1505691938895-1758d7feb511')],
  [u('1493663284031-b7e3aefcae8e'), u('1565183997392-2f6f122e5912'), u('1583847268964-b28dc8f51f92')],
  [u('1574362848149-11496d93a7c7'), u('1600607687939-ce8a6c25118c'), u('1556228453-efd6c1ff04f6')],
  [u('1600573472591-ee6b68d14c68'), u('1600047509807-ba8f99d2cdde'), u('1600585154340-be6161a56a0c')],
  [u('1600607687920-4e2a09cf159d'), u('1558618666-fcd25c85cd64'), u('1570129477492-45c003edd2be')],
  [u('1560185007-c5ca9d2c014d'), u('1600596542815-ffad4c1539a9'), u('1560185127-6ed189bf02f4')],
  [u('1628592102751-ba83b0314276'), u('1560448075-bb485b067938'), u('1460317442991-0ec209397118')],
];

const VILLA_POOLS: string[][] = [
  [u('1564013799919-ab600027ffc6'), u('1580587771525-78b9dba3b914'), u('1598928506311-c55ded91a20c')],
  [u('1512917774080-9991f1c4c750'), u('1568605114967-8130f3a36994'), u('1613977257592-4871e5fcd7c4')],
  [u('1600047509807-ba8f99d2cdde'), u('1600585154526-990dced4db0d'), u('1600585154340-be6161a56a0c')],
  [u('1502005097973-6a7082348e28'), u('1583847268964-b28dc8f51f92'), u('1512917774080-9991f1c4c750')],
  [u('1600596542815-ffad4c1539a9'), u('1570129477492-45c003edd2be'), u('1564013799919-ab600027ffc6')],
  [u('1600607687920-4e2a09cf159d'), u('1568605114967-8130f3a36994'), u('1580587771525-78b9dba3b914')],
];

const LAND_POOLS: string[][] = [
  [u('1500382017468-9049fed747ef'), u('1464822759023-fed622ff2c3b'), u('1501854140801-50d01698950b')],
  [u('1472214103451-9374bd1c798e'), u('1449034446853-66c86144b0ad'), u('1506744038136-46273834b3fb')],
  [u('1506744038136-46273834b3fb'), u('1464822759023-fed622ff2c3b'), u('1472214103451-9374bd1c798e')],
  [u('1501854140801-50d01698950b'), u('1500382017468-9049fed747ef'), u('1449034446853-66c86144b0ad')],
];

const SHOP_POOLS: string[][] = [
  [u('1604719312566-8912e9227c6a'), u('1441986300917-64674bd600d8'), u('1441984904996-e0b6ba687e04')],
  [u('1555396273-367ea4eb4db5'), u('1572635196237-14b3f281503f'), u('1555529669-e69e7aa0ba9a')],
];

const OFFICE_POOLS: string[][] = [
  [u('1497366216548-37526070297c'), u('1497215728101-856f4ea42174'), u('1497366811353-6870744d04b2')],
  [u('1504384308090-c894fdcc538d'), u('1524758631624-e2822e304c36'), u('1531973576160-7125cd663d86')],
];

const HOTEL_POOLS: string[][] = [
  [u('1571896349842-33c89424de2d'), u('1578683010236-d716f9a3f461'), u('1445019980597-93fa8acb246c')],
  [u('1520250497591-112f2f40a3f4'), u('1566073771259-6a8506099945'), u('1455587734955-081b22074882')],
];

function pickImages(pools: string[][], index: number): string[] {
  return pools[index % pools.length];
}

// Havuzlardaki tüm geçerli URL'ler — eski/kırık seed görsellerini ayırt etmek için
const ALL_POOLS = [
  ...APARTMENT_POOLS, ...VILLA_POOLS, ...LAND_POOLS,
  ...SHOP_POOLS, ...OFFICE_POOLS, ...HOTEL_POOLS,
];
const VALID_URLS = new Set(ALL_POOLS.flat());

const isSeedImage = (img: string) => img.startsWith(BASE);

// Atanabilir: hiç görseli yok, ya da tüm görselleri seed kaynaklı ve
// en az biri artık havuzda olmayan (kırık) bir URL
function needsAssignment(images: string[]): boolean {
  if (images.length === 0) return true;
  if (!images.every(isSeedImage)) return false; // kullanıcı yüklemesi var, dokunma
  return images.some((img) => !VALID_URLS.has(img));
}

async function main() {
  const portfolios = await prisma.portfolio.findMany({
    where: { deletedAt: null },
    select: { id: true, type: true, images: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`[seed-images] ${portfolios.length} portföy bulundu`);

  const byType: Record<string, typeof portfolios> = {};
  for (const p of portfolios) {
    byType[p.type] = byType[p.type] || [];
    byType[p.type].push(p);
  }

  let updated = 0;
  for (const [type, items] of Object.entries(byType)) {
    let pools: string[][];
    if (type === 'APARTMENT') pools = APARTMENT_POOLS;
    else if (type === 'VILLA') pools = VILLA_POOLS;
    else if (type === 'LAND') pools = LAND_POOLS;
    else if (type === 'SHOP') pools = SHOP_POOLS;
    else if (type === 'OFFICE') pools = OFFICE_POOLS;
    else pools = HOTEL_POOLS;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!needsAssignment(item.images)) continue;
      const images = pickImages(pools, i);
      await prisma.portfolio.update({
        where: { id: item.id },
        data: { images },
      });
      updated++;
    }
    console.log(`[seed-images] ${type}: ${items.length} ilan işlendi`);
  }

  console.log(`[seed-images] Tamamlandı — ${updated} ilan güncellendi`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
