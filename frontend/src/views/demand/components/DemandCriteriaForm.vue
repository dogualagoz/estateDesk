<script setup lang="ts">
import { ref, toRef } from 'vue';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  ROOM_OPTIONS,
  FEATURE_PRESETS,
  type PropertyType,
} from '@/types/portfolio';
import LocationSelect from '@/components/ui/LocationSelect.vue';
import { useCurrencyInput } from '@/composables/useCurrencyInput';
import { useDemandForm } from '../demand-form-context';

/**
 * Talep formunun sol paneli: mülk/ilan tipi, konum, bütçe, oda,
 * olmazsa olmaz & bonus özellikler ve müşteri bilgileri.
 * Form state'i ana view'dan provide/inject ile gelir.
 */
defineProps<{
  /** Kaydetme hatası (ana view'ın submit'inden). */
  error?: string | null;
  /** Düzenleme modunda durum (Aktif/Kapandı) seçimi gösterilir. */
  isEdit: boolean;
}>();

const form = useDemandForm();

const customMust = ref('');
const customBonus = ref('');

// TR binlik ayraçlı bütçe girişleri (raw-yazım, blur'da biçimlendirme)
const minBudget = useCurrencyInput(toRef(form, 'minBudget'));
const maxBudget = useCurrencyInput(toRef(form, 'maxBudget'));

function toggleType(t: PropertyType) {
  const i = form.types.indexOf(t);
  if (i >= 0) form.types.splice(i, 1);
  else form.types.push(t);
}
function toggleRoom(r: string) {
  const i = form.rooms.indexOf(r);
  if (i >= 0) form.rooms.splice(i, 1);
  else form.rooms.push(r);
}
// Bir özellik ya "olmazsa olmaz" ya "bonus" olabilir — diğer listeden düşürülür
function toggleMustHave(f: string) {
  const i = form.mustHaveFeatures.indexOf(f);
  if (i >= 0) {
    form.mustHaveFeatures.splice(i, 1);
  } else {
    form.mustHaveFeatures.push(f);
    const j = form.bonusFeatures.indexOf(f);
    if (j >= 0) form.bonusFeatures.splice(j, 1);
  }
}
function toggleBonus(f: string) {
  const i = form.bonusFeatures.indexOf(f);
  if (i >= 0) {
    form.bonusFeatures.splice(i, 1);
  } else {
    form.bonusFeatures.push(f);
    const j = form.mustHaveFeatures.indexOf(f);
    if (j >= 0) form.mustHaveFeatures.splice(j, 1);
  }
}
function addCustomMust() {
  const v = customMust.value.trim();
  if (v && !form.mustHaveFeatures.includes(v)) toggleMustHave(v);
  customMust.value = '';
}
function addCustomBonus() {
  const v = customBonus.value.trim();
  if (v && !form.bonusFeatures.includes(v)) toggleBonus(v);
  customBonus.value = '';
}
</script>

