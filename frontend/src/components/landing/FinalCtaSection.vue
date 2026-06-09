<script setup lang="ts">
defineProps<{ demoLoading?: boolean }>();
const emit = defineEmits<{ (e: 'demo'): void }>();
</script>

<template>
  <section class="py-20 md:py-28">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <div
        v-reveal
        class="relative overflow-hidden rounded-2xl bg-primary text-on-primary px-6 py-14 md:px-16 md:py-20 text-center"
      >
        <div class="pointer-events-none absolute inset-0 opacity-20">
          <div class="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div class="absolute -bottom-24 -right-10 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>

        <div class="relative">
          <h2 class="text-[28px] leading-9 md:text-[40px] md:leading-[46px] font-bold tracking-tight">
            Bir sonraki satışı kaçırmadan başlayın
          </h2>
          <p class="text-on-primary/85 text-body-lg mt-4 max-w-xl mx-auto">
            Portföyünüzü ve taleplerinizi tek ekranda toplayın. Kurulum yok, kredi kartı yok.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <router-link
              to="/register"
              class="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-lg bg-on-primary text-primary text-[15px] font-semibold hover:bg-white transition-colors"
            >
              Ücretsiz Başla
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </router-link>
            <button
              class="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-lg border border-on-primary/40 text-on-primary text-[15px] font-semibold hover:bg-white/10 transition-colors disabled:opacity-60"
              :disabled="demoLoading"
              @click="emit('demo')"
            >
              <span class="material-symbols-outlined text-[18px]">visibility</span>
              {{ demoLoading ? 'Demo açılıyor…' : 'Önce Demo’yu İncele' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
