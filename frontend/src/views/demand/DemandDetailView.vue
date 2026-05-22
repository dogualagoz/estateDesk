<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import { DEMAND_STATUS_LABELS, type Demand } from '@/types/demand';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';

const route = useRoute();
const router = useRouter();
const item = ref<Demand | null>(null);
const loading = ref(true);

function fmtPrice(p: string | number | null | undefined) {
  if (p === null || p === undefined) return '∞';
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

async function load() {
  loading.value = true;
  try {
    item.value = await demandService.get(route.params.id as string);
  } finally {
    loading.value = false;
  }
}

async function remove() {
  if (!item.value) return;
  if (!confirm('Bu talep silinsin mi?')) return;
  await demandService.remove(item.value.id);
  router.push('/demand');
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div v-if="loading" class="empty">Yükleniyor…</div>
    <div v-else-if="!item" class="empty">Bulunamadı</div>

    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div class="flex items-center gap-3">
          <button
            class="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            @click="router.push('/demand')"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 class="text-headline-lg-mobile md:text-headline-md font-semibold text-primary tracking-tight">
              {{ item.customerName }}
            </h1>
            <div class="flex items-center gap-2 mt-1">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold',
                  item.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-surface-container text-on-surface-variant'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ DEMAND_STATUS_LABELS[item.status] }}
              </span>
              <span class="text-label-sm text-on-surface-variant">{{ item.customerPhone }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn" @click="router.push(`/demand/${item.id}/edit`)">
            <span class="material-symbols-outlined text-[18px]">edit</span>
            Düzenle
          </button>
          <button class="btn danger" @click="remove">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            Sil
          </button>
        </div>
      </div>

      <!-- Budget highlight -->
      <div class="bg-surface border border-outline-variant rounded-xl p-stack-md mb-gutter flex items-center gap-4 shadow-sm">
        <span class="material-symbols-outlined text-[28px] text-primary p-3 bg-primary-fixed rounded-xl">payments</span>
        <div>
          <div class="text-label-sm text-on-surface-variant uppercase tracking-wider">Bütçe Aralığı</div>
          <div class="text-headline-md font-bold text-primary tracking-tight mt-1">
            {{ fmtPrice(item.minBudget) }} – {{ fmtPrice(item.maxBudget) }}
          </div>
        </div>
      </div>

      <!-- Detail Card -->
      <div class="card">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Telefon</span>
            <div class="text-label-md font-medium text-on-surface">{{ item.customerPhone }}</div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Durum</span>
            <div>
              <span :class="['tag', item.status === 'ACTIVE' ? 'success' : 'danger']">
                {{ DEMAND_STATUS_LABELS[item.status] }}
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Ekleyen</span>
            <div class="text-label-md font-medium text-on-surface">{{ item.createdBy?.fullName || '—' }}</div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Tarih</span>
            <div class="text-label-md text-on-surface-variant">{{ new Date(item.createdAt).toLocaleString('tr-TR') }}</div>
          </div>

          <div class="col-span-2 md:col-span-3 flex flex-col gap-2">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Aranan Türler</span>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in item.types" :key="t" class="tag primary">{{ PROPERTY_TYPE_LABELS[t] }}</span>
              <span v-if="!item.types.length" class="text-label-md text-on-surface-variant">—</span>
            </div>
          </div>

          <div class="col-span-2 md:col-span-3 flex flex-col gap-2">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Bölgeler</span>
            <div class="flex flex-wrap gap-2">
              <span v-for="r in item.regions" :key="r" class="tag">{{ r }}</span>
              <span v-if="!item.regions.length" class="text-label-md text-on-surface-variant">—</span>
            </div>
          </div>

          <div class="col-span-2 md:col-span-3 flex flex-col gap-2">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Oda Tercihleri</span>
            <div class="flex flex-wrap gap-2">
              <span v-for="r in item.roomPreferences" :key="r" class="tag">{{ r }}</span>
              <span v-if="!item.roomPreferences.length" class="text-label-md text-on-surface-variant">—</span>
            </div>
          </div>

          <div class="col-span-2 md:col-span-3 flex flex-col gap-2">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Özellik Tercihleri</span>
            <div class="flex flex-wrap gap-2">
              <span v-for="f in item.featurePrefs" :key="f" class="tag">{{ f }}</span>
              <span v-if="!item.featurePrefs.length" class="text-label-md text-on-surface-variant">—</span>
            </div>
          </div>

          <div v-if="item.note" class="col-span-2 md:col-span-3 flex flex-col gap-2">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Not</span>
            <div class="text-label-md text-on-surface whitespace-pre-wrap bg-surface-container-low rounded-lg p-3">{{ item.note }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
