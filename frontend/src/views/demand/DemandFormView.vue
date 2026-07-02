<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import type { CreateDemandPayload, Demand } from '@/types/demand';
import type { MatchCriteria } from '@/types/matching';
import type { Portfolio } from '@/types/portfolio';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal.vue';
import ShareNotebookModal from '@/components/demand/ShareNotebookModal.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useAsync } from '@/composables/useAsync';
import { createDemandForm, provideDemandForm } from './demand-form-context';
import { useDemandMatching } from './composables/useDemandMatching';
import DemandCriteriaForm from './components/DemandCriteriaForm.vue';
import DemandMatchPanel from './components/DemandMatchPanel.vue';

/**
 * İki panelli talep formu: solda kriterler (DemandCriteriaForm),
 * sağda canlı skorlu eşleşmeler (DemandMatchPanel). Hem create hem edit modu.
 * Form state'i provide/inject ile, eşleştirme durumu useDemandMatching ile paylaşılır.
 */
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirm();
const isEdit = computed(() => !!route.params.id);

const form = createDemandForm();
provideDemandForm(form);

// Kaydet ve sil işlemleri ayrı loading/error durumları taşır
const saveOp = useAsync();
const removeOp = useAsync();
const loadOp = useAsync();

// Mobil: tek seferde tek panel göster (sekmeli geçiş)
const mobilePanel = ref<'form' | 'matches'>('form');

// ── Kriterler → canlı eşleştirme ──
const criteria = computed<MatchCriteria>(() => ({
  types: form.types.length ? form.types : undefined,
  listingType: form.listingType,
  city: form.city.trim() || undefined,
  districts: form.districts.length ? form.districts : undefined,
  neighborhoods: form.neighborhoods.length ? form.neighborhoods : undefined,
  minBudget: form.minBudget,
  maxBudget: form.maxBudget,
  roomPreferences: form.rooms.length ? form.rooms : undefined,
  minArea: form.minArea,
  maxArea: form.maxArea,
  mustHaveFeatures: form.mustHaveFeatures.length ? form.mustHaveFeatures : undefined,
  bonusFeatures: form.bonusFeatures.length ? form.bonusFeatures : undefined,
}));

const matching = useDemandMatching(criteria, () =>
  isEdit.value ? (route.params.id as string) : undefined,
);

// ── Portföy önizleme modalı ──
const previewPortfolio = ref<Portfolio | null>(null);
const previewOrigin = ref<{ x: number; y: number } | null>(null);
const shareModalOpen = ref(false);
const shareBtn = ref<HTMLElement | null>(null);

function openPreview(p: Portfolio, ev?: MouseEvent) {
  const el = ev?.currentTarget as HTMLElement | undefined;
  if (el) {
    const r = el.getBoundingClientRect();
    previewOrigin.value = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  } else {
    previewOrigin.value = null;
  }
  previewPortfolio.value = p;
}

// ── Yükleme (edit) ──
onMounted(async () => {
  if (isEdit.value) {
    const d = await loadOp.run(() => demandService.get(route.params.id as string), {
      errorMessage: 'Talep yüklenemedi',
    });
    if (!d) {
      router.push('/demand');
      return;
    }
    fillForm(d);
  }
  matching.fetchMatches();
  if (isEdit.value) matching.loadPinnedMatches();
});

function fillForm(d: Demand) {
  Object.assign(form, {
    types: d.types,
    listingType: d.listingType ?? 'SALE',
    city: d.city ?? '',
    districts: d.districts?.length ? [...d.districts] : d.district ? [d.district] : [],
    neighborhoods: d.neighborhoods?.length
      ? [...d.neighborhoods]
      : d.neighborhood
        ? [d.neighborhood]
        : [],
    minBudget: d.minBudget != null ? Number(d.minBudget) : undefined,
    maxBudget: d.maxBudget != null ? Number(d.maxBudget) : undefined,
    rooms: [...(d.roomPreferences ?? [])],
    minArea: d.minArea ?? undefined,
    maxArea: d.maxArea ?? undefined,
    mustHaveFeatures: [...(d.mustHaveFeatures ?? [])],
    bonusFeatures: [...(d.bonusFeatures ?? d.featurePrefs ?? [])],
    note: d.note ?? '',
    customerName: d.customerName,
    customerPhone: d.customerPhone,
    status: d.status,
  });
}

