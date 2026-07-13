<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  portfolioIntakeService,
  type IntakePreview,
} from '@/services/portfolioIntake.service';
import {
  createPortfolioFormContext,
  providePortfolioForm,
  usePortfolioProgress,
} from '@/views/portfolio/portfolio-form-context';
import { usePortfolioImages } from '@/views/portfolio/composables/usePortfolioImages';
import PortfolioFormSections from '@/views/portfolio/components/PortfolioFormSections.vue';

/**
 * Public mülk başvuru sayfası (/basvuru/:token). Mülk sahibi kayıt olmadan,
 * danışmanın yolladığı link üzerinden mülk bilgilerini ve fotoğraflarını
 * gönderir; başvuru danışmanın onay kuyruğuna düşer.
 */
const route = useRoute();
const token = route.params.token as string;

const preview = ref<IntakePreview | null>(null);
const loading = ref(true);
const notFound = ref(false);
const submitting = ref(false);
const submitted = ref(false);
const submitError = ref<string | null>(null);

const ctx = createPortfolioFormContext();
providePortfolioForm(ctx);
const { form } = ctx;
const { s1Done } = usePortfolioProgress(ctx);

// Public formda ayrı açıklama alanı (ofis-içi 'note' alanı kullanılmaz)
const description = ref('');
const kvkkAccepted = ref(false);

const images = usePortfolioImages(() => undefined);

const canSubmit = computed(
  () =>
    s1Done.value &&
    form.city.trim() !== '' &&
    form.district.trim() !== '' &&
    Number(form.price) > 0 &&
    form.ownerName.trim() !== '' &&
    form.ownerPhone.trim() !== '' &&
    kvkkAccepted.value,
);

