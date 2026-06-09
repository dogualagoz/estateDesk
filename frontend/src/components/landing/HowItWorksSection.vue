<script setup lang="ts">
const steps = [
  {
    icon: 'add_home_work',
    title: 'Portföyü ekleyin',
    body: 'İlanı tipi, konumu, fiyatı ve özellikleriyle kaydedin. Fotoğrafları sürükleyip bırakın.',
  },
  {
    icon: 'ads_click',
    title: 'Talebi tanımlayın',
    body: 'Müşterinin aradığı bütçe, bölge ve kriterleri girin. Birden fazla lokasyon seçebilirsiniz.',
  },
  {
    icon: 'handshake',
    title: 'Eşleşmeyi yakalayın',
    body: 'Sistem en güçlü eşleşmeleri puanlayıp önünüze koyar. Doğru müşteriyi doğru mülkle buluşturun.',
  },
];
</script>

<template>
  <section id="how" class="py-20 md:py-28">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="max-w-2xl mb-12 md:mb-16" v-reveal>
        <span class="text-label-sm text-primary uppercase tracking-wider font-semibold">Nasıl Çalışır</span>
        <h2 class="text-[28px] leading-9 md:text-headline-xl font-bold text-on-surface mt-2 tracking-tight">
          Üç adımda fırsata dönüşür
        </h2>
      </div>

      <div class="relative grid md:grid-cols-3 gap-6 md:gap-4">
        <!-- Bağlayıcı çizgi (masaüstü) -->
        <div class="hidden md:block absolute top-7 left-[16.6%] right-[16.6%] h-px bg-outline-variant -z-10" />

        <div
          v-for="(s, i) in steps"
          :key="s.title"
          v-reveal="{ delay: i * 120 }"
          class="relative text-center md:text-left"
        >
          <div class="flex md:block items-center gap-4">
            <div class="relative shrink-0 w-14 h-14 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm mx-auto md:mx-0">
              <span class="material-symbols-outlined text-[28px]">{{ s.icon }}</span>
              <span class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-container-lowest border border-outline-variant text-label-sm font-bold text-primary flex items-center justify-center">
                {{ i + 1 }}
              </span>
            </div>
          </div>
          <h3 class="text-body-lg font-semibold text-on-surface mt-5">{{ s.title }}</h3>
          <p class="text-label-md text-on-surface-variant leading-6 mt-2 max-w-xs mx-auto md:mx-0">{{ s.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
