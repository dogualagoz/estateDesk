<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import { portfolioIntakeService } from '@/services/portfolioIntake.service';
import { resolveImgUrl } from '@/utils/image';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  type Portfolio,
  type PortfolioQuery,
} from '@/types/portfolio';

const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();
const loading = ref(false);
const items = ref<Portfolio[]>([]);
const total = ref(0);
const showFilters = ref(false);

const filters = reactive<PortfolioQuery>({ page: 1, pageSize: 20 });

const totalPages = computed(() => Math.ceil(total.value / (filters.pageSize ?? 20)));

const pageNumbers = computed(() => {
  const current = filters.page ?? 1;
  const last = totalPages.value;
  const pages: (number | '...')[] = [];
  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) pages.push(i);
    if (current < last - 2) pages.push('...');
    pages.push(last);
  }
  return pages;
});

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  filters.page = p;
  load();
}

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

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

async function remove(p: Portfolio) {
  const ok = await confirm({
    title: 'Portföyü sil',
    message: `"${p.city}/${p.district}" portföyünü silmek istediğinizden emin misiniz?`,
    danger: true,
    icon: 'delete',
  });
  if (!ok) return;
  try {
    await portfolioService.remove(p.id);
    toast.success('Portföy silindi');
    await load();
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Portföy silinemedi');
  }
}

// Bekleyen portföy başvurusu rozeti (hata sessiz geçilir — ör. demo oturum)
const pendingIntakeCount = ref(0);
async function loadPendingIntake() {
  try {
    pendingIntakeCount.value = (await portfolioIntakeService.pendingCount()).count;
  } catch {
    pendingIntakeCount.value = 0;
  }
}

onMounted(() => {
  load();
  loadPendingIntake();
});
</script>

<template>
  <div class="page">
    <!-- Page Header -->
    <div class="page-header" data-tour="portfolio-list">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Portföy Yönetimi</h1>
        <p class="text-label-md text-on-surface-variant mt-1">Toplam {{ total }} ilan</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn relative" @click="router.push('/portfolio/basvurular')">
          <span class="material-symbols-outlined text-[18px]">inbox</span>
          Başvurular
          <span
            v-if="pendingIntakeCount > 0"
            class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center"
          >{{ pendingIntakeCount > 9 ? '9+' : pendingIntakeCount }}</span>
        </button>
        <button class="btn primary" @click="router.push('/portfolio/new')">
          <span class="material-symbols-outlined text-[18px]">add</span>
          Yeni Portföy
        </button>
      </div>
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
          <select v-model="filters.type" class="select">
            <option :value="undefined">Hepsi</option>
            <option v-for="t in PROPERTY_TYPES" :key="t" :value="t">{{ PROPERTY_TYPE_LABELS[t] }}</option>
          </select>
        </div>
        <div class="field">
          <label>İl</label>
          <input v-model="filters.city" class="input" placeholder="İstanbul" />
        </div>
        <div class="field">
          <label>İlçe</label>
          <input v-model="filters.district" class="input" placeholder="Kadıköy" />
        </div>
        <div class="field">
          <label>Oda</label>
          <input v-model="filters.roomCount" class="input" placeholder="2+1" />
        </div>
        <div class="field">
          <label>Min fiyat</label>
          <input v-model.number="filters.minPrice" class="input" type="number" />
        </div>
        <div class="field">
          <label>Max fiyat</label>
          <input v-model.number="filters.maxPrice" class="input" type="number" />
        </div>
        <div class="field">
          <label>Durum</label>
          <select v-model="filters.visibility" class="select">
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
        class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-md hover:border-outline transition-all duration-200 flex flex-col cursor-pointer group"
        @click="router.push(`/portfolio/${p.id}`)"
      >
        <!-- Image / Placeholder -->
        <div class="relative h-44 bg-surface-container flex items-center justify-center overflow-hidden">
          <img
            v-if="p.images && p.images.length"
            :src="resolveImgUrl(p.images[0])"
            :alt="p.title || p.city"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <span v-else class="material-symbols-outlined text-[44px] text-outline-variant">maps_home_work</span>
        </div>

        <!-- Card Body -->
        <div class="px-stack-md pt-stack-md pb-3 flex flex-col flex-1">
          <!-- Badge row: tip · ilan tipi  +  görünürlük -->
          <div class="flex justify-between items-center gap-2 mb-3">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-label-sm font-medium bg-surface-container text-on-surface-variant shrink-0">
                {{ PROPERTY_TYPE_LABELS[p.type] }}
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-md text-label-sm font-medium shrink-0"
                :class="p.listingType === 'RENT' ? 'bg-amber-50 text-amber-700' : 'bg-primary-fixed text-on-primary-fixed-variant'"
              >{{ LISTING_TYPE_LABELS[p.listingType] }}</span>
            </div>
            <span
              class="inline-flex items-center gap-1.5 text-label-sm font-medium shrink-0"
              :class="p.visibility === 'HIDDEN' ? 'text-amber-600' : 'text-emerald-600'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="p.visibility === 'HIDDEN' ? 'bg-amber-500' : 'bg-emerald-500'"></span>
              {{ p.visibility === 'HIDDEN' ? 'Gizli' : 'Açık' }}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-body-lg font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary truncate">
            {{ p.city }}, {{ p.district }}<span v-if="p.neighborhood"> / {{ p.neighborhood }}</span>
          </h3>

          <!-- Specs -->
          <div class="flex items-center gap-3 mt-1.5 text-label-md text-on-surface-variant">
            <span v-if="p.roomCount" class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-outline">bed</span>{{ p.roomCount }}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-outline">square_foot</span>{{ p.areaSqm }} m²
            </span>
          </div>

          <!-- Price -->
          <div class="text-headline-md font-semibold tracking-tight text-primary tabular-nums mt-3">{{ fmtPrice(p.price) }}</div>

          <!-- Footer -->
          <div class="flex justify-between items-center mt-auto pt-2.5 border-t border-outline-variant">
            <div class="flex items-center gap-2 min-w-0">
              <div
                v-if="p.createdBy"
                class="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[11px] font-bold shrink-0"
              >{{ initials(p.createdBy.fullName) }}</div>
              <span class="text-label-md font-medium text-on-surface truncate">{{ p.createdBy?.fullName || '—' }}</span>
            </div>
            <button
              class="btn ghost danger p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              title="Sil"
              @click.stop="remove(p)"
            >
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
      <button
        class="btn p-2"
        :disabled="(filters.page ?? 1) <= 1"
        title="Önceki sayfa"
        @click="goToPage((filters.page ?? 1) - 1)"
      >
        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
      </button>

      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p === '...'" class="px-2 text-on-surface-variant select-none">…</span>
        <button
          v-else
          class="w-9 h-9 rounded-lg text-label-md font-medium transition-colors"
          :class="p === (filters.page ?? 1)
            ? 'bg-primary text-on-primary'
            : 'text-on-surface hover:bg-surface-container'"
          @click="goToPage(p as number)"
        >
          {{ p }}
        </button>
      </template>

      <button
        class="btn p-2"
        :disabled="(filters.page ?? 1) >= totalPages"
        title="Sonraki sayfa"
        @click="goToPage((filters.page ?? 1) + 1)"
      >
        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  </div>
</template>
