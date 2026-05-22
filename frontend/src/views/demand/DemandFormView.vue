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
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          @click="router.back()"
        >
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 class="text-headline-lg-mobile md:text-headline-md font-semibold text-on-surface tracking-tight">
          {{ isEdit ? 'Talep Düzenle' : 'Yeni Talep' }}
        </h1>
      </div>
    </div>

    <form class="card" @submit.prevent="submit">
      <div class="flex flex-wrap gap-stack-md">
        <!-- Property types checkboxes -->
        <div class="field full">
          <label>Aranan Türler *</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <label
              v-for="t in PROPERTY_TYPES"
              :key="t"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-label-md select-none',
                form.types.includes(t)
                  ? 'bg-primary-fixed text-on-primary-fixed-variant border-primary/30 font-medium'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
              ]"
            >
              <input
                type="checkbox"
                class="sr-only"
                :checked="form.types.includes(t)"
                @change="toggleType(t)"
              />
              <span class="material-symbols-outlined text-[16px]">{{ form.types.includes(t) ? 'check_box' : 'check_box_outline_blank' }}</span>
              {{ PROPERTY_TYPE_LABELS[t] }}
            </label>
          </div>
        </div>

        <div class="field full">
          <label>Tercih Edilen Bölgeler (virgülle) *</label>
          <input class="input" v-model="form.regionsText" placeholder="Kadıköy, Üsküdar, Ataşehir" required />
        </div>
        <div class="field">
          <label>Min Bütçe</label>
          <input class="input" type="number" min="0" v-model.number="form.minBudget" />
        </div>
        <div class="field">
          <label>Max Bütçe</label>
          <input class="input" type="number" min="0" v-model.number="form.maxBudget" />
        </div>
        <div class="field full">
          <label>Oda Tercihleri (virgülle)</label>
          <input class="input" v-model="form.roomPreferencesText" placeholder="2+1, 3+1" />
        </div>
        <div class="field full">
          <label>Özellik Tercihleri (virgülle)</label>
          <input class="input" v-model="form.featurePrefsText" placeholder="asansör, otopark" />
        </div>
        <div class="field">
          <label>Müşteri Adı *</label>
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
          <textarea class="textarea" v-model="form.note" rows="3"></textarea>
        </div>
      </div>

      <p v-if="error" class="error-msg mt-stack-md">{{ error }}</p>

      <div class="flex gap-3 mt-gutter pt-gutter border-t border-outline-variant">
        <button class="btn primary" type="submit" :disabled="saving || !form.types.length">
          <span class="material-symbols-outlined text-[18px]">{{ saving ? 'hourglass_empty' : 'save' }}</span>
          {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
        </button>
        <button class="btn" type="button" @click="router.back()">İptal</button>
      </div>
    </form>
  </div>
</template>
