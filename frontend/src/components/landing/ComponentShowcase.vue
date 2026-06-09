<script setup lang="ts">
/**
 * Uygulamadaki gerçek görsel desenlerin statik mini replikaları.
 * Kullanıcı, ürünün nasıl göründüğünü somut olarak görür.
 */
const ageColors: Record<string, string> = {
  fresh: 'border-l-emerald-400',
  warm: 'border-l-amber-400',
  cold: 'border-l-red-400',
};

const pendingDemands = [
  { name: 'Yılmaz Ailesi', want: '3+1 Daire • Kadıköy • max 6.5M ₺', urgency: 'fresh', score: 94, match: 'Bağdat Cd. 3+1, 140m²' },
  { name: 'Demir İnşaat', want: 'Arsa • Çankaya • max 12M ₺', urgency: 'warm', score: 88, match: 'İmarlı arsa 600m²' },
  { name: 'Kaya Holding', want: 'Ofis (Kiralık) • Şişli', urgency: 'cold', score: 81, match: 'Plaza katı 220m²' },
];
</script>

<template>
  <section class="py-20 md:py-28 bg-surface-container-low/50 border-y border-outline-variant">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <!-- Sol: anlatım -->
      <div v-reveal>
        <span class="text-label-sm text-primary uppercase tracking-wider font-semibold">Uygulamadan</span>
        <h2 class="text-[28px] leading-9 md:text-headline-xl font-bold text-on-surface mt-2 tracking-tight">
          Eşleşmeleri olduğu gibi görün
        </h2>
        <p class="text-body-lg text-on-surface-variant mt-4">
          Her talebin yanında en güçlü portföy eşleşmesi ve yüzdelik skoru çıkar.
          Renk kodu, talebin ne kadar süredir beklediğini gösterir — soğumadan harekete geçin.
        </p>

        <ul class="mt-6 space-y-3">
          <li class="flex items-start gap-3">
            <span class="material-symbols-outlined text-[20px] text-primary mt-0.5">bolt</span>
            <span class="text-label-md text-on-surface-variant"><strong class="text-on-surface">Skor rozeti</strong> — eşleşmenin gücünü tek bakışta okuyun.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="material-symbols-outlined text-[20px] text-primary mt-0.5">schedule</span>
            <span class="text-label-md text-on-surface-variant"><strong class="text-on-surface">Yaş rengi</strong> — yeşil taze, sarı bekliyor, kırmızı acil.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="material-symbols-outlined text-[20px] text-primary mt-0.5">touch_app</span>
            <span class="text-label-md text-on-surface-variant"><strong class="text-on-surface">Tek tık</strong> — eşleşmeyi pinleyin, müşteriyi arayın.</span>
          </li>
        </ul>
      </div>

      <!-- Sağ: mini panel replikası -->
      <div v-reveal="{ delay: 120 }" class="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-md p-4 sm:p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">pending_actions</span>
            <span class="text-label-md font-semibold text-on-surface">Eşleşmesi Beklenen Talepler</span>
          </div>
          <span class="tag primary">3</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="d in pendingDemands"
            :key="d.name"
            class="showcase-card rounded-lg border border-outline-variant border-l-[3px] bg-surface-container-lowest p-3 transition-colors hover:bg-surface-container-low"
            :class="ageColors[d.urgency]"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="text-label-md font-semibold text-on-surface truncate">{{ d.name }}</div>
                <div class="text-label-sm text-on-surface-variant truncate">{{ d.want }}</div>
              </div>
              <span class="shrink-0 inline-flex items-center text-label-sm font-bold px-2.5 py-1 rounded-full bg-primary text-on-primary">
                %{{ d.score }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 mt-2 pt-2 border-t border-surface-container text-label-sm text-on-surface-variant">
              <span class="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
              <span class="truncate">{{ d.match }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.showcase-card:hover {
  transform: translateX(2px);
}
</style>
