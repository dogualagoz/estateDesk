<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import { PROPERTY_TYPE_LABELS, type Portfolio } from '@/types/portfolio';

const route = useRoute();
const router = useRouter();
const item = ref<Portfolio | null>(null);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    item.value = await portfolioService.get(route.params.id as string);
  } finally {
    loading.value = false;
  }
}

function fmtPrice(p: string | number) {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

async function remove() {
  if (!item.value) return;
  if (!confirm('Bu portföy silinsin mi?')) return;
  await portfolioService.remove(item.value.id);
  router.push('/portfolio');
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
            @click="router.push('/portfolio')"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 class="text-headline-lg-mobile md:text-headline-md font-semibold text-primary tracking-tight">
              {{ PROPERTY_TYPE_LABELS[item.type] }} — {{ item.city }} / {{ item.district }}
            </h1>
            <div class="flex items-center gap-2 mt-1">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold',
                  item.visibility === 'HIDDEN'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ item.visibility === 'HIDDEN' ? 'Gizli' : 'Açık' }}
              </span>
              <span class="text-label-sm text-on-surface-variant">
                {{ PROPERTY_TYPE_LABELS[item.type] }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn" @click="router.push(`/portfolio/${item.id}/edit`)">
            <span class="material-symbols-outlined text-[18px]">edit</span>
            Düzenle
          </button>
          <button class="btn danger" @click="remove">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            Sil
          </button>
        </div>
      </div>

      <!-- Detail Card -->
      <div class="card">
        <!-- Price highlight -->
        <div class="flex items-baseline gap-2 mb-gutter pb-gutter border-b border-outline-variant">
          <span class="text-headline-lg font-bold tracking-tight text-primary">{{ fmtPrice(item.price) }}</span>
          <span class="text-label-md text-on-surface-variant">• {{ item.areaSqm }} m²</span>
          <span v-if="item.roomCount" class="text-label-md text-on-surface-variant">• {{ item.roomCount }} oda</span>
        </div>

        <!-- Detail grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Tür</span>
            <div class="text-label-md font-medium text-on-surface">{{ PROPERTY_TYPE_LABELS[item.type] }}</div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Durum</span>
            <div>
              <span
                :class="[
                  'tag',
                  item.visibility === 'HIDDEN' ? 'danger' : 'success'
                ]"
              >
                {{ item.visibility === 'HIDDEN' ? 'Gizli' : 'Açık' }}
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Konum</span>
            <div class="text-label-md font-medium text-on-surface">
              {{ item.city }} / {{ item.district }}<span v-if="item.neighborhood"> / {{ item.neighborhood }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Alan (m²)</span>
            <div class="text-label-md font-medium text-on-surface">{{ item.areaSqm }} m²</div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Oda</span>
            <div class="text-label-md font-medium text-on-surface">{{ item.roomCount }}</div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Fiyat</span>
            <div class="text-label-md font-semibold text-primary">{{ fmtPrice(item.price) }}</div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Mal sahibi</span>
            <div class="text-label-md font-medium text-on-surface">{{ item.ownerName }}</div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Telefon</span>
            <div class="text-label-md font-medium text-on-surface">{{ item.ownerPhone }}</div>
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
            <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Etiketler</span>
            <div class="flex flex-wrap gap-2">
              <span v-for="f in item.features" :key="f" class="tag">{{ f }}</span>
              <span v-if="!item.features.length" class="text-label-md text-on-surface-variant">—</span>
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
