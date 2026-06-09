<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import type { Demand, DemandQuery } from '@/types/demand';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from '@/types/portfolio';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { resolveImgUrl } from '@/utils/image';

const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();
const loading = ref(false);
const items = ref<Demand[]>([]);
const total = ref(0);
const showFilters = ref(false);

const filters = reactive<DemandQuery>({ page: 1, pageSize: 20 });

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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function searchAgeLabel(dateStr: string) {
  const days = daysSince(dateStr);
  if (days === 0) return 'Bugün eklendi';
  if (days === 1) return '1 gündür arıyor';
  if (days < 14) return `${days} gündür arıyor`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks} haftadır arıyor`;
  return `${Math.floor(days / 30)} aydır arıyor`;
}

/**
 * Arama süresine göre yeşil→kırmızı renk.
 * 0 gün → yeşil, ~60 gün ve üstü → kırmızı (doğrusal hue geçişi).
 */
function searchAgeColor(dateStr: string) {
  const t = Math.min(daysSince(dateStr) / 60, 1);
  const hue = Math.round(142 * (1 - t)); // 142 (yeşil) → 0 (kırmızı)
  return `hsl(${hue}, 62%, 42%)`;
}

function fmtCompact(n: number) {
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

async function remove(d: Demand) {
  const ok = await confirm({
    title: 'Talebi sil',
    message: `"${d.customerName}" adlı müşterinin talebini silmek istediğinizden emin misiniz?`,
    danger: true,
    icon: 'delete',
  });
  if (!ok) return;
  try {
    await demandService.remove(d.id);
    toast.success('Talep silindi');
    await load();
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Talep silinemedi');
  }
}

onMounted(load);
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header" data-tour="demand-list">
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
        class="relative bg-surface-container-lowest rounded-xl border border-outline-variant px-stack-md pt-stack-md pb-3 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-outline has-[.best-match-link:hover]:!shadow-sm has-[.best-match-link:hover]:!border-outline-variant group"
        :class="{ 'opacity-60': d.status === 'CLOSED' }"
        @click="router.push(`/demand/${d.id}`)"
      >
        <!-- Top row: type · listing chip  +  status -->
        <div class="flex justify-between items-center gap-2 mb-3">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-label-sm font-medium bg-surface-container text-on-surface-variant shrink-0">
              {{ d.types.length ? PROPERTY_TYPE_LABELS[d.types[0]] : 'Tür yok' }}<span v-if="d.types.length > 1" class="text-outline ml-0.5">+{{ d.types.length - 1 }}</span>
            </span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-label-sm font-medium shrink-0"
              :class="d.listingType === 'RENT' ? 'bg-amber-50 text-amber-700' : 'bg-primary-fixed text-on-primary-fixed-variant'"
            >{{ LISTING_TYPE_LABELS[d.listingType] }}</span>
          </div>
          <span
            class="inline-flex items-center gap-1.5 text-label-sm font-medium shrink-0"
            :class="d.status === 'ACTIVE' ? 'text-emerald-600' : 'text-on-surface-variant'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="d.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-outline'"></span>
            {{ d.status === 'ACTIVE' ? 'Arıyor' : 'Kapandı' }}
          </span>
        </div>

        <!-- Title: location -->
        <h2 class="text-body-lg font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary line-clamp-1">
          <template v-if="d.regions.length">{{ d.regions.join(', ') }}</template>
          <span v-else class="text-on-surface-variant font-normal">Bölge belirtilmemiş</span>
        </h2>

        <!-- Room preferences -->
        <div class="flex flex-wrap gap-1 mt-1.5" v-if="d.roomPreferences.length">
          <span v-for="r in d.roomPreferences.slice(0, 5)" :key="r" class="text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container-low">{{ r }}</span>
        </div>

        <!-- Note -->
        <p v-if="d.note" class="text-label-md text-on-surface-variant mt-2 line-clamp-2">{{ d.note }}</p>

        <!-- Budget -->
        <div class="flex items-baseline gap-2 mt-3">
          <span class="text-body-lg font-semibold text-on-surface tabular-nums">{{ fmtPrice(d.minBudget) }}</span>
          <span class="text-on-surface-variant">–</span>
          <span class="text-body-lg font-semibold text-on-surface tabular-nums">{{ fmtPrice(d.maxBudget) }}</span>
        </div>

        <!-- Best matching portfolio -->
        <div class="mt-3 mb-1">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-label-sm text-outline uppercase tracking-wider">En İyi Eşleşme</span>
            <span
              v-if="d.bestMatch"
              class="inline-flex items-center text-label-sm font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
            >%{{ d.bestMatch.score }}</span>
          </div>

          <RouterLink
            v-if="d.bestMatch"
            :to="`/portfolio/${d.bestMatch.portfolioId}`"
            class="best-match-link flex items-center gap-3 p-2 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary/50 hover:shadow-sm transition-all"
            @click.stop
          >
            <div class="w-12 h-12 rounded-md overflow-hidden bg-surface-container-high shrink-0 flex items-center justify-center">
              <img v-if="d.bestMatch.image" :src="resolveImgUrl(d.bestMatch.image)" class="w-full h-full object-cover" alt="" loading="lazy" />
              <span v-else class="material-symbols-outlined text-[22px] text-outline">home_work</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-label-md font-medium text-on-surface truncate">
                {{ d.bestMatch.title || `${PROPERTY_TYPE_LABELS[d.bestMatch.type]} · ${d.bestMatch.district}` }}
              </div>
              <div class="text-label-sm text-on-surface-variant truncate">
                {{ d.bestMatch.district }}<template v-if="d.bestMatch.neighborhood">, {{ d.bestMatch.neighborhood }}</template> · {{ d.bestMatch.roomCount }}
              </div>
              <div class="text-label-sm font-semibold text-primary tabular-nums mt-0.5">{{ fmtCompact(d.bestMatch.price) }}</div>
            </div>
            <span class="material-symbols-outlined text-[18px] text-outline shrink-0">chevron_right</span>
          </RouterLink>

          <div
            v-else
            class="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-outline-variant text-label-sm text-on-surface-variant"
          >
            <span class="material-symbols-outlined text-[18px] text-outline">search_off</span>
            Henüz eşleşen portföy yok
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center mt-auto pt-2.5 border-t border-outline-variant">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[11px] font-bold shrink-0">
              {{ initials(d.customerName) }}
            </div>
            <span class="text-label-md font-medium text-on-surface truncate">{{ d.customerName }}</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span
              class="flex items-center gap-1.5 text-label-sm font-medium"
              :style="d.status === 'ACTIVE' ? { color: searchAgeColor(d.createdAt) } : undefined"
              :class="{ 'text-outline': d.status === 'CLOSED' }"
              :title="`${daysSince(d.createdAt)} gün`"
            >
              <span
                class="w-1.5 h-1.5 rounded-full"
                :style="d.status === 'ACTIVE' ? { backgroundColor: searchAgeColor(d.createdAt) } : undefined"
                :class="{ 'bg-outline': d.status === 'CLOSED' }"
              ></span>
              {{ d.status === 'ACTIVE' ? searchAgeLabel(d.createdAt) : 'Kapandı' }}
            </span>
            <button class="btn ghost danger p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" @click.stop="remove(d)" title="Sil">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
      <button
        class="btn p-2"
        :disabled="(filters.page ?? 1) <= 1"
        @click="goToPage((filters.page ?? 1) - 1)"
        title="Önceki sayfa"
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
        @click="goToPage((filters.page ?? 1) + 1)"
        title="Sonraki sayfa"
      >
        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  </div>
</template>
