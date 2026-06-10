/**
 * Var olan bir kullanıcının ofisine demo verisi yükler.
 *
 * Admin/ofis oluşturmaz — kullanıcı ve ofisi zaten mevcut olmalı.
 * Tekrar çalıştırılırsa ofisteki kayıt sayısına bakarak atlar (idempotent).
 *
 * Kullanım:
 *   DEMO_EMAIL=demo@estatedesk.local npx ts-node prisma/seed-demo.ts
 *   (DEMO_EMAIL verilmezse demo@estatedesk.local kullanılır)
 */
import { prisma, seedPortfolios, seedAntalyaPortfolios, seedDemands } from './seed';

async function main() {
  const email = process.env.DEMO_EMAIL || 'demo@estatedesk.local';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`[seed-demo] Kullanıcı bulunamadı: ${email}`);
  }
  if (!user.officeId) {
    throw new Error(`[seed-demo] Kullanıcının ofisi yok: ${email} — önce onboarding ile ofis oluşturulmalı.`);
  }

  console.log(`[seed-demo] Hedef: ${email} → ofis ${user.officeId}`);

  await seedPortfolios(user.id, user.officeId);
  await seedAntalyaPortfolios(user.id, user.officeId);
  await seedDemands(user.id, user.officeId);

  const portfolios = await prisma.portfolio.count({ where: { officeId: user.officeId } });
  const demands = await prisma.demand.count({ where: { officeId: user.officeId } });
  console.log(`[seed-demo] Tamamlandı — ofiste ${portfolios} portföy, ${demands} talep var.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
