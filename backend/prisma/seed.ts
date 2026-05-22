import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@estatedesk.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'changeme123';
  const fullName = process.env.SEED_ADMIN_NAME || 'Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Admin already exists: ${email}`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role: Role.ADMIN, isActive: true },
  });
  console.log(`[seed] Admin created: ${user.email}`);
  return user;
}

async function seedPortfolios(ownerId: string) {
  const count = await prisma.portfolio.count();
  if (count > 0) {
    console.log(`[seed] Portfolios already present (${count}), skipping.`);
    return;
  }

  const data = [
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Moda’da Deniz Manzaralı 3+1',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Moda',
      areaSqm: 135, roomCount: '3+1', price: 11500000,
      features: ['Asansör', 'Otopark', 'Deniz Manzarası', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Ayşe Yılmaz', ownerPhone: '05321110001',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Caferağa 2+1 Bütçe Dostu',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Caferağa',
      areaSqm: 95, roomCount: '2+1', price: 8200000,
      features: ['Asansör', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Mehmet Demir', ownerPhone: '05321110002',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Geniş 4+1 Lüks Daire',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fenerbahçe',
      areaSqm: 210, roomCount: '4+1', price: 13800000,
      features: ['Asansör', 'Otopark', 'Havuz', 'Güvenlik', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Zeynep Kaya', ownerPhone: '05321110003',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Üsküdar 3+1 (ilansız)',
      city: 'İstanbul', district: 'Üsküdar', neighborhood: 'Acıbadem',
      areaSqm: 128, roomCount: '3+1', price: 9600000,
      features: ['Asansör', 'Otopark', 'Güvenlik'],
      visibility: 'HIDDEN', ownerName: 'Cengiz Aksoy', ownerPhone: '05321110004',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Kiralık 2+1 Eşyalı',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Bostancı',
      areaSqm: 90, roomCount: '2+1', price: 42000,
      features: ['Asansör', 'Eşyalı', 'Klima'],
      visibility: 'PUBLIC', ownerName: 'Deniz Şahin', ownerPhone: '05321110005',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Çekmeköy Müstakil Villa',
      city: 'İstanbul', district: 'Çekmeköy', neighborhood: 'Mimar Sinan',
      areaSqm: 320, roomCount: '5+1', price: 24500000,
      features: ['Havuz', 'Bahçe', 'Güvenlik', 'Kapalı Otopark'],
      visibility: 'PUBLIC', ownerName: 'Burak Çelik', ownerPhone: '05321110006',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Ankara Çankaya 3+1',
      city: 'Ankara', district: 'Çankaya', neighborhood: 'Çukurambar',
      areaSqm: 140, roomCount: '3+1', price: 7400000,
      features: ['Asansör', 'Otopark', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Elif Arslan', ownerPhone: '05321110007',
    },
  ] as const;

  for (const p of data) {
    await prisma.portfolio.create({ data: { ...p, createdById: ownerId } as any });
  }
  console.log(`[seed] ${data.length} portfolios created.`);
}

async function seedDemands(ownerId: string) {
  const count = await prisma.demand.count();
  if (count > 0) {
    console.log(`[seed] Demands already present (${count}), skipping.`);
    return;
  }

  await prisma.demand.create({
    data: {
      types: ['APARTMENT'],
      listingType: 'SALE',
      regions: ['Kadıköy'],
      city: 'İstanbul',
      district: 'Kadıköy',
      minBudget: 9000000,
      maxBudget: 12000000,
      roomPreferences: ['3+1'],
      minArea: 120,
      maxArea: 180,
      mustHaveFeatures: ['Asansör'],
      bonusFeatures: ['Deniz Manzarası', 'Otopark'],
      customerName: 'Selin Öztürk',
      customerPhone: '05339990001',
      createdById: ownerId,
    } as any,
  });
  console.log('[seed] 1 demand created.');
}

async function main() {
  const admin = await seedAdmin();
  await seedPortfolios(admin.id);
  await seedDemands(admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
