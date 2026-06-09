<script setup lang="ts">
interface Feature {
  icon: string;
  title: string;
  body: string;
}

const features: Feature[] = [
  {
    icon: 'auto_awesome',
    title: 'Ağırlıklı eşleştirme motoru',
    body: 'Bütçe, konum, oda, alan ve özellikler ayrı ayrı puanlanır. Sert filtreler eleme yapar, ağırlıklı skor en güçlü eşleşmeyi öne çıkarır.',
  },
  {
    icon: 'sync_alt',
    title: 'Çift yönlü çalışır',
    body: 'Bir portföye uygun talepleri, bir talebe uygun portföyleri anında görün. Fırsat hangi yönden gelirse gelsin yakalanır.',
  },
  {
    icon: 'distance',
    title: 'Konum bilinçli puanlama',
    body: '375 ilçenin koordinatıyla mesafeye göre yakınlık puanı. Aynı il değil, gerçek yakınlık önemlidir.',
  },
  {
    icon: 'groups',
    title: 'Ofis & rol yönetimi',
    body: 'Tek paylaşılabilir davet linkiyle ekip kurun. Her ofisin portföyü ve talebi tamamen izole, yetkiler nettir.',
  },
  {
    icon: 'search',
    title: 'Çok lokasyonlu arama',
    body: '81 il, tüm ilçeler ve büyük şehir mahalleleriyle aranabilir, gruplu seçim. Müşterinin baktığı her yeri tek talepte tanımlayın.',
  },
  {
    icon: 'photo_library',
    title: 'Görselli portföy',
    body: 'Sürükle-bırak ile yüklediğiniz fotoğraflar otomatik sıkıştırılır. Hızlı, düzenli, sahaya hazır ilan kartları.',
  },
];
</script>

<template>
  <section id="features" class="py-20 md:py-28">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="max-w-2xl mb-12 md:mb-16" v-reveal>
        <span class="text-label-sm text-primary uppercase tracking-wider font-semibold">Özellikler</span>
        <h2 class="text-[28px] leading-9 md:text-headline-xl font-bold text-on-surface mt-2 tracking-tight">
          Sahadaki işi olduğu gibi yansıtan araçlar
        </h2>
        <p class="text-body-lg text-on-surface-variant mt-4">
          Emlak ofisinin gerçek akışına göre tasarlandı. Gereksiz ekran yok;
          her özellik bir fırsatı kaçırmamak için var.
        </p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        <div
          v-for="(f, i) in features"
          :key="f.title"
          v-reveal="{ delay: (i % 3) * 90 }"
          class="feature-card group rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-primary/40"
        >
          <div class="w-11 h-11 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110">
            <span class="material-symbols-outlined text-[24px]">{{ f.icon }}</span>
          </div>
          <h3 class="text-body-lg font-semibold text-on-surface">{{ f.title }}</h3>
          <p class="text-label-md text-on-surface-variant leading-6 mt-2">{{ f.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
