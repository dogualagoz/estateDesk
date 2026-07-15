<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  portfolioIntakeService,
  type IntakeLink,
  type IntakeSubmission,
  type IntakeSubmissionStatus,
} from '@/services/portfolioIntake.service';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { resolveImgUrl } from '@/utils/image';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import type { PropertyType } from '@/types/portfolio';

/**
 * Portföy başvuruları: üstte danışmanın başvuru linkleri (oluştur/kopyala/iptal),
 * altta mülk sahiplerinden gelen başvurular (durum filtreli).
 */
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const links = ref<IntakeLink[]>([]);
const submissions = ref<IntakeSubmission[]>([]);
const loadingLinks = ref(false);
const loadingSubmissions = ref(false);
const creating = ref(false);
const newLabel = ref('');
const showNewLinkForm = ref(false);
const copiedId = ref<string | null>(null);
const statusFilter = ref<IntakeSubmissionStatus>('PENDING');

const STATUS_TABS: { value: IntakeSubmissionStatus; label: string }[] = [
  { value: 'PENDING', label: 'Bekleyen' },
  { value: 'APPROVED', label: 'Onaylanan' },
  { value: 'REJECTED', label: 'Reddedilen' },
];

const STATUS_BADGE: Record<IntakeSubmissionStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Bekliyor', cls: 'bg-primary-fixed/60 text-on-surface' },
  APPROVED: { label: 'Onaylandı', cls: 'bg-primary text-on-primary' },
  REJECTED: { label: 'Reddedildi', cls: 'bg-error-container text-on-error-container' },
};

async function loadLinks() {
  loadingLinks.value = true;
  try {
    links.value = await portfolioIntakeService.listLinks();
  } catch {
    toast.error('Linkler yüklenemedi');
  } finally {
    loadingLinks.value = false;
  }
}

async function loadSubmissions() {
  loadingSubmissions.value = true;
  try {
    submissions.value = await portfolioIntakeService.submissions(statusFilter.value);
  } catch {
    toast.error('Başvurular yüklenemedi');
  } finally {
    loadingSubmissions.value = false;
  }
}

function setFilter(s: IntakeSubmissionStatus) {
  statusFilter.value = s;
  loadSubmissions();
}

async function createLink() {
  if (creating.value) return;
  creating.value = true;
  try {
    const link = await portfolioIntakeService.createLink(newLabel.value.trim() || undefined);
    links.value.unshift(link);
    newLabel.value = '';
    showNewLinkForm.value = false;
    await copyLink(link);
  } catch {
    toast.error('Link oluşturulamadı');
  } finally {
    creating.value = false;
  }
}

async function copyLink(link: IntakeLink) {
  try {
    await navigator.clipboard.writeText(link.link);
  } catch {
    toast.info(link.link);
    return;
  }
  copiedId.value = link.id;
  setTimeout(() => {
    if (copiedId.value === link.id) copiedId.value = null;
  }, 2000);
}

async function revokeLink(link: IntakeLink) {
  const ok = await confirm({
    title: 'Linki iptal et',
    message: `${link.label ? `"${link.label}" etiketli link` : 'Bu link'} iptal edilecek; mülk sahibi artık başvuru gönderemez. Gelen başvurular silinmez.`,
    confirmText: 'İptal Et',
    danger: true,
    icon: 'link_off',
  });
  if (!ok) return;
  try {
    await portfolioIntakeService.revokeLink(link.id);
    links.value = links.value.filter((l) => l.id !== link.id);
    toast.success('Link iptal edildi');
  } catch {
    toast.error('İşlem başarısız');
  }
}

function typeLabel(t: string) {
  return PROPERTY_TYPE_LABELS[t as PropertyType] ?? t;
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(iso));
}

function fmtPrice(p: string | number) {
  return new Intl.NumberFormat('tr-TR').format(Number(p));
}

onMounted(() => {
  loadLinks();
  loadSubmissions();
});
</script>

