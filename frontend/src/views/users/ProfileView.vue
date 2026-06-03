<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usersService } from '@/services/users.service';
import { portfolioService } from '@/services/portfolio.service';
import { demandService } from '@/services/demand.service';
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, type Portfolio } from '@/types/portfolio';
import { DEMAND_STATUS_LABELS, type Demand } from '@/types/demand';
import type { UserProfile } from '@/types/user';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const profile = ref<UserProfile | null>(null);
const portfolios = ref<Portfolio[]>([]);
const demands = ref<Demand[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const tab = ref<'portfolios' | 'demands'>('portfolios');

const isSelf = computed(() => profile.value?.id === auth.user?.id);

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function fmtPrice(p: string | number) {
  return Number(p).toLocaleString('tr-TR');
}

async function load(id: string) {
  loading.value = true;
  error.value = null;
  try {
    const [p, pf, dm] = await Promise.all([
      usersService.getProfile(id),
      portfolioService.list({ createdById: id, pageSize: 100 }),
      demandService.list({ createdById: id, pageSize: 100 }),
    ]);
    profile.value = p;
    portfolios.value = pf.items;
    demands.value = dm.items;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Profil yüklenemedi';
  } finally {
    loading.value = false;
  }
}

function logout() {
  auth.logout();
  router.push('/login');
}

onMounted(() => load(route.params.id as string));
watch(() => route.params.id, (id) => id && load(id as string));
</script>

<template>
  <div class="page">
    <button class="btn ghost mb-stack-md -ml-2" @click="router.back()">
      <span class="material-symbols-outlined text-[18px]">arrow_back</span>
      Geri
    </button>

    <div v-if="loading" class="empty">Yükleniyor…</div>
    <div v-else-if="error" class="empty">{{ error }}</div>

    <template v-else-if="profile">
      <!-- Profil başlığı -->
      <div class="card flex items-center gap-4 mb-gutter">
        <div class="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[20px] font-bold shrink-0">
          {{ initials(profile.fullName) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-headline-md font-semibold text-on-surface">{{ profile.fullName }}</h1>
            <span class="tag" :class="profile.role === 'ADMIN' ? 'primary' : ''">
              {{ profile.role === 'ADMIN' ? 'Yönetici' : 'Danışman' }}
            </span>
            <span v-if="isSelf" class="tag">Siz</span>
          </div>
          <p class="text-label-md text-on-surface-variant mt-1">{{ profile.email }}</p>
          <p class="text-label-md text-on-surface-variant mt-1">
            {{ profile.portfolioCount }} portföy · {{ profile.demandCount }} talep
          </p>
        </div>
        <!-- Mobilde çıkış (masaüstünde sidebar'da var) -->
        <button
          v-if="isSelf"
          class="btn ghost danger md:hidden shrink-0 self-start"
          title="Çıkış Yap"
          @click="logout"
        >
          <span class="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>

      <!-- Sekmeler -->
      <div class="flex gap-1 border-b border-outline-variant mb-gutter">
        <button
          class="px-4 py-2.5 text-label-md font-medium border-b-2 -mb-px transition-colors"
          :class="tab === 'portfolios' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'"
          @click="tab = 'portfolios'"
        >
          Portföyler ({{ portfolios.length }})
        </button>
        <button
          class="px-4 py-2.5 text-label-md font-medium border-b-2 -mb-px transition-colors"
          :class="tab === 'demands' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'"
          @click="tab = 'demands'"
        >
          Talepler ({{ demands.length }})
        </button>
      </div>

      <!-- Portföyler -->
      <div v-if="tab === 'portfolios'" class="flex flex-col gap-stack-sm">
        <div v-if="!portfolios.length" class="empty">Henüz portföy yok</div>
        <router-link
          v-for="p in portfolios"
          :key="p.id"
          :to="`/portfolio/${p.id}`"
          class="card flex items-center gap-4 hover:border-primary transition-colors"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-on-surface truncate">{{ p.title || PROPERTY_TYPE_LABELS[p.type] }}</span>
              <span class="tag">{{ LISTING_TYPE_LABELS[p.listingType] }}</span>
              <span v-if="p.visibility === 'HIDDEN'" class="tag">İlansız</span>
            </div>
            <p class="text-label-sm text-on-surface-variant mt-0.5">
              {{ p.city }} / {{ p.district }} · {{ p.roomCount }} · {{ p.areaSqm }} m²
            </p>
          </div>
          <span class="font-semibold text-primary whitespace-nowrap">{{ fmtPrice(p.price) }} ₺</span>
        </router-link>
      </div>

      <!-- Talepler -->
      <div v-else class="flex flex-col gap-stack-sm">
        <div v-if="!demands.length" class="empty">Henüz talep yok</div>
        <router-link
          v-for="d in demands"
          :key="d.id"
          :to="`/demand/${d.id}`"
          class="card flex items-center gap-4 hover:border-primary transition-colors"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-on-surface truncate">{{ d.customerName }}</span>
              <span class="tag">{{ LISTING_TYPE_LABELS[d.listingType] }}</span>
              <span class="tag" :class="d.status === 'ACTIVE' ? 'success' : ''">{{ DEMAND_STATUS_LABELS[d.status] }}</span>
            </div>
            <p class="text-label-sm text-on-surface-variant mt-0.5">
              {{ d.types.map((t) => PROPERTY_TYPE_LABELS[t]).join(', ') || '—' }}
              <template v-if="d.city"> · {{ d.city }}</template>
            </p>
          </div>
          <span v-if="d.maxBudget" class="font-semibold text-primary whitespace-nowrap">
            ≤ {{ fmtPrice(d.maxBudget) }} ₺
          </span>
        </router-link>
      </div>
    </template>
  </div>
</template>
