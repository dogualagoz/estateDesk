<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import { matchingService } from '@/services/matching.service';
import type { CreateDemandPayload, DemandStatus } from '@/types/demand';
import type { MatchCriteria, ScoredPortfolio, DimensionKey } from '@/types/matching';
import { DIMENSION_LABELS } from '@/types/matching';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  ROOM_OPTIONS,
  FEATURE_PRESETS,
  type ListingType,
  type PropertyType,
} from '@/types/portfolio';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);

const form = reactive({
  types: [] as PropertyType[],
  listingType: 'SALE' as ListingType,
  city: '',
  district: '',
  neighborhood: '',
  minBudget: undefined as number | undefined,
  maxBudget: undefined as number | undefined,
  rooms: [] as string[],
  minArea: undefined as number | undefined,
  maxArea: undefined as number | undefined,
  mustHaveFeatures: [] as string[],
  bonusFeatures: [] as string[],
  note: '',
  customerName: '',
  customerPhone: '',
  status: 'ACTIVE' as DemandStatus,
});

const error = ref<string | null>(null);
const saving = ref(false);
const removing = ref(false);
const customMust = ref('');
const customBonus = ref('');

async function remove() {
  if (!isEdit.value) return;
  if (!confirm('Bu talep silinsin mi?')) return;
  removing.value = true;
  try {
    await demandService.remove(route.params.id as string);
    router.push('/demand');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Silme başarısız';
  } finally {
    removing.value = false;
  }
}

// ── Sol panel etkileşimleri ──
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

// ── Kriterler → canlı eşleştirme ──
const criteria = computed<MatchCriteria>(() => ({
  types: form.types.length ? form.types : undefined,
  listingType: form.listingType,
  city: form.city.trim() || undefined,
  district: form.district.trim() || undefined,
  neighborhood: form.neighborhood.trim() || undefined,
  minBudget: form.minBudget,
  maxBudget: form.maxBudget,
  roomPreferences: form.rooms.length ? form.rooms : undefined,
  minArea: form.minArea,
  maxArea: form.maxArea,
  mustHaveFeatures: form.mustHaveFeatures.length ? form.mustHaveFeatures : undefined,
  bonusFeatures: form.bonusFeatures.length ? form.bonusFeatures : undefined,
}));

const results = ref<ScoredPortfolio[]>([]);
const loading = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function fetchMatches() {
  loading.value = true;
  try {
    results.value = await matchingService.matchPortfolios(criteria.value);
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}
function scheduleFetch() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(fetchMatches, 300);
}
watch(criteria, scheduleFetch, { deep: true });
onBeforeUnmount(() => timer && clearTimeout(timer));

// ── Kart yardımcıları ──
function fmtPrice(p: string | number) {
  return '₺' + Number(p).toLocaleString('tr-TR');
}
function locationOf(p: ScoredPortfolio['portfolio']) {
  return [p.neighborhood, p.district, p.city].filter(Boolean).join(', ');
}
function scoreBadgeClass(s: number) {
  if (s >= 80) return 'bg-primary text-on-primary';
  if (s >= 60) return 'bg-primary-fixed text-on-primary-fixed-variant';
  return 'bg-surface-container text-on-surface-variant';
}
function dimLabel(k: DimensionKey) {
  return DIMENSION_LABELS[k];
}
function barColor(score: number) {
  return score >= 0.6 ? 'bg-primary' : score >= 0.3 ? 'bg-tertiary-container' : 'bg-error';
}
const activeBreakdown = (r: ScoredPortfolio) => r.breakdown.filter((b) => b.active);

// ── Yükleme (edit) ──
onMounted(async () => {
  if (isEdit.value) {
    const d = await demandService.get(route.params.id as string);
    Object.assign(form, {
      types: d.types,
      listingType: d.listingType ?? 'SALE',
      city: d.city ?? '',
      district: d.district ?? (d.regions?.[0] ?? ''),
      neighborhood: d.neighborhood ?? '',
      minBudget: d.minBudget != null ? Number(d.minBudget) : undefined,
      maxBudget: d.maxBudget != null ? Number(d.maxBudget) : undefined,
      rooms: [...(d.roomPreferences ?? [])],
      minArea: d.minArea ?? undefined,
      maxArea: d.maxArea ?? undefined,
      mustHaveFeatures: [...(d.mustHaveFeatures ?? [])],
      bonusFeatures: [...(d.bonusFeatures ?? d.featurePrefs ?? [])],
      note: d.note ?? '',
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      status: d.status,
    });
  }
  fetchMatches();
});

