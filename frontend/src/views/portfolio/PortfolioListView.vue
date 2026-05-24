<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  type Portfolio,
  type PortfolioQuery,
} from '@/types/portfolio';

const router = useRouter();
const loading = ref(false);
const items = ref<Portfolio[]>([]);
const total = ref(0);
const showFilters = ref(false);

const filters = reactive<PortfolioQuery>({ page: 1, pageSize: 20 });

async function load() {
  loading.value = true;
  try {
    const cleaned: PortfolioQuery = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== undefined && v !== null) (cleaned as any)[k] = v;
    }
    const res = await portfolioService.list(cleaned);
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

function fmtPrice(p: string | number) {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

async function remove(p: Portfolio) {
  if (!confirm(`"${p.city}/${p.district}" portföyü silinsin mi?`)) return;
  await portfolioService.remove(p.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Portföy Yönetimi</h1>
        <p class="text-label-md text-on-surface-variant mt-1">Toplam {{ total }} ilan</p>
      </div>
      <button class="btn primary" @click="router.push('/portfolio/new')">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Yeni Portföy
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
            placeholder="Bölge, fiyat, özellik ara..."
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
          <label>İl</label>
          <input class="input" v-model="filters.city" placeholder="İstanbul" />
        </div>
        <div class="field">
          <label>İlçe</label>
          <input class="input" v-model="filters.district" placeholder="Kadıköy" />
        </div>
        <div class="field">
          <label>Oda</label>
          <input class="input" v-model="filters.roomCount" placeholder="2+1" />
        </div>
        <div class="field">
          <label>Min fiyat</label>
          <input class="input" type="number" v-model.number="filters.minPrice" />
        </div>
        <div class="field">
          <label>Max fiyat</label>
          <input class="input" type="number" v-model.number="filters.maxPrice" />
        </div>
        <div class="field">
          <label>Durum</label>
          <select class="select" v-model="filters.visibility">
            <option :value="undefined">Hepsi</option>
            <option value="PUBLIC">Açık</option>
            <option value="HIDDEN">Gizli</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-stack-md">
        <button class="btn primary" @click="filters.page = 1; load()">Uygula</button>
        <button class="btn" @click="resetFilters">Sıfırla</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="empty">Yükleniyor…</div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="empty">Kayıt bulunamadı</div>

    <!-- Card Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
      <article
        v-for="p in items"
        :key="p.id"
        class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer group"
        @click="router.push(`/portfolio/${p.id}`)"
      >
        <!-- Image / Placeholder -->
        <div class="relative h-44 bg-surface-container flex items-center justify-center overflow-hidden">
          <img
            v-if="p.images && p.images.length"
            :src="p.images[0]"
            :alt="p.title || p.city"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <span v-else class="material-symbols-outlined text-[44px] text-outline-variant">maps_home_work</span>
          <!-- Type badge -->
          <div class="absolute top-3 left-3">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary text-label-sm shadow-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-on-primary/70"></span>
              {{ PROPERTY_TYPE_LABELS[p.type] }}
            </span>
          </div>
          <!-- Visibility badge -->
          <div class="absolute top-3 right-3">
            <span
              :class="[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-semibold uppercase tracking-wider backdrop-blur-sm',
                p.visibility === 'HIDDEN'
                  ? 'bg-error-container/90 text-on-error-container border border-error/20'
                  : 'bg-emerald-50/90 text-emerald-700 border border-emerald-200'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
              {{ p.visibility === 'HIDDEN' ? 'Gizli' : 'Açık' }}
            </span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-stack-md flex flex-col flex-1">
          <h3 class="text-body-lg font-semibold text-on-surface mb-1 truncate group-hover:text-primary transition-colors">
            {{ p.city }}, {{ p.district }}<span v-if="p.neighborhood"> / {{ p.neighborhood }}</span>
          </h3>
          <p class="text-label-md text-on-surface-variant flex items-center gap-1 mb-3">
            <span class="material-symbols-outlined text-[14px]">location_on</span>
            {{ PROPERTY_TYPE_LABELS[p.type] }}
          </p>

          <!-- Specs -->
          <div class="flex items-center gap-3 py-3 border-t border-b border-outline-variant mb-3">
            <div class="flex items-center gap-1 text-label-md text-on-surface flex-1 justify-center">
              <span class="material-symbols-outlined text-[18px] text-outline">bed</span>
              {{ p.roomCount }}
            </div>
            <div class="w-px h-4 bg-outline-variant"></div>
            <div class="flex items-center gap-1 text-label-md text-on-surface flex-1 justify-center">
              <span class="material-symbols-outlined text-[18px] text-outline">square_foot</span>
              {{ p.areaSqm }} m²
            </div>
            <div class="w-px h-4 bg-outline-variant"></div>
            <div class="flex items-center gap-1 text-label-md text-on-surface flex-1 justify-center">
              <span class="material-symbols-outlined text-[18px] text-outline">person</span>
              <span class="truncate max-w-[80px]">{{ p.ownerName }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-between items-center mt-auto">
            <div class="text-headline-md font-semibold tracking-tight text-primary">{{ fmtPrice(p.price) }}</div>
            <div class="flex gap-1">
              <button
                class="btn ghost p-2"
                @click.stop="router.push(`/portfolio/${p.id}`)"
                title="Detay"
              >
                <span class="material-symbols-outlined text-[18px]">open_in_new</span>
              </button>
              <button
                class="btn ghost danger p-2"
                @click.stop="remove(p)"
                title="Sil"
              >
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
