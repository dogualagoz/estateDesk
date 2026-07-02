<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { officeService } from '@/services/office.service';
import type { OfficeSummary, OfficeMember } from '@/types/office';
import OfficeMembersSection from './components/OfficeMembersSection.vue';
import OfficeExportCard from './components/OfficeExportCard.vue';
import OfficeSettingsCard from './components/OfficeSettingsCard.vue';

/**
 * Ofis sayfası: özet istatistikler + üç alt bölüm.
 * Üye eylemleri OfficeMembersSection'da, dışa aktarma OfficeExportCard'da,
 * ad/davet/çıkış OfficeSettingsCard'dadır; ortak veri (office, members) burada tutulur.
 */
const office = ref<OfficeSummary | null>(null);
const members = ref<OfficeMember[]>([]);
const loading = ref(false);

const ownerId = computed(() => office.value?.ownerId ?? null);
const totalPortfolios = computed(() => office.value?._count.portfolios ?? 0);
const totalDemands = computed(() => office.value?._count.demands ?? 0);
const memberCount = computed(() => office.value?._count.members ?? 0);
const avgPortfolio = computed(() =>
  memberCount.value ? Math.round(totalPortfolios.value / memberCount.value) : 0,
);

const stats = computed(() => [
  { icon: 'groups', label: 'Danışman', value: memberCount.value },
  { icon: 'home_work', label: 'Portföy', value: totalPortfolios.value },
  { icon: 'inbox', label: 'Talep', value: totalDemands.value },
  { icon: 'insights', label: 'Danışman başına portföy', value: avgPortfolio.value },
]);

const createdAtLabel = computed(() => {
  if (!office.value?.createdAt) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(office.value.createdAt));
});

async function load() {
  loading.value = true;
  try {
    const [o, m] = await Promise.all([officeService.me(), officeService.members()]);
    office.value = o;
    members.value = m;
  } finally {
    loading.value = false;
  }
}

// ── Alt bileşenlerden gelen değişiklikler ──
function onRoleChanged(id: string, role: 'ADMIN' | 'AGENT') {
  const member = members.value.find((m) => m.id === id);
  if (member) member.role = role;
}

function onMemberRemoved(id: string) {
  members.value = members.value.filter((m) => m.id !== id);
  if (office.value) office.value._count.members -= 1;
}

onMounted(load);
</script>

<template>
  <div class="page">
    <!-- Başlık -->
    <div class="page-header !mb-stack-md">
      <div class="flex items-center gap-4 min-w-0">
        <div
          class="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0"
        >
          <span class="material-symbols-outlined text-[26px]">apartment</span>
        </div>
        <div class="min-w-0">
          <h1
            class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface truncate"
          >
            {{ office?.name || 'Ofisim' }}
          </h1>
          <p v-if="office" class="text-label-md text-on-surface-variant mt-0.5">
            {{ office.owner.fullName }}
            <span v-if="createdAtLabel"> · {{ createdAtLabel }} tarihinde kuruldu</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else>
      <!-- Özet istatistikler -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
        <div
          v-for="s in stats"
          :key="s.label"
          class="card !p-stack-md flex items-center gap-stack-md"
        >
          <div
            class="w-11 h-11 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center shrink-0"
          >
            <span class="material-symbols-outlined text-[22px]">{{ s.icon }}</span>
          </div>
          <div class="min-w-0">
            <div class="text-headline-md font-semibold text-on-surface leading-none">
              {{ s.value }}
            </div>
            <div class="text-label-sm text-on-surface-variant mt-1.5 leading-tight">
              {{ s.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Danışmanlar -->
      <OfficeMembersSection
        :members="members"
        :owner-id="ownerId"
        :total-portfolios="totalPortfolios"
        :total-demands="totalDemands"
        :member-count="memberCount"
        @role-changed="onRoleChanged"
        @removed="onMemberRemoved"
      />

      <!-- Verileri dışa aktar -->
      <OfficeExportCard :members="members" />

      <!-- Ofis ayarları -->
      <OfficeSettingsCard
        :office="office"
        :owner-id="ownerId"
        @renamed="(o) => (office = o)"
      />
    </template>
  </div>
</template>
