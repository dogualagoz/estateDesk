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
      <div class="page-header">
        <h1>{{ PROPERTY_TYPE_LABELS[item.type] }} — {{ item.city }} / {{ item.district }}</h1>
        <div class="row">
          <button class="btn" @click="router.push(`/portfolio/${item.id}/edit`)">Düzenle</button>
          <button class="btn danger" @click="remove">Sil</button>
        </div>
      </div>

      <div class="card detail-grid">
        <div><span class="muted">Tür</span><div>{{ PROPERTY_TYPE_LABELS[item.type] }}</div></div>
        <div><span class="muted">Durum</span>
          <div>
            <span :class="['tag', item.visibility === 'HIDDEN' ? 'danger' : 'success']">
              {{ item.visibility === 'HIDDEN' ? 'Gizli' : 'Açık' }}
            </span>
          </div>
        </div>
        <div><span class="muted">Konum</span><div>{{ item.city }} / {{ item.district }}<span v-if="item.neighborhood"> / {{ item.neighborhood }}</span></div></div>
        <div><span class="muted">m²</span><div>{{ item.areaSqm }}</div></div>
        <div><span class="muted">Oda</span><div>{{ item.roomCount }}</div></div>
        <div><span class="muted">Fiyat</span><div>{{ fmtPrice(item.price) }}</div></div>
        <div><span class="muted">Mal sahibi</span><div>{{ item.ownerName }}</div></div>
        <div><span class="muted">Telefon</span><div>{{ item.ownerPhone }}</div></div>
        <div class="full">
          <span class="muted">Etiketler</span>
          <div>
            <span v-for="f in item.features" :key="f" class="tag">{{ f }}</span>
            <span v-if="!item.features.length" class="muted">—</span>
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
