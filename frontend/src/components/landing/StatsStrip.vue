<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Stat {
  target: number;
  suffix?: string;
  label: string;
}

const stats: Stat[] = [
  { target: 375, label: 'İlçe için koordinat verisi' },
  { target: 30, suffix: ' km', label: 'Konum eşleştirme yarıçapı' },
  { target: 6, label: 'Mülk tipi & çift yönlü eşleşme' },
  { target: 100, suffix: '%', label: 'Ofis bazlı veri izolasyonu' },
];

const display = ref(stats.map(() => 0));
const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let started = false;

function animate() {
  if (started) return;
  started = true;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    display.value = stats.map((s) => s.target);
    return;
  }
  const duration = 1100;
  const start = performance.now();
  function tick(now: number) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    display.value = stats.map((s) => Math.round(s.target * eased));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && animate()),
    { threshold: 0.4 },
  );
  if (root.value) observer.observe(root.value);
});
onUnmounted(() => observer?.disconnect());
</script>

<template>
  <section ref="root" class="border-y border-outline-variant bg-surface-container-low/60">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
      <div v-for="(s, i) in stats" :key="s.label" class="text-center lg:text-left">
        <div class="text-[32px] md:text-headline-xl font-bold text-primary tracking-tight tabular-nums">
          {{ display[i] }}{{ s.suffix || '' }}
        </div>
        <div class="text-label-md text-on-surface-variant mt-1">{{ s.label }}</div>
      </div>
    </div>
  </section>
</template>
