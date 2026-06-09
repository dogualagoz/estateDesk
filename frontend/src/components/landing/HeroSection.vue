<script setup lang="ts">
import AppPreviewMock from './AppPreviewMock.vue';

defineProps<{ demoLoading?: boolean }>();
const emit = defineEmits<{ (e: 'demo'): void }>();
</script>

<template>
  <section id="hero" class="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24">
    <!-- Arka plan dekoru -->
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute -top-40 -right-32 w-[480px] h-[480px] rounded-full bg-primary-fixed/50 blur-3xl" />
      <div class="absolute top-40 -left-40 w-[420px] h-[420px] rounded-full bg-secondary-fixed/40 blur-3xl" />
    </div>

    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
      <!-- Sol: metin -->
      <div class="hero-copy">
        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-label-sm text-on-surface-variant mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-primary" />
          Türk emlak ofisleri için portföy & talep yönetimi
        </span>

        <h1 class="text-[34px] leading-[40px] md:text-[52px] md:leading-[58px] font-bold tracking-tight text-on-surface">
          Hiçbir fırsatı
          <span class="text-primary">kaçırmayın.</span><br />
          Portföyü ve talebi otomatik eşleştirin.
        </h1>

        <p class="mt-5 text-body-lg text-on-surface-variant max-w-xl">
          Elinizdeki ilanları müşteri talepleriyle ağırlıklı puanlamayla eşleştirir,
          unutulan portföyleri ortaya çıkarır. Defterler ve dağınık notlar yerine
          tek ekranda netlik.
        </p>

        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <router-link to="/register" class="btn primary h-12 px-6 text-[15px]">
            Ücretsiz Başla
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </router-link>
          <button class="btn h-12 px-6 text-[15px]" :disabled="demoLoading" @click="emit('demo')">
            <span class="material-symbols-outlined text-[18px]">visibility</span>
            {{ demoLoading ? 'Demo açılıyor…' : 'Demo’yu İncele' }}
          </button>
        </div>

        <div class="mt-6 flex items-center gap-5 text-label-sm text-on-surface-variant">
          <span class="inline-flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
            Kurulum gerektirmez
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
            Kredi kartı yok
          </span>
        </div>
      </div>

      <!-- Sağ: önizleme -->
      <div class="hero-mock lg:pl-4">
        <AppPreviewMock />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-copy {
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.hero-mock {
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-copy, .hero-mock { animation: none; }
}
</style>
