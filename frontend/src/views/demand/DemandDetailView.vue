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
      <div class="page-header">
        <h1>{{ item.customerName }}</h1>
        <div class="row">
          <button class="btn" @click="router.push(`/demand/${item.id}/edit`)">Düzenle</button>
          <button class="btn danger" @click="remove">Sil</button>
        </div>
      </div>

      <div class="card detail-grid">
        <div><span class="muted">Telefon</span><div>{{ item.customerPhone }}</div></div>
        <div><span class="muted">Durum</span>
          <div>
            <span :class="['tag', item.status === 'ACTIVE' ? 'success' : 'danger']">
              {{ DEMAND_STATUS_LABELS[item.status] }}
            </span>
          </div>
        </div>
        <div><span class="muted">Bütçe</span><div>{{ fmtPrice(item.minBudget) }} - {{ fmtPrice(item.maxBudget) }}</div></div>
        <div class="full">
          <span class="muted">Aranan türler</span>
          <div>
            <span v-for="t in item.types" :key="t" class="tag primary">{{ PROPERTY_TYPE_LABELS[t] }}</span>
            <span v-if="!item.types.length" class="muted">—</span>
          </div>
        </div>
        <div class="full">
          <span class="muted">Bölgeler</span>
          <div>
            <span v-for="r in item.regions" :key="r" class="tag">{{ r }}</span>
            <span v-if="!item.regions.length" class="muted">—</span>
          </div>
        </div>
        <div class="full">
          <span class="muted">Oda tercihleri</span>
          <div>
            <span v-for="r in item.roomPreferences" :key="r" class="tag">{{ r }}</span>
            <span v-if="!item.roomPreferences.length" class="muted">—</span>
          </div>
        </div>
        <div class="full">
          <span class="muted">Özellik tercihleri</span>
          <div>
            <span v-for="f in item.featurePrefs" :key="f" class="tag">{{ f }}</span>
            <span v-if="!item.featurePrefs.length" class="muted">—</span>
          </div>
        </div>
        <div class="full">
          <span class="muted">Not</span>
          <div style="white-space: pre-wrap;">{{ item.note || '—' }}</div>
        </div>
        <div><span class="muted">Ekleyen</span><div>{{ item.createdBy?.fullName || '—' }}</div></div>
        <div><span class="muted">Tarih</span><div>{{ new Date(item.createdAt).toLocaleString('tr-TR') }}</div></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.detail-grid .full { grid-column: 1 / -1; }
@media (max-width: 800px) { .detail-grid { grid-template-columns: 1fr 1fr; } }
</style>