<template>
  <div class="flex-1 overflow-y-auto px-4 md:px-7 py-6 space-y-4">
    <!-- Tip & ilan tipi -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
      <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Mülk & İlan Tipi</p>
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="t in PROPERTY_TYPES" :key="t" type="button" class="px-3 py-2 rounded-lg border-2 text-label-md font-medium transition-all duration-150"
          :class="form.types.includes(t)
            ? 'border-primary bg-primary-fixed/60 text-on-surface'
            : 'border-outline-variant text-on-surface-variant hover:border-primary/50'"
          @click="toggleType(t)"
        >{{ PROPERTY_TYPE_LABELS[t] }}</button>
      </div>
      <div class="flex gap-3">
        <button
          type="button" class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all"
          :class="form.listingType === 'SALE' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-outline-variant hover:border-primary/60'"
          @click="form.listingType = 'SALE'">
          {{ LISTING_TYPE_LABELS.SALE }}
        </button>
        <button
          type="button" class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all"
          :class="form.listingType === 'RENT' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-outline-variant hover:border-primary/60'"
          @click="form.listingType = 'RENT'">
          {{ LISTING_TYPE_LABELS.RENT }}
        </button>
      </div>
    </div>

    <!-- Konum -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
      <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Konum</p>
      <LocationSelect
        v-model:city="form.city"
        v-model:districts="form.districts"
        v-model:neighborhoods="form.neighborhoods"
        multi
        city-hint="(zorunlu filtre)"
        city-hint-error
        district-hint="(çoklu seçim)"
        neighborhood-hint="(çoklu seçim, isteğe bağlı)"
      />
    </div>

    <!-- Bütçe & m² -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
      <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Bütçe & Metrekare</p>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-label-sm font-semibold text-on-surface-variant">Min Bütçe</label>
          <input
            class="input" type="text" inputmode="numeric" :value="minBudget.display.value"
            placeholder="₺"
            @focus="minBudget.onFocus"
            @input="minBudget.onInput"
            @blur="minBudget.onBlur" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-label-sm font-semibold text-on-surface-variant">Max Bütçe <span class="text-error">(+%10 esneme)</span></label>
          <input
            class="input" type="text" inputmode="numeric" :value="maxBudget.display.value"
            placeholder="₺"
            @focus="maxBudget.onFocus"
            @input="maxBudget.onInput"
            @blur="maxBudget.onBlur" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-label-sm font-semibold text-on-surface-variant">Min m²</label>
          <input v-model.number="form.minArea" class="input" type="number" min="0" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-label-sm font-semibold text-on-surface-variant">Max m²</label>
          <input v-model.number="form.maxArea" class="input" type="number" min="0" />
        </div>
      </div>
    </div>

    <!-- Oda -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
      <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Oda Sayısı</p>
      <p class="text-label-sm text-on-surface-variant/60 mb-3">En küçük seçim alt sınır (zorunlu); yakın odalar kısmi puan alır.</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="r in ROOM_OPTIONS" :key="r" type="button" class="px-4 py-2 rounded-lg text-label-md border-2 font-medium transition-all"
          :class="form.rooms.includes(r) ? 'bg-primary text-on-primary border-primary' : 'text-on-surface border-outline-variant hover:border-primary/60'"
          @click="toggleRoom(r)"
        >{{ r }}</button>
      </div>
    </div>

    <!-- Olmazsa olmaz (sert filtre) -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
      <p class="text-label-sm font-semibold uppercase tracking-widest text-error mb-1">Olmazsa Olmaz Özellikler</p>
      <p class="text-label-sm text-on-surface-variant/60 mb-3">Bunları taşımayan portföyler elenir (sert filtre).</p>
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="f in FEATURE_PRESETS" :key="f" type="button" class="px-3 py-1.5 rounded-full text-label-sm border-2 transition-all"
          :class="form.mustHaveFeatures.includes(f) ? 'bg-error-container text-on-error-container border-error/40 font-medium' : 'text-on-surface-variant border-outline-variant hover:border-error/40'"
          @click="toggleMustHave(f)"
        >{{ f }}</button>
      </div>
      <div class="flex gap-2">
        <input v-model="customMust" class="input flex-1" placeholder="Özel zorunlu özellik..." @keydown.enter.prevent="addCustomMust" />
        <button type="button" class="btn" @click="addCustomMust"><span class="material-symbols-outlined text-[16px]">add</span></button>
      </div>
    </div>

    <!-- Bonus (skorlanır) -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
      <p class="text-label-sm font-semibold uppercase tracking-widest text-primary mb-1">Bonus Tercihler</p>
      <p class="text-label-sm text-on-surface-variant/60 mb-3">Skoru artırır; eksikliği eler değil.</p>
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="f in FEATURE_PRESETS" :key="f" type="button" class="px-3 py-1.5 rounded-full text-label-sm border-2 transition-all"
          :class="form.bonusFeatures.includes(f) ? 'bg-primary-fixed text-on-primary-fixed-variant border-primary/40 font-medium' : 'text-on-surface-variant border-outline-variant hover:border-primary/40'"
          @click="toggleBonus(f)"
        >{{ f }}</button>
      </div>
      <div class="flex gap-2">
        <input v-model="customBonus" class="input flex-1" placeholder="Özel bonus özellik..." @keydown.enter.prevent="addCustomBonus" />
        <button type="button" class="btn" @click="addCustomBonus"><span class="material-symbols-outlined text-[16px]">add</span></button>
      </div>
    </div>

    <!-- Müşteri -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
      <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Müşteri</p>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-label-sm font-semibold text-on-surface-variant">Ad *</label>
          <input v-model="form.customerName" class="input" placeholder="İsim Soyisim" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-label-sm font-semibold text-on-surface-variant">Telefon *</label>
          <input v-model="form.customerPhone" class="input" placeholder="05XX XXX XX XX" />
        </div>
      </div>
      <textarea v-model="form.note" class="textarea" rows="2" placeholder="Not (isteğe bağlı)" />
      <div v-if="isEdit" class="flex items-center gap-3 mt-3">
        <label class="text-label-sm font-semibold text-on-surface-variant">Durum</label>
        <select v-model="form.status" class="select">
          <option value="ACTIVE">Aktif</option>
          <option value="CLOSED">Kapandı</option>
        </select>
      </div>
    </div>

    <p v-if="error" class="px-4 py-2.5 rounded-lg bg-error-container text-on-error-container text-label-md">{{ error }}</p>
  </div>
</template>
