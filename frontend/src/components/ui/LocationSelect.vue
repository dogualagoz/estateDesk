<script setup lang="ts">
import { computed, watch } from 'vue';
import LocationDropdown from './LocationDropdown.vue';
import {
  getCityNames,
  getDistrictNames,
  getNeighborhoods,
  getGroupedNeighborhoods,
} from '@/data/tr-locations';

/**
 * İl → İlçe → Mahalle kaskadı. İki mod:
 * - single (varsayılan): il/ilçe/mahalle tekli seçim (portföy formu)
 * - multi: ilçe/mahalle çoklu seçim, mahalleler ilçeye göre gruplu (talep formu)
 *
 * Kaskad temizliği geçerlilik bazlıdır: üst seçim değişince alt seçimlerden
 * yalnızca artık geçersiz olanlar elenir. (Körlemesine sıfırlama, edit modunda
 * kayıtlı ilçe/mahallenin kaybolmasına yol açıyordu.)
 */
const props = withDefaults(
  defineProps<{
    /** Çoklu ilçe/mahalle seçimi (talep formu). */
    multi?: boolean;
    /** İl + ilçe yan yana (2 sütun) yerleşsin (portföy formu). */
    compact?: boolean;
    /** İl etiketinin yanındaki ipucu metni. */
    cityHint?: string;
    /** İpucu vurgu rengi hata (kırmızı) olsun mu. */
    cityHintError?: boolean;
    districtHint?: string;
    neighborhoodHint?: string;
  }>(),
  {
    multi: false,
    compact: false,
    cityHint: '',
    cityHintError: false,
    districtHint: '',
    neighborhoodHint: '',
  },
);

const city = defineModel<string>('city', { default: '' });
// single mod modelleri
const district = defineModel<string>('district', { default: '' });
const neighborhood = defineModel<string>('neighborhood', { default: '' });
// multi mod modelleri
const districts = defineModel<string[]>('districts', { default: () => [] });
const neighborhoods = defineModel<string[]>('neighborhoods', { default: () => [] });

const cityOptions = computed(() => getCityNames());
const districtOptions = computed(() => (city.value ? getDistrictNames(city.value) : []));

// single mod: seçili ilçenin mahalleleri
const neighborhoodOptions = computed(() =>
  !props.multi && city.value && district.value
    ? getNeighborhoods(city.value, district.value)
    : [],
);

// multi mod: seçili ilçelere göre gruplu mahalleler
const groupedNeighborhoodOptions = computed(() =>
  props.multi && city.value && districts.value.length
    ? getGroupedNeighborhoods(city.value, districts.value).map((g) => ({
        group: g.district,
        items: g.neighborhoods,
      }))
    : [],
);

// ── Kaskad temizliği (geçerlilik bazlı) ──
watch(city, () => {
  if (props.multi) {
    districts.value = districts.value.filter((d) => districtOptions.value.includes(d));
  } else if (district.value && !districtOptions.value.includes(district.value)) {
    district.value = '';
    neighborhood.value = '';
  }
});

watch(
  [districts, () => city.value],
  () => {
    if (!props.multi) return;
    // Seçili mahallelerden artık geçersiz olanları temizle
    const all = groupedNeighborhoodOptions.value.flatMap((g) => g.items);
    neighborhoods.value = neighborhoods.value.filter((n) => all.includes(n));
  },
  { deep: true },
);

watch(district, () => {
  if (props.multi) return;
  if (neighborhood.value && !neighborhoodOptions.value.includes(neighborhood.value)) {
    neighborhood.value = '';
  }
});
</script>

<template>
  <div class="space-y-3">
    <div :class="compact ? 'grid grid-cols-2 gap-3' : 'space-y-3'">
      <div class="flex flex-col gap-1.5">
        <label class="text-label-sm font-semibold text-on-surface-variant">
          İl
          <span
            v-if="cityHint"
            :class="cityHintError ? 'text-error' : 'font-normal text-on-surface-variant/60 ml-1'"
          >{{ cityHint }}</span>
        </label>
        <LocationDropdown v-model="city" :options="cityOptions" placeholder="İl seçin..." />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-label-sm font-semibold text-on-surface-variant">
          İlçe
          <span v-if="districtHint" class="font-normal text-on-surface-variant/60 ml-1">{{ districtHint }}</span>
        </label>
        <LocationDropdown
          v-if="multi"
          v-model="districts"
          :options="districtOptions"
          :multi="true"
          :disabled="!city"
          placeholder="İlçe seçin..."
        />
        <LocationDropdown
          v-else
          v-model="district"
          :options="districtOptions"
          :disabled="!city"
          placeholder="İlçe seçin..."
        />
      </div>
    </div>

    <!-- Mahalle: multi modda ilçe seçilince görünür; single modda hep görünür -->
    <div
      v-if="multi ? districts.length && groupedNeighborhoodOptions.length : true"
      class="flex flex-col gap-1.5"
    >
      <label class="text-label-sm font-semibold text-on-surface-variant">
        Mahalle
        <span v-if="neighborhoodHint" class="font-normal text-on-surface-variant/60 ml-1">{{ neighborhoodHint }}</span>
      </label>
      <LocationDropdown
        v-if="multi"
        v-model="neighborhoods"
        :grouped-options="groupedNeighborhoodOptions"
        :multi="true"
        placeholder="Mahalle seçin..."
      />
      <LocationDropdown
        v-else
        v-model="neighborhood"
        :options="neighborhoodOptions"
        :disabled="!district"
        placeholder="Mahalle seçin..."
      />
    </div>
  </div>
</template>
