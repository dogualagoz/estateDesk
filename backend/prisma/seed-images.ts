import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Curated Unsplash photo IDs by property type
// Format: https://images.unsplash.com/photo-{id}?w=900&auto=format&fit=crop&q=80
const BASE = 'https://images.unsplash.com/photo-';
const OPTS = '?w=900&auto=format&fit=crop&q=80';

const u = (id: string) => `${BASE}${id}${OPTS}`;

const APARTMENT_POOLS: string[][] = [
  [u('1560448204-e02f11c3d0e2'), u('1484154218962-a197022b5858'), u('1556912172-45b7abe8b7e1')],
  [u('1502672260266-1c1ef2d93688'), u('1555041469-a586c61ea9bc'), u('1586023492125-27b2c045efd3')],
  [u('1522708323590-d24dbb6b0267'), u('1493809842364-78817add7ffb'), u('1618221195710-dd6b41faaea6')],
  [u('1512917774080-9991f1c4c750'), u('1598928506311-c55ded91a20c'), u('1567767292276-f338a79a44e3')],
  [u('1539622106-8e84cd57f7ad'), u('1565183997392-2f6f122e5912'), u('1583847268964-b28dc8f51f92')],
  [u('1574362848149-11496d93a7c7'), u('1600607687939-ce8a6c25118c'), u('1600566753376-12c8021ece93')],
  [u('1600573472591-ee6b68d14c68'), u('1600047509807-ba8f99d2cdde'), u('1600210492486-724a5775c15c')],
  [u('1613490493576-4d884d284cfd'), u('1558618666-fcd25c85cd64'), u('1570129477492-45c003edd2be')],
  [u('1581404759436-b0cf3c1d1fe4'), u('1600596542815-ffad4c1539a9'), u('1585128792020-773cb4f4bea2')],
  [u('1628592102751-ba83b0314276'), u('1600047509808-9534350b1882'), u('1460317442991-0ec209397118')],
];

const VILLA_POOLS: string[][] = [
  [u('1564013799919-ab600027ffc6'), u('1580587771525-78b9dba3b914'), u('1598928506311-c55ded91a20c')],
  [u('1512917774080-9991f1c4c750'), u('1568605114967-8130f3a36994'), u('1613977257592-4871e5fcd7c4')],
  [u('1600047509807-ba8f99d2cdde'), u('1576941089067-2de3c901b732'), u('1600210492486-724a5775c15c')],
  [u('1502005097973-6a7082348e28'), u('1583847268964-b28dc8f51f92'), u('1512917774080-9991f1c4c750')],
  [u('1600596542815-ffad4c1539a9'), u('1570129477492-45c003edd2be'), u('1564013799919-ab600027ffc6')],
  [u('1613490493576-4d884d284cfd'), u('1568605114967-8130f3a36994'), u('1580587771525-78b9dba3b914')],
];

const LAND_POOLS: string[][] = [
  [u('1500382017468-9049fed747ef'), u('1464822759023-fed622ff2c3b'), u('1501854140801-50d01698950b')],
  [u('1470770841072-f0747dface05'), u('1449034446853-66c86144b0ad'), u('1500534314209-a157a498-0ebe')],
  [u('1500534314209-a157a498-0ebe'), u('1464822759023-fed622ff2c3b'), u('1470770841072-f0747dface05')],
  [u('1501854140801-50d01698950b'), u('1500382017468-9049fed747ef'), u('1449034446853-66c86144b0ad')],
];

const SHOP_POOLS: string[][] = [
  [u('1604719312566-8912e9227c6a'), u('1441986300917-64674bd600d8'), u('1534452203293-dd4f7d33e4c9')],
  [u('1555396273-367ea4eb4db5'), u('1572635196237-14b3f281503f'), u('1567401893413-76a533f98a8e')],
];

const OFFICE_POOLS: string[][] = [
  [u('1497366216548-37526070297c'), u('1497366754035-f200b83c2338'), u('1497366811353-6870744d04b2')],
  [u('1504384308090-c894fdcc538d'), u('1497366858526-0a96f28379ef'), u('1462826303086-329f2658815f')],
];

const HOTEL_POOLS: string[][] = [
  [u('1571896349842-33c89424de2d'), u('1578683010236-d716f9a3f461'), u('1445019980597-93fa8acb246c')],
  [u('1520250497591-112f2f40a3f4'), u('1560347876-aeef00932128'), u('1455587734955-081b22074882')],
];

function pickImages(pools: string[][], index: number): string[] {
  return pools[index % pools.length];
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
      if (item.images.length > 0) continue; // zaten görseli varsa atla
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