const canSubmit = computed(
  () =>
    form.types.length > 0 && form.customerName.trim() !== '' && form.customerPhone.trim() !== '',
);

async function submit() {
  const payload: CreateDemandPayload = {
    types: form.types,
    listingType: form.listingType,
    city: form.city.trim() || undefined,
    districts: form.districts.length ? form.districts : undefined,
    neighborhoods: form.neighborhoods.length ? form.neighborhoods : undefined,
    district: form.districts[0] || undefined,
    neighborhood: form.neighborhoods[0] || undefined,
    regions: [...form.districts, ...form.neighborhoods].filter(Boolean),
    minBudget: form.minBudget,
    maxBudget: form.maxBudget,
    roomPreferences: form.rooms,
    minArea: form.minArea,
    maxArea: form.maxArea,
    mustHaveFeatures: form.mustHaveFeatures,
    bonusFeatures: form.bonusFeatures,
    note: form.note || undefined,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    status: form.status,
  };
  if (isEdit.value) {
    const ok = await saveOp.run(() => demandService.update(route.params.id as string, payload), {
      errorMessage: 'Kaydetme başarısız',
      toastError: false,
    });
    if (ok !== undefined) router.push(`/demand/${route.params.id}`);
  } else {
    const created = await saveOp.run(() => demandService.create(payload), {
      errorMessage: 'Kaydetme başarısız',
      toastError: false,
    });
    if (created) router.push(`/demand/${created.id}`);
  }
}

async function remove() {
  if (!isEdit.value) return;
  const ok = await confirm({
    title: 'Talebi sil',
    message: 'Bu talebi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    danger: true,
    icon: 'delete',
  });
  if (!ok) return;
  const removed = await removeOp.run(() => demandService.remove(route.params.id as string), {
    errorMessage: 'Silme başarısız',
    successMessage: 'Talep silindi',
  });
  if (removed !== undefined) router.push('/demand');
}
</script>

