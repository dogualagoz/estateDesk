<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  portfolioIntakeService,
  type IntakeSubmission,
} from '@/services/portfolioIntake.service';
import type { CreatePortfolioPayload, ListingType, PropertyType } from '@/types/portfolio';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { resolveImgUrl } from '@/utils/image';
import {
  createPortfolioFormContext,
  providePortfolioForm,
  usePortfolioProgress,
} from './portfolio-form-context';
import PortfolioFormSections from './components/PortfolioFormSections.vue';

/**
 * Başvuru inceleme: form, başvurudan önceden doldurulur; danışman düzenleyip
 * "Onayla" dediğinde backend mevcut portfolio.create yolundan gerçek portföy
 * oluşturur ve görselleri taşır.
 */
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const submissionId = route.params.id as string;
const submission = ref<IntakeSubmission | null>(null);
const loading = ref(true);
const acting = ref(false);
const actionError = ref<string | null>(null);

const ctx = createPortfolioFormContext();
providePortfolioForm(ctx);
const { form, typeChosen, listingChosen } = ctx;
const { s1Done } = usePortfolioProgress(ctx);

const isPending = computed(() => submission.value?.status === 'PENDING');

const canApprove = computed(
  () =>
    isPending.value &&
    s1Done.value &&
    form.city.trim() !== '' &&
    form.district.trim() !== '' &&
    Number(form.price) > 0 &&
    form.ownerName.trim() !== '' &&
    form.ownerPhone.trim() !== '',
);

onMounted(async () => {
  try {
    const s = await portfolioIntakeService.submission(submissionId);
    submission.value = s;
    fillForm(s);
  } catch {
    toast.error('Başvuru yüklenemedi');
    router.push('/portfolio/basvurular');
  } finally {
    loading.value = false;
  }
});

function fillForm(s: IntakeSubmission) {
  Object.assign(form, {
    type: s.type as PropertyType,
    listingType: (s.listingType ?? 'SALE') as ListingType,
    title: s.title ?? '',
    city: s.city,
    district: s.district,
    neighborhood: s.neighborhood ?? '',
    areaSqm: s.areaSqm,
    roomCount: s.roomCount,
    price: typeof s.price === 'string' ? parseFloat(s.price) : s.price,
    features: [...s.features],
    // Mülk sahibinin açıklaması iç nota taşınır; danışman düzenleyebilir
    note: s.description ?? '',
    ownerName: s.submitterName,
    ownerPhone: s.submitterPhone,
  });
  typeChosen.value = true;
  listingChosen.value = true;
}

async function approve() {
  if (!canApprove.value || acting.value) return;
  acting.value = true;
  actionError.value = null;
  const payload: CreatePortfolioPayload = {
    type: form.type,
    listingType: form.listingType,
    title: form.title.trim() || undefined,
    city: form.city,
    district: form.district,
    neighborhood: form.neighborhood || undefined,
    areaSqm: Number(form.areaSqm) || 0,
    roomCount: form.roomCount,
    price: Number(form.price),
    features: [...form.features],
    visibility: form.visibility,
    note: form.note || undefined,
    ownerName: form.ownerName,
    ownerNameVisible: form.ownerNameVisible,
    ownerPhone: form.ownerPhone,
    isShareable: form.isShareable,
  };
  try {
    const res = await portfolioIntakeService.approve(submissionId, payload);
    toast.success('Portföy oluşturuldu');
    router.push(`/portfolio/${res.portfolioId}`);
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
      ?.message;
    actionError.value = Array.isArray(msg) ? msg[0] : msg || 'Onaylama başarısız';
  } finally {
    acting.value = false;
  }
}

