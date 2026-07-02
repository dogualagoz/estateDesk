<script setup lang="ts">
import { computed, ref } from 'vue';
import { officeService, type ExportDataset, type ExportFormat } from '@/services/office.service';
import { useToast } from '@/composables/useToast';
import type { OfficeMember } from '@/types/office';

/**
 * Verileri dışa aktarma kartı: kapsam seçimi (tüm ofis / tek danışman)
 * ve portföy/talep için Excel/CSV indirme.
 */
const props = defineProps<{
  members: OfficeMember[];
}>();

const toast = useToast();

const exportScope = ref<string>('all');
const exportingKey = ref<string | null>(null);

/** Kapsam dropdown'ında aktiviteye (portföy + talep) göre sıralı üyeler. */
const sortedMembers = computed(() =>
  [...props.members].sort(
    (a, b) => b.portfolioCount + b.demandCount - (a.portfolioCount + a.demandCount),
  ),
);

const scopeLabel = computed(() => {
  if (exportScope.value === 'all') return 'tüm ofis';
  return props.members.find((m) => m.id === exportScope.value)?.fullName ?? '';
});

async function doExport(dataset: ExportDataset, format: ExportFormat) {
  const key = `${dataset}-${format}`;
  exportingKey.value = key;
  try {
    const memberId = exportScope.value === 'all' ? undefined : exportScope.value;
    await officeService.exportData(dataset, format, memberId);
    toast.success('Dışa aktarma hazırlandı');
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'Dışa aktarma başarısız');
  } finally {
    exportingKey.value = null;
  }
}
</script>

<template>
  <section class="card mb-stack-lg">
    <div class="flex items-start gap-3 mb-stack-md">
      <div
        class="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center shrink-0"
      >
        <span class="material-symbols-outlined text-[20px]">download</span>
      </div>
      <div>
        <h2 class="text-body-lg font-semibold text-on-surface">Verileri Dışa Aktar</h2>
        <p class="text-label-md text-on-surface-variant mt-0.5">
          Portföy ve talep kayıtlarını Excel ya da CSV olarak indirin. Yedekleme, rapor veya
          başka bir araca aktarım için kullanışlıdır.
        </p>
      </div>
    </div>

    <!-- Kapsam seçimi -->
    <div class="field full mb-stack-md">
      <label>Kapsam</label>
      <select v-model="exportScope" class="select sm:max-w-xs">
        <option value="all">Tüm ofis</option>
        <option v-for="m in sortedMembers" :key="m.id" :value="m.id">
          {{ m.fullName }} ({{ m.portfolioCount }} portföy · {{ m.demandCount }} talep)
        </option>
      </select>
    </div>

    <div class="grid sm:grid-cols-2 gap-stack-md">
      <div
        v-for="ds in [
          { key: 'portfolios', label: 'Portföyler', icon: 'home_work' },
          { key: 'demands', label: 'Talepler', icon: 'inbox' },
        ]"
        :key="ds.key"
        class="rounded-xl border border-outline-variant bg-surface-container-low p-stack-md flex flex-col gap-stack-sm"
      >
        <div class="flex items-center gap-2 text-on-surface font-medium">
          <span class="material-symbols-outlined text-[20px] text-primary">{{ ds.icon }}</span>
          {{ ds.label }}
        </div>
        <div class="flex gap-2">
          <button
            class="btn primary flex-1"
            :disabled="exportingKey === `${ds.key}-xlsx`"
            @click="doExport(ds.key as ExportDataset, 'xlsx')"
          >
            <span
              class="material-symbols-outlined text-[18px]"
              :class="exportingKey === `${ds.key}-xlsx` ? 'animate-spin' : ''"
            >
              {{ exportingKey === `${ds.key}-xlsx` ? 'progress_activity' : 'table_view' }}
            </span>
            Excel
          </button>
          <button
            class="btn secondary flex-1"
            :disabled="exportingKey === `${ds.key}-csv`"
            @click="doExport(ds.key as ExportDataset, 'csv')"
          >
            <span
              class="material-symbols-outlined text-[18px]"
              :class="exportingKey === `${ds.key}-csv` ? 'animate-spin' : ''"
            >
              {{ exportingKey === `${ds.key}-csv` ? 'progress_activity' : 'description' }}
            </span>
            CSV
          </button>
        </div>
      </div>
    </div>
    <p class="text-label-sm text-on-surface-variant mt-stack-md">
      <span class="material-symbols-outlined text-[14px] align-text-bottom">filter_alt</span>
      İndirilecek kapsam: <strong class="text-on-surface">{{ scopeLabel }}</strong>
    </p>
  </section>
</template>
