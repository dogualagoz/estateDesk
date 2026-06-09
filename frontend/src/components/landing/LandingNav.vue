<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

defineProps<{ demoLoading?: boolean }>();
const emit = defineEmits<{ (e: 'demo'): void }>();

const scrolled = ref(false);
const mobileOpen = ref(false);

const sections = [
  { id: 'features', label: 'Özellikler' },
  { id: 'how', label: 'Nasıl Çalışır' },
  { id: 'pricing', label: 'Fiyatlandırma' },
  { id: 'faq', label: 'SSS' },
];

function onScroll() {
  scrolled.value = window.scrollY > 12;
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));

function go(id: string) {
  mobileOpen.value = false;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
    :class="scrolled
      ? 'bg-surface/85 backdrop-blur-md border-b border-outline-variant'
      : 'bg-transparent border-b border-transparent'"
  >
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop h-16 flex items-center justify-between gap-4">
      <!-- Marka -->
      <button class="flex items-center gap-2 group" @click="go('hero')">
        <span class="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
          <span class="material-symbols-outlined text-[20px]">holiday_village</span>
        </span>
        <span class="font-bold text-headline-md text-on-surface tracking-tight">emlakdefter</span>
      </button>

      <!-- Masaüstü linkler -->
      <nav class="hidden md:flex items-center gap-1">
        <button
          v-for="s in sections"
          :key="s.id"
          class="px-3 py-2 rounded-lg text-label-md font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          @click="go(s.id)"
        >
          {{ s.label }}
        </button>
      </nav>

      <!-- Aksiyonlar -->
      <div class="hidden md:flex items-center gap-2">
        <button class="btn ghost" :disabled="demoLoading" @click="emit('demo')">
          <span class="material-symbols-outlined text-[18px]">visibility</span>
          {{ demoLoading ? 'Açılıyor…' : 'Demo’yu İncele' }}
        </button>
        <router-link to="/login" class="btn">Giriş Yap</router-link>
        <router-link to="/register" class="btn primary">Ücretsiz Başla</router-link>
      </div>

      <!-- Mobil menü düğmesi -->
      <button
        class="md:hidden p-2 -mr-1 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
        aria-label="Menü"
        @click="mobileOpen = !mobileOpen"
      >
        <span class="material-symbols-outlined">{{ mobileOpen ? 'close' : 'menu' }}</span>
      </button>
    </div>

    <!-- Mobil açılır menü -->
    <Transition name="sheet">
      <div
        v-if="mobileOpen"
        class="md:hidden border-t border-outline-variant bg-surface/95 backdrop-blur-md px-margin-mobile py-4 flex flex-col gap-1"
      >
        <button
          v-for="s in sections"
          :key="s.id"
          class="text-left px-3 py-2.5 rounded-lg text-label-md font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
          @click="go(s.id)"
        >
          {{ s.label }}
        </button>
        <div class="h-px bg-outline-variant my-2" />
        <button class="btn w-full justify-center" @click="mobileOpen = false; emit('demo')">
          <span class="material-symbols-outlined text-[18px]">visibility</span>
          Demo’yu İncele
        </button>
        <router-link to="/login" class="btn w-full justify-center">Giriş Yap</router-link>
        <router-link to="/register" class="btn primary w-full justify-center">Ücretsiz Başla</router-link>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  transform-origin: top;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
