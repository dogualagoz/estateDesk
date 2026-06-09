<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTour } from '@/composables/useTour';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { start, stop } = useTour();

function startTour() {
  start();
}

function exitDemo() {
  stop();
  auth.logout();
  router.push('/');
}

onMounted(() => {
  // Demo butonundan "?tour=1" ile gelindiyse turu otomatik başlat
  if (route.query.tour === '1') {
    // URL'i temizle ki yenilemede tekrar tetiklenmesin
    const q = { ...route.query };
    delete q.tour;
    router.replace({ path: route.path, query: q });
    setTimeout(start, 400);
  }
});
</script>

<template>
  <div class="demo-banner flex items-center gap-3 px-margin-mobile md:px-6 py-2 bg-primary-fixed text-on-primary-fixed border-b border-primary/20">
    <span class="material-symbols-outlined text-[20px] text-primary shrink-0">visibility</span>
    <p class="text-label-md flex-1 min-w-0">
      <span class="font-semibold">Demo modu.</span>
      <span class="hidden sm:inline"> Örnek bir ofisi inceliyorsunuz; değişiklikler kaydedilmez.</span>
    </p>
    <button
      class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-label-sm font-semibold hover:bg-white transition-colors"
      @click="startTour"
    >
      <span class="material-symbols-outlined text-[16px]">play_circle</span>
      <span class="hidden sm:inline">Turu Başlat</span>
      <span class="sm:hidden">Tur</span>
    </button>
    <router-link
      to="/register"
      class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:bg-surface-tint transition-colors"
    >
      Kaydol
    </router-link>
    <button
      class="shrink-0 p-1.5 rounded-lg text-on-primary-fixed/70 hover:bg-black/5 hover:text-on-primary-fixed transition-colors"
      title="Demodan çık"
      @click="exitDemo"
    >
      <span class="material-symbols-outlined text-[18px]">logout</span>
    </button>
  </div>
</template>