<template>
  <div class="flex flex-col md:h-[100dvh] md:overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 flex items-center gap-3 px-4 md:px-8 py-5 border-b border-outline-variant bg-surface">
      <button
        class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div>
        <h1 class="text-headline-md font-semibold text-on-surface tracking-tight">
          {{ isEdit ? 'Talep Düzenle' : 'Yeni Talep' }}
        </h1>
        <p class="text-label-md text-on-surface-variant mt-0.5">
          Kriterleri girin — uyan portföyler sağda anlık skorlanır.
        </p>
      </div>
      <div class="flex-1"></div>
      <div v-if="isEdit" class="relative shrink-0">
        <button
          ref="shareBtn"
          type="button"
          class="btn primary"
          title="Eşleşen ilanları paylaşılabilir bir defter olarak gönderin"
          @click="shareModalOpen = !shareModalOpen"
        >
          <span class="material-symbols-outlined text-[18px]">menu_book</span>
          <span class="hidden sm:inline">Defter Oluştur</span>
        </button>

        <!-- Defter oluştur & paylaş popover'ı -->
        <ShareNotebookModal
          :open="shareModalOpen"
          :demand-id="(route.params.id as string)"
          :pinned-count="matching.pinnedIds.value.size"
          :all-count="matching.results.value.length"
          :anchor="shareBtn"
          @close="shareModalOpen = false"
        />
      </div>
    </div>

    <!-- Mobil panel sekmeleri -->
    <div class="md:hidden shrink-0 flex border-b border-outline-variant bg-surface">
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2 py-3 text-label-md font-semibold border-b-2 transition-all active:bg-surface-container"
        :class="mobilePanel === 'form' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'"
        @click="mobilePanel = 'form'"
      >
        <span class="material-symbols-outlined text-[18px]">tune</span>
        Kriterler
      </button>
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2 py-3 text-label-md font-semibold border-b-2 transition-all active:bg-surface-container"
        :class="mobilePanel === 'matches' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'"
        @click="mobilePanel = 'matches'"
      >
        <span class="material-symbols-outlined text-[18px]">join_inner</span>
        Eşleşmeler
        <span
          v-if="matching.results.value.length > 0"
          class="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
          :class="mobilePanel === 'matches' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'"
        >{{ matching.results.value.length }}</span>
      </button>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- ── SOL: Kriterler ── -->
      <div
        class="w-full md:w-[42%] border-r border-outline-variant flex flex-col overflow-hidden bg-surface-container/30 relative"
        :class="{ 'hidden md:flex': mobilePanel !== 'form' }"
        @dragover.prevent="matching.isDragOver.value = matching.isDragging.value"
        @dragleave="matching.isDragOver.value = false"
        @drop.prevent="matching.onDrop"
      >
        <!-- Drag-over overlay -->
        <Transition name="fade">
          <div
            v-if="matching.isDragging.value && isEdit"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none transition-colors duration-150"
            :class="matching.isDragOver.value ? 'bg-primary/10 border-2 border-dashed border-primary' : 'bg-surface/60'"
          >
            <span class="material-symbols-outlined text-[56px] transition-all duration-150" :class="matching.isDragOver.value ? 'text-primary scale-110' : 'text-on-surface-variant/30'">bookmark_add</span>
            <p class="text-label-md font-semibold mt-2 transition-colors duration-150" :class="matching.isDragOver.value ? 'text-primary' : 'text-on-surface-variant/40'">
              {{ matching.isDragOver.value ? 'Bırakın — eşleştirilsin' : 'Portföyü buraya sürükleyin' }}
            </p>
          </div>
        </Transition>

        <!-- Drop success flash -->
        <Transition name="drop-success">
          <div
            v-if="matching.dropSuccess.value"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-primary/15 backdrop-blur-[2px]"
          >
            <div class="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-primary text-on-primary shadow-xl animate-success-pop">
              <span class="material-symbols-outlined text-[44px]">bookmark_added</span>
              <p class="text-label-lg font-bold tracking-tight">Portföy eşleştirildi!</p>
            </div>
          </div>
        </Transition>

        <!-- Kriter formu (form state provide/inject ile paylaşılır) -->
        <DemandCriteriaForm :error="saveOp.error.value || removeOp.error.value" :is-edit="isEdit" />

        <!-- Alt bar -->
        <div class="shrink-0 flex items-center gap-3 px-4 md:px-7 py-4 border-t border-outline-variant bg-surface">
          <button v-if="isEdit" type="button" class="btn danger" :disabled="removeOp.loading.value" @click="remove">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            {{ removeOp.loading.value ? 'Siliniyor…' : 'Sil' }}
          </button>
          <div class="flex-1"></div>
          <button type="button" class="btn" @click="router.back()">İptal</button>
          <button type="button" class="btn primary" :disabled="saveOp.loading.value || !canSubmit" @click="submit">
            <span class="material-symbols-outlined text-[18px]">{{ saveOp.loading.value ? 'hourglass_empty' : 'save' }}</span>
            {{ saveOp.loading.value ? 'Kaydediliyor…' : isEdit ? 'Değişiklikleri Kaydet' : 'Talebi Kaydet' }}
          </button>
        </div>
      </div>

      <!-- ── SAĞ: Canlı skorlu portföyler ── -->
      <div
        class="flex-1 flex flex-col overflow-hidden"
        :class="{ 'hidden md:flex': mobilePanel !== 'matches' }"
      >
        <DemandMatchPanel :matching="matching" :is-edit="isEdit" @preview="openPreview" />
      </div>
    </div>

    <!-- Portföy önizleme modalı -->
    <PortfolioDetailModal
      :portfolio="previewPortfolio"
      :origin="previewOrigin"
      :can-pin="isEdit"
      :pinned="!!previewPortfolio && matching.pinnedIds.value.has(previewPortfolio.id)"
      @toggle-pin="matching.togglePin"
      @close="previewPortfolio = null"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.drop-success-enter-active { transition: opacity 0.12s ease-out; }
.drop-success-leave-active { transition: opacity 0.4s ease-in; }
.drop-success-enter-from, .drop-success-leave-to { opacity: 0; }

/* Drop success içindeki kart pop */
@keyframes success-pop {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-success-pop { animation: success-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
</style>
