<script setup lang="ts">
interface Plan {
  name: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Başlangıç',
    tagline: 'Tek danışman, ilk portföyler',
    features: ['Sınırsız portföy & talep', 'Ağırlıklı eşleştirme', '1 kullanıcı', 'Görsel yükleme'],
  },
  {
    name: 'Profesyonel',
    tagline: 'Büyüyen ofisler için',
    features: ['Başlangıç’taki her şey', 'Ekip & rol yönetimi', 'Paylaşılabilir davet linki', 'Ofis bazlı izolasyon', 'Öncelikli destek'],
    highlighted: true,
  },
  {
    name: 'Kurumsal',
    tagline: 'Çok şubeli yapılar',
    features: ['Profesyonel’deki her şey', 'Gelişmiş raporlama', 'Özel entegrasyonlar', 'Kurumsal SLA'],
  },
];
</script>

<template>
  <section id="pricing" class="py-20 md:py-28 bg-surface-container-low/50 border-y border-outline-variant">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="text-center max-w-2xl mx-auto mb-12 md:mb-16" v-reveal>
        <span class="text-label-sm text-primary uppercase tracking-wider font-semibold">Fiyatlandırma</span>
        <h2 class="text-[28px] leading-9 md:text-headline-xl font-bold text-on-surface mt-2 tracking-tight">
          İhtiyacınıza göre büyüyen paketler
        </h2>
        <p class="text-body-lg text-on-surface-variant mt-4">
          Paketler hazırlanıyor. Şimdilik tüm özellikleri demo üzerinden ücretsiz keşfedin.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-5 items-stretch">
        <div
          v-for="(p, i) in plans"
          :key="p.name"
          v-reveal="{ delay: i * 100 }"
          class="relative flex flex-col rounded-xl border bg-surface-container-lowest p-6 md:p-7 transition-all duration-200"
          :class="p.highlighted
            ? 'border-primary shadow-md md:-translate-y-2 ring-1 ring-primary/20'
            : 'border-outline-variant hover:shadow-sm'"
        >
          <span
            v-if="p.highlighted"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-on-primary text-label-sm font-semibold shadow-sm whitespace-nowrap"
          >
            En popüler
          </span>

          <div class="flex items-center justify-between">
            <h3 class="text-headline-md font-semibold text-on-surface">{{ p.name }}</h3>
            <span class="tag warning font-semibold">DEMO</span>
          </div>
          <p class="text-label-md text-on-surface-variant mt-1">{{ p.tagline }}</p>

          <div class="mt-6 flex items-end gap-1">
            <span class="text-headline-xl font-bold text-on-surface leading-none">—</span>
            <span class="text-label-md text-on-surface-variant mb-1">fiyatlandırma yakında</span>
          </div>

          <ul class="mt-6 space-y-3 flex-1">
            <li v-for="f in p.features" :key="f" class="flex items-start gap-2.5 text-label-md text-on-surface">
              <span class="material-symbols-outlined text-[18px] text-primary mt-0.5">check</span>
              {{ f }}
            </li>
          </ul>

          <router-link
            to="/register"
            class="btn w-full justify-center mt-7 h-11"
            :class="p.highlighted ? 'primary' : 'secondary'"
          >
            Ücretsiz Başla
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>
