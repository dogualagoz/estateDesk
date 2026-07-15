<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import type { CreatePortfolioPayload } from '@/types/portfolio';
import { useAsync } from '@/composables/useAsync';
import {
  createPortfolioFormContext,
  providePortfolioForm,
  usePortfolioProgress,
} from './portfolio-form-context';
import { usePortfolioImages } from './composables/usePortfolioImages';
import { buildPortfolioPayload } from './portfolio-payload.util';
import PortfolioPreviewPanel from './components/PortfolioPreviewPanel.vue';
import PortfolioFormSections from './components/PortfolioFormSections.vue';

/**
 * Yeni portföy ekleme formu: solda canlı önizleme + görsel yükleme
 * (PortfolioPreviewPanel), sağda adım göstergeli form bölümleri
 * (PortfolioFormSections). Mevcut kaydı düzenlemek için PortfolioDetailView'in
 * satır içi düzenleme modu kullanılır — bu ekran yalnızca oluşturma içindir.
 */
const router = useRouter();

const ctx = createPortfolioFormContext();
providePortfolioForm(ctx);
const { form } = ctx;
const { s1Done, stepsDone, currentStep } = usePortfolioProgress(ctx);

const images = usePortfolioImages(() => undefined);

const saveOp = useAsync();

const STEPS = [
  { label: 'Temel Bilgiler' },
  { label: 'Konum' },
  { label: 'Detaylar' },
  { label: 'İletişim' },
];

const canSubmit = computed(
  () =>
    s1Done.value &&
    form.city.trim() !== '' &&
    form.district.trim() !== '' &&
    Number(form.price) > 0 &&
    form.ownerName.trim() !== '' &&
    form.ownerPhone.trim() !== '',
);

async function submit() {
  const payload = buildPortfolioPayload(form, false);

  const saved = await saveOp.run(
    async () => {
      const created = await portfolioService.create(payload as CreatePortfolioPayload);
      if (images.pendingFiles.value.length) {
        await portfolioService.uploadImages(created.id, images.pendingFiles.value);
      }
      return created.id;
    },
    { errorMessage: 'Kaydetme başarısız', toastError: false },
  );

  if (saved) router.push(`/portfolio/${saved}`);
}
</script>

<template>
  <div class="flex flex-col md:h-screen md:overflow-hidden">
    <!-- ── Header ── -->
    <div class="shrink-0 flex items-center gap-3 px-4 md:px-8 py-5 border-b border-outline-variant bg-surface">
      <button
        class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div>
        <h1 class="text-headline-md font-semibold text-on-surface tracking-tight">Yeni Portföy Ekle</h1>
        <p class="text-label-md text-on-surface-variant mt-0.5">
          İlan detaylarını eksiksiz girerek potansiyel alıcılara ulaşın.
        </p>
      </div>
    </div>

    <!-- ── Body: mobilde dikey istif, masaüstünde iki sütun ── -->
    <div class="flex-1 flex flex-col md:flex-row md:overflow-hidden">
      <!-- Sol: Canlı önizleme + görsel yükleme -->
      <PortfolioPreviewPanel :images="images" :is-edit="false" />

      <!-- Sağ: Form -->
      <div class="w-full md:w-1/2 flex flex-col md:overflow-hidden">
        <!-- Step göstergesi -->
        <div class="shrink-0 px-4 md:px-8 pt-5 pb-4 overflow-x-auto">
          <div class="flex items-start min-w-[300px]">
            <template v-for="(s, i) in STEPS" :key="i">
              <div
                v-if="i > 0" class="flex-1 h-0.5 mt-[15px] mx-1 rounded-full transition-colors duration-500"
                :class="stepsDone[i - 1] ? 'bg-primary' : 'bg-outline-variant'" />
              <div class="flex flex-col items-center gap-1.5">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300"
                  :class="stepsDone[i]
                    ? 'bg-primary text-on-primary'
                    : currentStep === i + 1
                      ? 'bg-primary text-on-primary ring-4 ring-primary/20 shadow'
                      : 'bg-surface-container border-2 border-outline-variant text-on-surface-variant'"
                >
                  <span v-if="stepsDone[i]" class="material-symbols-outlined text-[14px]">check</span>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span
                  class="text-label-xs whitespace-nowrap transition-colors"
                  :class="stepsDone[i] || currentStep === i + 1 ? 'text-primary font-semibold' : 'text-on-surface-variant'"
                >{{ s.label }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Kaydırılabilir form bölümleri -->
        <PortfolioFormSections :error="saveOp.error.value" />

        <!-- ── Alt bar ── -->
        <div class="shrink-0 flex items-center justify-end gap-3 px-4 md:px-8 py-4 border-t border-outline-variant bg-surface">
          <button type="button" class="btn" @click="router.back()">İptal</button>
          <button type="button" class="btn primary" :disabled="saveOp.loading.value || !canSubmit" @click="submit">
            <span class="material-symbols-outlined text-[18px]">{{ saveOp.loading.value ? 'hourglass_empty' : 'save' }}</span>
            {{ saveOp.loading.value ? 'Kaydediliyor…' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
