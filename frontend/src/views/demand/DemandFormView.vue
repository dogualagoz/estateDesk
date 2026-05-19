<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import type { CreateDemandPayload } from '@/types/demand';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, type PropertyType } from '@/types/portfolio';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);

const form = reactive({
  types: [] as PropertyType[],
  regionsText: '',
  minBudget: undefined as number | undefined,
  maxBudget: undefined as number | undefined,
  roomPreferencesText: '',
  featurePrefsText: '',
  note: '',
  customerName: '',
  customerPhone: '',
  status: 'ACTIVE' as 'ACTIVE' | 'CLOSED',
});

const error = ref<string | null>(null);
const saving = ref(false);

function toggleType(t: PropertyType) {
  const i = form.types.indexOf(t);
  if (i >= 0) form.types.splice(i, 1);
  else form.types.push(t);
}

onMounted(async () => {
  if (!isEdit.value) return;
  const d = await demandService.get(route.params.id as string);
  Object.assign(form, {
    types: d.types,
    regionsText: d.regions.join(', '),
    minBudget: d.minBudget ? Number(d.minBudget) : undefined,
    maxBudget: d.maxBudget ? Number(d.maxBudget) : undefined,
    roomPreferencesText: d.roomPreferences.join(', '),
    featurePrefsText: d.featurePrefs.join(', '),
    note: d.note ?? '',
    customerName: d.customerName,
    customerPhone: d.customerPhone,
    status: d.status,
  });
});

async function submit() {
  error.value = null;
  saving.value = true;
  try {
    const payload: CreateDemandPayload = {
      types: form.types,
      regions: form.regionsText.split(',').map((s) => s.trim()).filter(Boolean),
      minBudget: form.minBudget,
      maxBudget: form.maxBudget,
      roomPreferences: form.roomPreferencesText.split(',').map((s) => s.trim()).filter(Boolean),
      featurePrefs: form.featurePrefsText.split(',').map((s) => s.trim()).filter(Boolean),
      note: form.note || undefined,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      status: form.status,
    };

    if (isEdit.value) {
      await demandService.update(route.params.id as string, payload);
      router.push(`/demand/${route.params.id}`);
    } else {
      const created = await demandService.create(payload);
      router.push(`/demand/${created.id}`);
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Kaydetme başarısız';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>{{ isEdit ? 'Talep Düzenle' : 'Yeni Talep' }}</h1>
    </div>

    <form class="card" @submit.prevent="submit">
      <div class="row">
        <div class="field full">
          <label>Aranan türler *</label>
          <div class="row">
            <label v-for="t in PROPERTY_TYPES" :key="t" class="check">
              <input type="checkbox" :checked="form.types.includes(t)" @change="toggleType(t)" />
              {{ PROPERTY_TYPE_LABELS[t] }}
            </label>
          </div>
        </div>
        <div class="field full">
          <label>Tercih edilen bölgeler (virgülle) *</label>
          <input class="input" v-model="form.regionsText" placeholder="Kadıköy, Üsküdar, Ataşehir" required />
        </div>
        <div class="field">
          <label>Min bütçe</label>
          <input class="input" type="number" min="0" v-model.number="form.minBudget" />
        </div>
        <div class="field">
          <label>Max bütçe</label>
          <input class="input" type="number" min="0" v-model.number="form.maxBudget" />
        </div>
        <div class="field full">
          <label>Oda tercihleri (virgülle)</label>
          <input class="input" v-model="form.roomPreferencesText" placeholder="2+1, 3+1" />
        </div>
        <div class="field full">
          <label>Özellik tercihleri (virgülle)</label>
          <input class="input" v-model="form.featurePrefsText" placeholder="asansör, otopark" />
        </div>
        <div class="field">
          <label>Müşteri adı *</label>
          <input class="input" v-model="form.customerName" required />
        </div>
        <div class="field">
          <label>Telefon *</label>
          <input class="input" v-model="form.customerPhone" required />
        </div>
        <div class="field">
          <label>Durum</label>
          <select class="select" v-model="form.status">
            <option value="ACTIVE">Aktif</option>
            <option value="CLOSED">Kapandı</option>
          </select>
        </div>
        <div class="field full">
          <label>Not</label>
          <textarea class="textarea" v-model="form.note"></textarea>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="row" style="margin-top: 1rem;">
        <button class="btn primary" type="submit" :disabled="saving || !form.types.length">
          {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
        </button>
        <button class="btn" type="button" @click="router.back()">İptal</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.check { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.9rem; }
</style>