onMounted(async () => {
  try {
    preview.value = await portfolioIntakeService.preview(token);
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
});

const invalidMessage = computed(() => {
  if (notFound.value) return 'Böyle bir başvuru linki bulunamadı.';
  switch (preview.value?.invalidReason) {
    case 'EXPIRED':
      return 'Bu başvuru linkinin süresi dolmuş. Lütfen danışmanınızdan yeni bir link isteyin.';
    case 'REVOKED':
      return 'Bu başvuru linki iptal edilmiş. Lütfen danışmanınızla iletişime geçin.';
    default:
      return null;
  }
});

async function submit() {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  submitError.value = null;
  try {
    await portfolioIntakeService.submit(
      token,
      {
        submitterName: form.ownerName.trim(),
        submitterPhone: form.ownerPhone.trim(),
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
        description: description.value.trim() || undefined,
      },
      images.pendingFiles.value,
    );
    submitted.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
      ?.message;
    submitError.value = Array.isArray(msg) ? msg[0] : msg || 'Başvuru gönderilemedi, lütfen tekrar deneyin.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-on-background font-sans antialiased">
    <!-- Üst bar -->
    <header class="bg-primary text-on-primary">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2.5">
        <img src="/logo.svg" alt="emlakdefter" class="h-8 w-8 rounded-lg" />
        <span class="font-bold text-headline-md tracking-tight">emlakdefter</span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 pb-16">
      <!-- Yükleniyor -->
      <div v-if="loading" class="flex justify-center py-16">
        <span class="material-symbols-outlined animate-spin text-on-surface-variant text-[32px]">progress_activity</span>
      </div>

      <!-- Geçersiz link -->
      <div
        v-else-if="invalidMessage"
        class="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center mt-8"
      >
        <span class="material-symbols-outlined text-[44px] text-on-surface-variant mb-3">link_off</span>
        <h1 class="text-headline-md font-semibold text-on-surface mb-2">Link Geçersiz</h1>
        <p class="text-body-md text-on-surface-variant">{{ invalidMessage }}</p>
      </div>

      <!-- Başarı -->
      <div
        v-else-if="submitted"
        class="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center mt-8"
      >
        <span class="material-symbols-outlined text-[52px] text-primary mb-3">task_alt</span>
        <h1 class="text-headline-md font-semibold text-on-surface mb-2">Başvurunuz Alındı</h1>
        <p class="text-body-md text-on-surface-variant">
          Mülk bilgileriniz <strong>{{ preview?.officeName }}</strong> ofisine iletildi.
          Danışmanınız en kısa sürede sizinle iletişime geçecek.
        </p>
      </div>

      <!-- Form -->
      <template v-else>
        <div class="mb-6">
          <h1 class="text-headline-lg font-bold text-on-surface">Mülk Başvurusu</h1>
          <p class="text-body-md text-on-surface-variant mt-1">
            <strong>{{ preview?.agentName }}</strong> ({{ preview?.officeName }}) mülkünüzü
            portföyüne eklemek için bu formu doldurmanızı rica ediyor. Bilgileriniz yalnızca
            danışmanınıza iletilir.
          </p>
        </div>

        <!-- Form bölümleri (public mod) -->
        <div class="-mx-4">
          <PortfolioFormSections public-mode :error="submitError" />
        </div>

        <!-- Fotoğraflar -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mt-4">
          <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Fotoğraflar</p>
          <p class="text-label-sm text-on-surface-variant mb-4">En fazla 10 fotoğraf (JPEG/PNG/WebP, her biri en çok 8MB).</p>

          <input
            :ref="(el) => (images.fileInput.value = el as HTMLInputElement | null)"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            class="hidden"
            @change="images.onFilePick"
          />

          <div
            class="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
            :class="images.isDragging.value ? 'border-primary bg-primary-fixed/30' : 'border-outline-variant hover:border-primary/60'"
            @click="images.pickFiles()"
            @dragover.prevent="images.isDragging.value = true"
            @dragleave.prevent="images.isDragging.value = false"
            @drop.prevent="images.onDrop"
          >
            <span class="material-symbols-outlined text-[32px] text-on-surface-variant">add_photo_alternate</span>
            <p class="text-label-md text-on-surface-variant mt-1">Fotoğraf eklemek için tıklayın veya sürükleyin</p>
          </div>

          <div v-if="images.previewUrls.value.length" class="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
            <div v-for="(url, i) in images.previewUrls.value" :key="url" class="relative aspect-square rounded-lg overflow-hidden group">
              <img :src="url" class="w-full h-full object-cover" alt="" />
              <button
                type="button"
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="images.removePreview(i)"
              >
                <span class="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Açıklama -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mt-4">
          <label class="text-label-sm font-semibold text-on-surface-variant block mb-2">
            Eklemek istedikleriniz <span class="font-normal text-on-surface-variant/60">(isteğe bağlı)</span>
          </label>
          <textarea
            v-model="description"
            class="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary resize-none"
            rows="3"
            maxlength="2000"
            placeholder="Mülkünüzle ilgili belirtmek istediğiniz diğer detaylar…"
          />
        </div>

        <!-- KVKK -->
        <label class="flex items-start gap-3 mt-4 px-1 cursor-pointer select-none">
          <input v-model="kvkkAccepted" type="checkbox" class="mt-1 w-4 h-4 accent-[#4e604f]" />
          <span class="text-label-md text-on-surface-variant">
            Paylaştığım kişisel verilerin (ad, telefon) ve mülk bilgilerinin, başvurumun
            değerlendirilmesi ve benimle iletişime geçilmesi amacıyla
            {{ preview?.officeName }} tarafından işlenmesini onaylıyorum. *
          </span>
        </label>

        <!-- Gönder -->
        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="px-6 h-11 rounded-lg bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50 transition-opacity flex items-center gap-2"
            :disabled="!canSubmit || submitting"
            @click="submit"
          >
            <span class="material-symbols-outlined text-[18px]">{{ submitting ? 'hourglass_empty' : 'send' }}</span>
            {{ submitting ? 'Gönderiliyor…' : 'Başvuruyu Gönder' }}
          </button>
        </div>
      </template>
    </main>
  </div>
</template>