async function reject() {
  if (!isPending.value || acting.value) return;
  const ok = await confirm({
    title: 'Başvuruyu reddet',
    message: `${submission.value?.submitterName} adlı mülk sahibinin başvurusu reddedilecek. Bu işlem geri alınamaz.`,
    confirmText: 'Reddet',
    danger: true,
    icon: 'block',
  });
  if (!ok) return;
  acting.value = true;
  try {
    await portfolioIntakeService.reject(submissionId);
    toast.success('Başvuru reddedildi');
    router.push('/portfolio/basvurular');
  } catch {
    toast.error('İşlem başarısız');
  } finally {
    acting.value = false;
  }
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}
</script>

<template>
  <div class="p-4 md:p-8 max-w-5xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <button
        class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        @click="router.push('/portfolio/basvurular')"
      >
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div>
        <h1 class="text-headline-lg font-bold text-on-surface">Başvuru İncele</h1>
        <p v-if="submission" class="text-label-md text-on-surface-variant">
          {{ submission.submitterName }} · {{ submission.submitterPhone }} ·
          {{ fmtDate(submission.createdAt) }}
          <template v-if="submission.link.label"> · {{ submission.link.label }}</template>
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="material-symbols-outlined animate-spin text-on-surface-variant text-[32px]">progress_activity</span>
    </div>

    <template v-else-if="submission">
      <!-- Sonuçlanmış başvuru bilgisi -->
      <div
        v-if="!isPending"
        class="mb-4 px-4 py-3 rounded-lg text-label-md"
        :class="submission.status === 'APPROVED'
          ? 'bg-primary-fixed/60 text-on-surface'
          : 'bg-error-container text-on-error-container'"
      >
        <template v-if="submission.status === 'APPROVED'">
          Bu başvuru {{ submission.reviewedBy?.fullName }} tarafından onaylandı.
          <router-link
            v-if="submission.portfolioId"
            :to="`/portfolio/${submission.portfolioId}`"
            class="underline font-semibold"
          >Portföyü görüntüle</router-link>
        </template>
        <template v-else>
          Bu başvuru {{ submission.reviewedBy?.fullName }} tarafından reddedildi.
          <template v-if="submission.rejectReason"> Sebep: {{ submission.rejectReason }}</template>
        </template>
      </div>

      <!-- Fotoğraflar -->
      <div
        v-if="submission.images.length"
        class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mb-4"
      >
        <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
          Mülk Sahibinin Yüklediği Fotoğraflar ({{ submission.images.length }})
        </p>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <a
            v-for="url in submission.images"
            :key="url"
            :href="resolveImgUrl(url)"
            target="_blank"
            rel="noopener"
            class="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <img :src="resolveImgUrl(url)" class="w-full h-full object-cover" alt="" />
          </a>
        </div>
        <p class="text-label-sm text-on-surface-variant mt-3">
          Onayladığınızda fotoğraflar portföye otomatik taşınır.
        </p>
      </div>

      <!-- Mülk sahibinin açıklaması -->
      <div
        v-if="submission.description"
        class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mb-4"
      >
        <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Mülk Sahibinin Notu</p>
        <p class="text-body-md text-on-surface whitespace-pre-wrap">{{ submission.description }}</p>
      </div>

      <!-- Düzenlenebilir form (tam mod — danışman görünürlük/paylaşım ayarlar) -->
      <div class="-mx-4">
        <PortfolioFormSections :error="actionError" />
      </div>

      <!-- Aksiyonlar -->
      <div v-if="isPending" class="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          class="btn border-error text-error bg-transparent hover:bg-error-container"
          :disabled="acting"
          @click="reject"
        >
          <span class="material-symbols-outlined text-[18px]">block</span>
          Reddet
        </button>
        <button
          type="button"
          class="btn primary"
          :disabled="!canApprove || acting"
          @click="approve"
        >
          <span class="material-symbols-outlined text-[18px]">{{ acting ? 'hourglass_empty' : 'task_alt' }}</span>
          {{ acting ? 'İşleniyor…' : 'Onayla ve Portföy Oluştur' }}
        </button>
      </div>
    </template>
  </div>
</template>