<template>
  <div class="p-4 md:p-8 max-w-5xl mx-auto">
    <!-- Başlık -->
    <div class="flex items-center gap-3 mb-6">
      <button
        class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        @click="router.push('/portfolio')"
      >
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div>
        <h1 class="text-headline-lg font-bold text-on-surface">Portföy Başvuruları</h1>
        <p class="text-label-md text-on-surface-variant">
          Mülk sahiplerine link gönderin; gelen başvuruları inceleyip portföye ekleyin.
        </p>
      </div>
    </div>

    <!-- ── Başvuru Linkleri ── -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mb-6">
      <div class="flex items-center justify-between gap-3 mb-4">
        <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant">Başvuru Linkleri</p>
        <button
          v-if="!showNewLinkForm"
          type="button"
          class="btn ghost text-[13px] py-1.5 px-2.5 text-primary"
          @click="showNewLinkForm = true"
        >
          <span class="material-symbols-outlined text-[16px]">add_link</span>
          Yeni Link
        </button>
      </div>

      <!-- Yeni link oluşturma formu (Notion tarzı: not/etiket + oluştur) -->
      <form v-if="showNewLinkForm" class="mb-4 space-y-2.5" @submit.prevent="createLink">
        <input
          v-model="newLabel"
          class="input w-full"
          maxlength="120"
          placeholder="Etiket (isteğe bağlı) — örn: Mehmet Bey"
          autofocus
        />
        <div class="flex items-center gap-2">
          <button type="submit" class="btn primary flex-1 h-10" :disabled="creating">
            <span class="material-symbols-outlined text-[18px]">{{ creating ? 'hourglass_empty' : 'link' }}</span>
            {{ creating ? 'Oluşturuluyor…' : 'Bağlantı Oluştur' }}
          </button>
          <button
            type="button"
            class="btn ghost h-10 text-on-surface-variant"
            @click="showNewLinkForm = false; newLabel = ''"
          >
            Vazgeç
          </button>
        </div>
      </form>

      <p v-if="loadingLinks && links.length === 0" class="text-label-md text-on-surface-variant">Yükleniyor…</p>
      <p v-else-if="links.length === 0 && !showNewLinkForm" class="text-label-md text-on-surface-variant">
        Henüz aktif link yok. Link oluşturup WhatsApp ile mülk sahibine gönderin.
      </p>
      <div v-else class="space-y-3">
        <div
          v-for="l in links"
          :key="l.id"
          class="rounded-xl border border-outline-variant p-3.5 space-y-2.5"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-primary shrink-0">link</span>
            <p class="flex-1 text-label-md font-semibold text-on-surface truncate">
              {{ l.label || 'Genel başvuru linki' }}
            </p>
            <span class="text-label-sm text-on-surface-variant shrink-0">{{ l.submissionCount }} başvuru</span>
          </div>

          <!-- Notion/Figma tarzı link kutusu -->
          <div class="flex items-center gap-1.5 p-1.5 pl-3 rounded-xl border border-outline-variant bg-surface-container/40">
            <span class="flex-1 text-label-md text-on-surface truncate">{{ l.link }}</span>
            <button type="button" class="btn primary h-9 px-3.5 shrink-0" @click="copyLink(l)">
              <span class="material-symbols-outlined text-[16px]">{{ copiedId === l.id ? 'check' : 'content_copy' }}</span>
              {{ copiedId === l.id ? 'Kopyalandı' : 'Kopyala' }}
            </button>
          </div>

          <div class="flex items-center justify-between gap-2">
            <p class="text-label-sm text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">schedule</span>
              {{ fmtDate(l.expiresAt) }} tarihine kadar geçerli
            </p>
            <button type="button" class="text-label-sm font-medium text-error hover:underline" @click="revokeLink(l)">
              İptal et
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Başvurular ── -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant">Başvurular</p>
        <div class="flex gap-2">
          <button
            v-for="t in STATUS_TABS"
            :key="t.value"
            class="px-3 py-1.5 rounded-full text-label-sm border-2 transition-all duration-150"
            :class="statusFilter === t.value
              ? 'bg-primary text-on-primary border-primary font-medium'
              : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/60'"
            @click="setFilter(t.value)"
          >{{ t.label }}</button>
        </div>
      </div>

      <p v-if="loadingSubmissions" class="text-label-md text-on-surface-variant py-4">Yükleniyor…</p>
      <p v-else-if="submissions.length === 0" class="text-label-md text-on-surface-variant py-4">
        {{ statusFilter === 'PENDING' ? 'Bekleyen başvuru yok.' : 'Bu durumda başvuru yok.' }}
      </p>
      <div v-else class="space-y-2">
        <button
          v-for="s in submissions"
          :key="s.id"
          class="w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-outline-variant/60 hover:border-primary/60 hover:bg-surface-container transition-colors text-left"
          @click="router.push(`/portfolio/basvurular/${s.id}`)"
        >
          <div
            class="w-14 h-14 rounded-lg bg-surface-container shrink-0 overflow-hidden flex items-center justify-center"
          >
            <img v-if="s.images[0]" :src="resolveImgUrl(s.images[0])" class="w-full h-full object-cover" alt="" />
            <span v-else class="material-symbols-outlined text-on-surface-variant">home_work</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-label-md font-semibold text-on-surface truncate">
              {{ s.title || `${typeLabel(s.type)} — ${s.district}, ${s.city}` }}
            </p>
            <p class="text-label-sm text-on-surface-variant truncate">
              {{ s.submitterName }} · {{ s.submitterPhone }} · ₺{{ fmtPrice(s.price) }}
              <template v-if="s.link.label"> · {{ s.link.label }}</template>
            </p>
            <p class="text-label-sm text-on-surface-variant/70">{{ fmtDate(s.createdAt) }}</p>
          </div>
          <span
            class="shrink-0 px-2.5 py-1 rounded-full text-label-sm font-medium"
            :class="STATUS_BADGE[s.status].cls"
          >{{ STATUS_BADGE[s.status].label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
