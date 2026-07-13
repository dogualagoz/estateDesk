<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { adminService } from '../services/admin.service';
import type { AdminOfficeDetail } from '../types';
import AdminStatCard from '../components/AdminStatCard.vue';

/** Ofis detayı: kimlik, sayılar, üyeler ve deaktive etme. */
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const office = ref<AdminOfficeDetail | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    office.value = await adminService.office(route.params.id as string);
  } catch {
    toast.error('Ofis yüklenemedi');
    router.push({ name: 'admin.offices' });
  } finally {
    loading.value = false;
  }
});

async function deactivate() {
  if (!office.value) return;
  const ok = await confirm({
    title: 'Ofisi devre dışı bırak',
    message: `"${office.value.name}" ofisinin TÜM üyeleri deaktive edilecek ve giriş yapamayacaklar. Veriler silinmez; üyeler tek tek yeniden aktive edilebilir.`,
    confirmText: 'Devre Dışı Bırak',
    danger: true,
    icon: 'domain_disabled',
  });
  if (!ok) return;
  try {
    const res = await adminService.deactivateOffice(office.value.id);
    toast.success(`${res.deactivatedMembers} üye deaktive edildi`);
    office.value = await adminService.office(office.value.id);
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'İşlem başarısız');
  }
}

const togglingFeedback = ref(false);
async function toggleFeedback() {
  if (!office.value || togglingFeedback.value) return;
  togglingFeedback.value = true;
  try {
    const next = !office.value.feedbackEnabled;
    await adminService.toggleOfficeFeedback(office.value.id, next);
    office.value.feedbackEnabled = next;
    toast.success(next ? 'Geri bildirim açıldı' : 'Geri bildirim kapatıldı');
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'İşlem başarısız');
  } finally {
    togglingFeedback.value = false;
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(iso));
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-6xl">
    <button class="btn ghost mb-stack-md !px-2" @click="router.push({ name: 'admin.offices' })">
      <span class="material-symbols-outlined text-[18px]">arrow_back</span>
      Ofisler
    </button>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else-if="office">
      <div class="flex items-center justify-between flex-wrap gap-stack-md mb-stack-lg">
        <div>
          <h1 class="text-headline-lg font-semibold text-on-surface tracking-tight">{{ office.name }}</h1>
          <p class="text-label-md text-on-surface-variant mt-1">
            {{ office.owner.fullName }} ({{ office.owner.email }}) ·
            {{ fmtDate(office.createdAt) }} tarihinde kuruldu ·
            son aktivite: {{ fmtDate(office.lastActivityAt) }}
          </p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Geri Bildirim (Beta) toggle -->
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-lg border text-label-md font-medium transition-colors"
            :class="office.feedbackEnabled
              ? 'border-primary bg-primary-fixed/40 text-on-surface'
              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'"
            :disabled="togglingFeedback"
            @click="toggleFeedback"
          >
            <span class="material-symbols-outlined text-[18px]">forum</span>
            Geri Bildirim (Beta)
            <span
              class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
              :class="office.feedbackEnabled ? 'bg-primary' : 'bg-outline-variant'"
            >
              <span
                class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                :class="office.feedbackEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'"
              />
            </span>
          </button>
          <button class="btn border-error text-error bg-transparent hover:bg-error-container" @click="deactivate">
            <span class="material-symbols-outlined text-[18px]">domain_disabled</span>
            Devre Dışı Bırak
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
        <AdminStatCard label="Üye" :value="office._count.members" icon="groups" />
        <AdminStatCard label="Portföy" :value="office._count.portfolios" icon="home_work" />
        <AdminStatCard label="Talep" :value="office._count.demands" icon="inbox" />
        <AdminStatCard label="Davet" :value="office._count.invites ?? 0" icon="mail" />
      </div>

      <section class="card !p-0 overflow-x-auto">
        <h2 class="text-body-lg font-semibold text-on-surface px-4 pt-4 pb-2">Üyeler</h2>
        <table class="w-full text-label-md">
          <thead>
            <tr class="text-left text-label-sm text-on-surface-variant border-b border-outline-variant">
              <th class="px-4 py-3 font-medium">Üye</th>
              <th class="px-4 py-3 font-medium">Rol</th>
              <th class="px-4 py-3 font-medium">Durum</th>
              <th class="px-4 py-3 font-medium">Katılım</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in office.members" :key="m.id" class="border-b border-outline-variant/50">
              <td class="px-4 py-3">
                <div class="font-medium text-on-surface">
                  {{ m.fullName }}
                  <span v-if="m.id === office.owner.id" class="tag primary ml-1">Kurucu</span>
                </div>
                <div class="text-label-sm text-on-surface-variant">{{ m.email }}</div>
              </td>
              <td class="px-4 py-3 text-on-surface-variant">{{ m.role === 'ADMIN' ? 'Yönetici' : 'Danışman' }}</td>
              <td class="px-4 py-3">
                <span class="tag" :class="m.isActive ? 'primary' : ''">{{ m.isActive ? 'Aktif' : 'Deaktif' }}</span>
              </td>
              <td class="px-4 py-3 text-on-surface-variant whitespace-nowrap">{{ fmtDate(m.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