const canSubmit = computed(
  () => form.types.length > 0 && form.customerName.trim() !== '' && form.customerPhone.trim() !== '',
);

async function submit() {
  error.value = null;
  saving.value = true;
  try {
    const payload: CreateDemandPayload = {
      types: form.types,
      listingType: form.listingType,
      city: form.city.trim() || undefined,
      district: form.district.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      regions: [form.district.trim(), form.neighborhood.trim()].filter(Boolean),
      minBudget: form.minBudget,
      maxBudget: form.maxBudget,
      roomPreferences: form.rooms,
      minArea: form.minArea,
      maxArea: form.maxArea,
      mustHaveFeatures: form.mustHaveFeatures,
      bonusFeatures: form.bonusFeatures,
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
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 flex items-center gap-3 px-8 py-5 border-b border-outline-variant bg-surface">
      <button
        class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div>
        <h1 class="text-headline-md font-semibold text-on-surface tracking-tight">
          {{ isEdit ? 'Talep Düzenle' : 'Yeni Talep' }}
        </h1>
        <p class="text-label-md text-on-surface-variant mt-0.5">
          Kriterleri girin — uyan portföyler sağda anlık skorlanır.
        </p>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- ── SOL: Kriterler ── -->
      <div class="w-[42%] border-r border-outline-variant flex flex-col overflow-hidden bg-surface-container/30">
        <div class="flex-1 overflow-y-auto px-7 py-6 space-y-4">
          <!-- Tip & ilan tipi -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Mülk & İlan Tipi</p>
            <div class="flex flex-wrap gap-2 mb-4">
              <button
                v-for="t in PROPERTY_TYPES" :key="t" type="button" @click="toggleType(t)"
                class="px-3 py-2 rounded-lg border-2 text-label-md font-medium transition-all duration-150"
                :class="form.types.includes(t)
                  ? 'border-primary bg-primary-fixed/60 text-on-surface'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary/50'"
              >{{ PROPERTY_TYPE_LABELS[t] }}</button>
            </div>
            <div class="flex gap-3">
              <button type="button" @click="form.listingType = 'SALE'"
                class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all"
                :class="form.listingType === 'SALE' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-outline-variant hover:border-primary/60'">
                {{ LISTING_TYPE_LABELS.SALE }}
              </button>
              <button type="button" @click="form.listingType = 'RENT'"
                class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all"
                :class="form.listingType === 'RENT' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-outline-variant hover:border-primary/60'">
                {{ LISTING_TYPE_LABELS.RENT }}
              </button>
            </div>
          </div>

          <!-- Konum -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Konum</p>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-label-sm font-semibold text-on-surface-variant">İl <span class="text-error">(zorunlu filtre)</span></label>
                  <input class="input" v-model="form.city" placeholder="Antalya" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-label-sm font-semibold text-on-surface-variant">İlçe</label>
                  <input class="input" v-model="form.district" placeholder="Konyaaltı" />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Mahalle <span class="font-normal text-on-surface-variant/60">(isteğe bağlı)</span></label>
                <input class="input" v-model="form.neighborhood" placeholder="Liman" />
              </div>
            </div>
          </div>

          <!-- Bütçe & m² -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Bütçe & Metrekare</p>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Min Bütçe</label>
                <input class="input" type="number" min="0" v-model.number="form.minBudget" placeholder="₺" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Max Bütçe <span class="text-error">(+%10 esneme)</span></label>
                <input class="input" type="number" min="0" v-model.number="form.maxBudget" placeholder="₺" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Min m²</label>
                <input class="input" type="number" min="0" v-model.number="form.minArea" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Max m²</label>
                <input class="input" type="number" min="0" v-model.number="form.maxArea" />
              </div>
            </div>
          </div>

          <!-- Oda -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Oda Sayısı</p>
            <p class="text-label-sm text-on-surface-variant/60 mb-3">En küçük seçim alt sınır (zorunlu); yakın odalar kısmi puan alır.</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in ROOM_OPTIONS" :key="r" type="button" @click="toggleRoom(r)"
                class="px-4 py-2 rounded-lg text-label-md border-2 font-medium transition-all"
                :class="form.rooms.includes(r) ? 'bg-primary text-on-primary border-primary' : 'text-on-surface border-outline-variant hover:border-primary/60'"
              >{{ r }}</button>
            </div>
          </div>

          <!-- Olmazsa olmaz (hard) -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-error mb-1">Olmazsa Olmaz Özellikler</p>
            <p class="text-label-sm text-on-surface-variant/60 mb-3">Bunları taşımayan portföyler elenir (sert filtre).</p>
            <div class="flex flex-wrap gap-2 mb-3">
              <button
                v-for="f in FEATURE_PRESETS" :key="f" type="button" @click="toggleMustHave(f)"
                class="px-3 py-1.5 rounded-full text-label-sm border-2 transition-all"
                :class="form.mustHaveFeatures.includes(f) ? 'bg-error-container text-on-error-container border-error/40 font-medium' : 'text-on-surface-variant border-outline-variant hover:border-error/40'"
              >{{ f }}</button>
            </div>
            <div class="flex gap-2">
              <input class="input flex-1" v-model="customMust" placeholder="Özel zorunlu özellik..." @keydown.enter.prevent="addCustomMust" />
              <button type="button" class="btn" @click="addCustomMust"><span class="material-symbols-outlined text-[16px]">add</span></button>
            </div>
          </div>

          <!-- Bonus (scored) -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-primary mb-1">Bonus Tercihler</p>
            <p class="text-label-sm text-on-surface-variant/60 mb-3">Skoru artırır; eksikliği eler değil.</p>
            <div class="flex flex-wrap gap-2 mb-3">
              <button
                v-for="f in FEATURE_PRESETS" :key="f" type="button" @click="toggleBonus(f)"
                class="px-3 py-1.5 rounded-full text-label-sm border-2 transition-all"
                :class="form.bonusFeatures.includes(f) ? 'bg-primary-fixed text-on-primary-fixed-variant border-primary/40 font-medium' : 'text-on-surface-variant border-outline-variant hover:border-primary/40'"
              >{{ f }}</button>
            </div>
            <div class="flex gap-2">
              <input class="input flex-1" v-model="customBonus" placeholder="Özel bonus özellik..." @keydown.enter.prevent="addCustomBonus" />
              <button type="button" class="btn" @click="addCustomBonus"><span class="material-symbols-outlined text-[16px]">add</span></button>
            </div>
          </div>

          <!-- Müşteri -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Müşteri</p>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Ad *</label>
                <input class="input" v-model="form.customerName" placeholder="İsim Soyisim" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Telefon *</label>
                <input class="input" v-model="form.customerPhone" placeholder="05XX XXX XX XX" />
              </div>
            </div>
            <textarea class="textarea" v-model="form.note" rows="2" placeholder="Not (isteğe bağlı)" />
            <div v-if="isEdit" class="flex items-center gap-3 mt-3">
              <label class="text-label-sm font-semibold text-on-surface-variant">Durum</label>
              <select class="select" v-model="form.status">
                <option value="ACTIVE">Aktif</option>
                <option value="CLOSED">Kapandı</option>
              </select>
            </div>
          </div>

          <p v-if="error" class="px-4 py-2.5 rounded-lg bg-error-container text-on-error-container text-label-md">{{ error }}</p>
        </div>

        <!-- Alt bar -->
        <div class="shrink-0 flex items-center gap-3 px-7 py-4 border-t border-outline-variant bg-surface">
          <button v-if="isEdit" type="button" class="btn danger" @click="remove" :disabled="removing">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            {{ removing ? 'Siliniyor…' : 'Sil' }}
          </button>
          <div class="flex-1"></div>
          <button type="button" class="btn" @click="router.back()">İptal</button>
          <button type="button" class="btn primary" @click="submit" :disabled="saving || !canSubmit">
            <span class="material-symbols-outlined text-[18px]">{{ saving ? 'hourglass_empty' : 'save' }}</span>
            {{ saving ? 'Kaydediliyor…' : isEdit ? 'Değişiklikleri Kaydet' : 'Talebi Kaydet' }}
          </button>
        </div>
      </div>

      <!-- ── SAĞ: Canlı skorlu portföyler ── -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="shrink-0 flex items-center justify-between px-7 py-4 border-b border-outline-variant bg-surface">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[20px]">join_inner</span>
            <h2 class="text-label-md font-semibold text-on-surface">
              {{ results.length }} uyan portföy
            </h2>
            <span v-if="loading" class="material-symbols-outlined text-on-surface-variant text-[16px] animate-spin">progress_activity</span>
          </div>
          <div class="flex items-center gap-3 text-label-sm text-on-surface-variant">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>uyumlu</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-error inline-block"></span>eksik</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-7 py-6">
          <!-- Boş durum -->
          <div v-if="!results.length" class="h-full flex flex-col items-center justify-center text-center">
            <span class="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-3">search_off</span>
            <p class="text-body-md text-on-surface-variant">Kriterlere uygun portföy yok.</p>
            <p class="text-label-md text-on-surface-variant/60 mt-1">Filtreleri gevşetin veya talebi yine de kaydedin — yeni portföy gelince eşleşir.</p>
          </div>

          <!-- Kartlar -->
          <div v-else class="space-y-4">
            <div
              v-for="r in results" :key="r.portfolio.id"
              class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm"
            >
              <div class="flex items-start gap-4">
                <!-- Skor rozeti -->
                <div class="shrink-0 flex flex-col items-center">
                  <div class="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[18px]" :class="scoreBadgeClass(r.score)">
                    {{ r.score }}
                  </div>
                  <span class="text-label-sm text-on-surface-variant/60 mt-1">skor</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-body-md font-semibold text-on-surface truncate">
                      {{ r.portfolio.title || PROPERTY_TYPE_LABELS[r.portfolio.type] }}
                    </h3>
                    <span class="px-2 py-0.5 rounded-full text-label-sm bg-surface-container text-on-surface-variant">
                      {{ LISTING_TYPE_LABELS[r.portfolio.listingType] }}
                    </span>
                    <span v-if="r.isHidden" class="px-2 py-0.5 rounded-full text-label-sm bg-tertiary-container text-on-tertiary-container">
                      İlansız / Gizli
                    </span>
                  </div>
                  <p class="text-label-md text-on-surface-variant flex items-center gap-1 mt-1">
                    <span class="material-symbols-outlined text-[15px]">location_on</span>{{ locationOf(r.portfolio) }}
                  </p>
                  <div class="flex items-center gap-4 mt-1.5 text-label-md text-on-surface">
                    <span class="font-bold text-primary">{{ fmtPrice(r.portfolio.price) }}</span>
                    <span class="flex items-center gap-1 text-on-surface-variant"><span class="material-symbols-outlined text-[15px]">straighten</span>{{ r.portfolio.areaSqm }} m²</span>
                    <span class="flex items-center gap-1 text-on-surface-variant"><span class="material-symbols-outlined text-[15px]">door_open</span>{{ r.portfolio.roomCount }}</span>
                  </div>
                </div>

                <!-- Telefon -->
                <a :href="`tel:${r.portfolio.ownerPhone}`" class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary text-label-md font-medium hover:opacity-90 transition">
                  <span class="material-symbols-outlined text-[16px]">call</span>{{ r.portfolio.ownerName }}
                </a>
              </div>

              <!-- Boyut çubukları (renklendirme) -->
              <div class="grid grid-cols-5 gap-2 mt-4">
                <div v-for="b in activeBreakdown(r)" :key="b.key">
                  <div class="flex items-center justify-between text-label-sm text-on-surface-variant mb-1">
                    <span>{{ dimLabel(b.key) }}</span>
                    <span>{{ Math.round(b.score * 100) }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div class="h-full rounded-full transition-all" :class="barColor(b.score)" :style="{ width: (b.score * 100) + '%' }" />
                  </div>
                </div>
              </div>

              <!-- Nedenler / eksikler / eşleşen özellikler -->
              <div class="flex flex-wrap items-center gap-1.5 mt-4">
                <span v-for="k in r.reasons" :key="'r' + k"
                  class="px-2.5 py-1 rounded-full text-label-sm bg-primary-fixed text-on-primary-fixed-variant">
                  ✓ {{ dimLabel(k) }}
                </span>
                <span v-for="k in r.gaps" :key="'g' + k"
                  class="px-2.5 py-1 rounded-full text-label-sm bg-error-container text-on-error-container">
                  ✕ {{ dimLabel(k) }}
                </span>
              </div>
              <div v-if="r.matchedFeatures.length" class="flex flex-wrap items-center gap-1.5 mt-2">
                <span v-for="f in r.matchedFeatures" :key="f"
                  class="px-2.5 py-1 rounded-full text-label-sm bg-surface-container text-on-surface-variant">
                  {{ f }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
