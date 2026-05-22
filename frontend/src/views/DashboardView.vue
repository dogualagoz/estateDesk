<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { dashboardService, type DashboardStats } from '@/services/dashboard.service';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import GlobalSearch from '@/components/search/GlobalSearch.vue';

const router = useRouter();
const openAddModal = inject<() => void>('openAddModal');
const stats = ref<DashboardStats | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    stats.value = await dashboardService.stats();
  } finally {
    loading.value = false;
  }
});

function fmtPrice(p: string | number) {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR');
}
</script>

<template>
  <div class="page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Dashboard</h1>
        <p class="text-label-md text-on-surface-variant mt-1">Genel bakış ve özet performans</p>
      </div>
      <div class="flex items-stretch rounded-lg overflow-hidden shadow-sm">
        <button
          class="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-label-md font-semibold hover:bg-primary/90 transition-colors duration-150"
          @click="openAddModal?.()"
        >
          <span class="material-symbols-outlined text-[18px]">add</span>
          Yeni Ekle
        </button>
        <div class="w-px bg-on-primary/20" />
        <button
          class="flex items-center px-2.5 bg-primary text-on-primary hover:bg-primary/90 transition-colors duration-150"
          @click="openAddModal?.()"
          title="Seçenekleri gör"
        >
          <span class="material-symbols-outlined text-[18px]">expand_more</span>
        </button>
      </div>
    </div>

    <!-- Global Search Bar -->
    <div class="flex justify-center mb-gutter">
      <GlobalSearch />
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else-if="stats">
      <!-- Stat Cards -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-md md:gap-gutter mb-gutter">
        <div class="bg-surface border border-outline-variant shadow-sm rounded-xl p-stack-md flex flex-col gap-2 hover:shadow-md transition-shadow duration-200">
          <div class="flex justify-between items-start">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Toplam Portföy</span>
            <span class="material-symbols-outlined text-primary text-[22px]">maps_home_work</span>
          </div>
          <div class="text-headline-xl font-bold tracking-tight text-on-surface">{{ stats.portfolioCount }}</div>
        </div>
        <div class="bg-surface border border-outline-variant shadow-sm rounded-xl p-stack-md flex flex-col gap-2 hover:shadow-md transition-shadow duration-200">
          <div class="flex justify-between items-start">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Toplam Talep</span>
            <span class="material-symbols-outlined text-primary text-[22px]">ads_click</span>
          </div>
          <div class="text-headline-xl font-bold tracking-tight text-on-surface">{{ stats.demandCount }}</div>
        </div>
        <div class="bg-surface border border-outline-variant shadow-sm rounded-xl p-stack-md flex flex-col gap-2 hover:shadow-md transition-shadow duration-200">
          <div class="flex justify-between items-start">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Aktif Talep</span>
            <span class="material-symbols-outlined text-primary text-[22px]">radar</span>
          </div>
          <div class="text-headline-xl font-bold tracking-tight text-on-surface">{{ stats.activeDemandCount }}</div>
        </div>
      </section>

      <!-- Recent Cards -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <!-- Son Portföyler -->
        <div class="bg-surface border border-outline-variant shadow-sm rounded-xl overflow-hidden">
          <div class="px-stack-md py-stack-md border-b border-surface-variant flex justify-between items-center">
            <h2 class="text-body-lg font-semibold text-on-surface">Son Portföyler</h2>
            <button class="btn ghost text-[13px] gap-1 py-1" @click="router.push('/portfolio')">
              Tümünü Gör
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div v-if="stats.recentPortfolios.length" class="p-stack-md grid grid-cols-2 gap-stack-md">
            <div
              v-for="p in stats.recentPortfolios"
              :key="p.id"
              class="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-150"
              @click="router.push(`/portfolio/${p.id}`)"
            >
              <div class="flex items-center justify-between">
                <span class="tag primary text-[11px]">{{ PROPERTY_TYPE_LABELS[p.type] }}</span>
                <span class="material-symbols-outlined text-primary text-[18px]">maps_home_work</span>
              </div>
              <div class="text-label-md font-semibold text-on-surface leading-tight">{{ p.city }} / {{ p.district }}</div>
              <div class="text-label-md font-bold text-primary mt-auto">{{ fmtPrice(p.price) }}</div>
              <div class="text-label-sm text-on-surface-variant">{{ fmtDate(p.createdAt) }}</div>
            </div>
          </div>
          <div v-else class="empty">Kayıt yok</div>
        </div>

        <!-- Son Talepler -->
        <div class="bg-surface border border-outline-variant shadow-sm rounded-xl overflow-hidden">
          <div class="px-stack-md py-stack-md border-b border-surface-variant flex justify-between items-center">
            <h2 class="text-body-lg font-semibold text-on-surface">Son Talepler</h2>
            <button class="btn ghost text-[13px] gap-1 py-1" @click="router.push('/demand')">
              Tümünü Gör
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div v-if="stats.recentDemands.length" class="p-stack-md grid grid-cols-2 gap-stack-md">
            <div
              v-for="d in stats.recentDemands"
              :key="d.id"
              class="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-150"
              @click="router.push(`/demand/${d.id}`)"
            >
              <div class="flex items-center justify-between">
                <span class="tag text-[11px]">Talep</span>
                <span class="material-symbols-outlined text-primary text-[18px]">ads_click</span>
              </div>
              <div class="text-label-md font-semibold text-on-surface leading-tight">{{ d.customerName }}</div>
              <div class="text-label-sm text-on-surface-variant truncate">{{ d.regions.join(', ') || '—' }}</div>
              <div class="text-label-md font-bold text-primary mt-auto">
                <template v-if="d.minBudget || d.maxBudget">
                  {{ d.minBudget ? fmtPrice(d.minBudget) : '0' }} – {{ d.maxBudget ? fmtPrice(d.maxBudget) : '∞' }}
                </template>
                <template v-else>—</template>
              </div>
              <div class="text-label-sm text-on-surface-variant">{{ fmtDate(d.createdAt) }}</div>
            </div>
          </div>
          <div v-else class="empty">Kayıt yok</div>
        </div>
      </section>
    </template>
  </div>
</template>
