<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, type CreatePortfolioPayload } from '@/types/portfolio';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);

const form = reactive<CreatePortfolioPayload & { featuresText: string }>({
  type: 'APARTMENT',
  city: '',
  district: '',
  neighborhood: '',
  areaSqm: 0,
  roomCount: '',
  price: 0,
  features: [],
  visibility: 'PUBLIC',
  note: '',
  ownerName: '',
  ownerPhone: '',
  featuresText: '',
});

const error = ref<string | null>(null);
const saving = ref(false);

onMounted(async () => {
  if (!isEdit.value) return;
  const p = await portfolioService.get(route.params.id as string);
  Object.assign(form, {
    type: p.type,
    city: p.city,
    district: p.district,
    neighborhood: p.neighborhood ?? '',
    areaSqm: p.areaSqm,
    roomCount: p.roomCount,
    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    features: p.features,
    visibility: p.visibility,
    note: p.note ?? '',
    ownerName: p.ownerName,
    ownerPhone: p.ownerPhone,
    featuresText: p.features.join(', '),
  });
});

async function submit() {
  error.value = null;
  saving.value = true;
  try {
    const payload: CreatePortfolioPayload = {
      type: form.type,
      city: form.city,
      district: form.district,
      neighborhood: form.neighborhood || undefined,
      areaSqm: Number(form.areaSqm),
      roomCount: form.roomCount,
      price: Number(form.price),
      features: form.featuresText.split(',').map((s) => s.trim()).filter(Boolean),
      visibility: form.visibility,
      note: form.note || undefined,
      ownerName: form.ownerName,
      ownerPhone: form.ownerPhone,
    };

    if (isEdit.value) {
      await portfolioService.update(route.params.id as string, payload);
      router.push(`/portfolio/${route.params.id}`);
    } else {
      const created = await portfolioService.create(payload);
      router.push(`/portfolio/${created.id}`);
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
      <h1>{{ isEdit ? 'Portföy Düzenle' : 'Yeni Portföy' }}</h1>
    </div>

    <form class="card" @submit.prevent="submit">
      <div class="row">
        <div class="field">
          <label>Tür *</label>
          <select class="select" v-model="form.type">
            <option v-for="t in PROPERTY_TYPES" :key="t" :value="t">{{ PROPERTY_TYPE_LABELS[t] }}</option>
          </select>
        </div>
        <div class="field">
          <label>Durum</label>
          <select class="select" v-model="form.visibility">
            <option value="PUBLIC">Açık (ilanda)</option>
            <option value="HIDDEN">Gizli</option>
          </select>
        </div>
        <div class="field">
          <label>İl *</label>
          <input class="input" v-model="form.city" required />
        </div>
        <div class="field">
          <label>İlçe *</label>
          <input class="input" v-model="form.district" required />
        </div>
        <div class="field">
          <label>Mahalle</label>
          <input class="input" v-model="form.neighborhood" />
        </div>
        <div class="field">
          <label>m² *</label>
          <input class="input" type="number" min="0" v-model.number="form.areaSqm" required />
        </div>
        <div class="field">
          <label>Oda *</label>
          <input class="input" v-model="form.roomCount" placeholder="2+1" required />
        </div>
        <div class="field">
          <label>Fiyat (₺) *</label>
          <input class="input" type="number" min="0" v-model.number="form.price" required />
        </div>
        <div class="field full">
          <label>Etiketler (virgülle)</label>
          <input class="input" v-model="form.featuresText" placeholder="asansör, otopark, eşyalı" />
        </div>
        <div class="field">
          <label>Mal sahibi adı *</label>
          <input class="input" v-model="form.ownerName" required />
        </div>
        <div class="field">
          <label>Telefon *</label>
          <input class="input" v-model="form.ownerPhone" required />
        </div>
        <div class="field full">
          <label>Not</label>
          <textarea class="textarea" v-model="form.note"></textarea>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="row" style="margin-top: 1rem;">
        <button class="btn primary" type="submit" :disabled="saving">
          {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
        </button>
        <button class="btn" type="button" @click="router.back()">İptal</button>
      </div>
    </form>
  </div>
</template>
