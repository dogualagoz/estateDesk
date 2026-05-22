<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import { DEMAND_STATUS_LABELS, type Demand, type DemandQuery } from '@/types/demand';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '@/types/portfolio';

const router = useRouter();
const loading = ref(false);
const items = ref<Demand[]>([]);
const total = ref(0);
const showFilters = ref(false);

const filters = reactive<DemandQuery>({ page: 1, pageSize: 20 });

async function load() {
  loading.value = true;
  try {
    const cleaned: DemandQuery = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== undefined && v !== null) (cleaned as any)[k] = v;
    }
    const res = await demandService.list(cleaned);
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  Object.keys(filters).forEach((k) => {
    if (k !== 'page' && k !== 'pageSize') (filters as any)[k] = undefined;
  });
  filters.page = 1;
  load();
}

function fmtPrice(p: string | number | null | undefined) {
  if (p === null || p === undefined) return '∞';
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Bugün';
  if (days === 1) return '1 gün önce';
  if (days < 7) return `${days} gün önce`;
  return `${Math.floor(days / 7)} hafta önce`;
}

async function remove(d: Demand) {
  if (!confirm(`"${d.customerName}" talebi silinsin mi?`)) return;
  await demandService.remove(d.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Müşteri Talepleri</h1>
        <p class="text-label-md text-on-surface-variant mt-1">Aktif alıcı ve kiracı arayışları</p>
      </div>
      <button class="btn primary" @click="router.push('/demand/new')">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Yeni Talep
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex justify-center mb-gutter">
      <div class="relative w-full max-w-2xl flex gap-3 items-center">
        <div class="relative flex-1">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">search</span>
          <input
            v-model="filters.q"
            type="text"
            placeholder="Bölge veya müşteri ara..."
            class="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
            @keyup.enter="filters.page = 1; load()"
          />
        </div>
        <button
          class="btn gap-1.5 shrink-0"
          :class="showFilters ? 'bg-primary-fixed text-on-primary-fixed-variant border-primary/30' : ''"
          @click="showFilters = !showFilters"
        >
          <span class="material-symbols-outlined text-[18px]">tune</span>
          Filtrele
        </button>
      </div>
    </div>

    <!-- Filter Panel -->
    <div v-if="showFilters" class="card mb-gutter">
      <div class="flex flex-wrap gap-stack-md">
        <div class="field">
          <label>Tür</label>
          <select class="select" v-model="filters.type">
            <option :value="undefined">Hepsi</option>
            <option v-for="t in PROPERTY_TYPES" :key="t" :value="t">{{ PROPERTY_TYPE_LABELS[t] }}</option>
          </select>
        </div>
        <div class="field">
          <label>Bölge</label>
          <input class="input" v-model="filters.region" placeholder="Kadıköy" />
        </div>
        <div class="field">
          <label>Oda</label>
          <input class="input" v-model="filters.roomPreference" placeholder="2+1" />
        </div>
        <div class="field">
          <label>Durum</label>
          <select class="select" v-model="filters.status">
            <option :value="undefined">Hepsi</option>
            <option value="ACTIVE">Aktif</option>
            <option value="CLOSED">Kapandı</option>
          </select>
        </div>
        <div class="field">
          <label>Min bütçe</label>
          <input class="input" type="number" v-model.number="filters.minBudget" />
        </div>
        <div class="field">
          <label>Max bütçe</label>
          <input class="input" type="number" v-model.number="filters.maxBudget" />
        </div>
      </div>
      <div class="flex gap-3 mt-stack-md items-center">
        <button class="btn primary" @click="filters.page = 1; load()">Uygula</button>
        <button class="btn" @click="resetFilters">Sıfırla</button>
        <span class="ml-auto text-label-sm text-on-surface-variant">{{ total }} kayıt</span>
      </div>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>
    <div v-else-if="!items.length" class="empty">Kayıt bulunamadı</div>

    <!-- Card Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
      <article
        v-for="d in items"
        :key="d.id"
        class="bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md shadow-sm flex flex-col cursor-pointer transition-shadow duration-200 hover:shadow-md group"
        :class="{ 'opacity-70': d.status === 'CLOSED' }"
        @click="router.push(`/demand/${d.id}`)"
      >
        <!-- Status badges -->
        <div class="flex justify-between items-start mb-3">
          <span
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-label-sm font-medium',
              d.status === 'ACTIVE'
                ? 'bg-primary-fixed text-on-primary-fixed-variant'
                : 'bg-secondary-container text-on-surface-variant'
            ]"
          >
            <span class="material-symbols-outlined text-[14px]">{{ d.status === 'ACTIVE' ? 'radar' : 'check_circle' }}</span>
            {{ d.status === 'ACTIVE' ? 'Arıyor' : 'Kapandı' }}
          </span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-sm border border-outline-variant text-label-sm text-on-surface-variant bg-surface-container">
            {{ DEMAND_STATUS_LABELS[d.status] }}
          </span>
        </div>

        <!-- Title -->
        <h2 class="text-body-lg font-semibold text-on-surface mb-1 transition-colors group-hover:text-primary">
          {{ d.regions.join(', ') || 'Bölge belirtilmemiş' }}
          <span v-if="d.roomPreferences.length" class="text-on-surface-variant font-normal"> — {{ d.roomPreferences.join(', ') }}</span>
        </h2>

        <p class="text-label-md text-on-surface-variant mb-3 line-clamp-2">
          {{ d.note || 'Not eklenmemiş' }}
        </p>

        <!-- Budget -->
        <div class="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-lg p-3 mb-3">
          <span class="material-symbols-outlined text-[20px] text-primary p-1.5 bg-surface-container-lowest rounded-sm shadow-sm">payments</span>
          <div>
            <div class="text-label-sm text-outline uppercase tracking-wider">Bütçe Aralığı</div>
            <div class="text-label-md font-semibold text-primary mt-0.5">{{ fmtPrice(d.minBudget) }} – {{ fmtPrice(d.maxBudget) }}</div>
          </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 mb-3" v-if="d.featurePrefs.length || d.types.length">
          <span
            v-for="f in (d.featurePrefs.length ? d.featurePrefs.slice(0, 4) : d.types)"
            :key="f"
            class="tag"
          >{{ d.featurePrefs.length ? f : PROPERTY_TYPE_LABELS[f as keyof typeof PROPERTY_TYPE_LABELS] }}</span>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center mt-auto pt-3 border-t border-outline-variant">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[11px] font-bold shadow-sm">
              {{ initials(d.customerName) }}
            </div>
            <span class="text-label-md font-medium text-on-surface">{{ d.customerName }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1 text-label-sm text-outline">
              <span class="material-symbols-outlined text-[14px]">schedule</span>
              {{ timeAgo(d.createdAt) }}
            </span>
            <button class="btn ghost danger p-1.5" @click.stop="remove(d)" title="Sil">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
