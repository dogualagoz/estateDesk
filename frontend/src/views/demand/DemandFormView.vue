<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import { matchingService } from '@/services/matching.service';
import { demandMatchService } from '@/services/demandMatch.service';
import type { CreateDemandPayload, Demand, DemandStatus } from '@/types/demand';
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
  type Portfolio,
} from '@/types/portfolio';
import { resolveImgUrl } from '@/utils/image';
import LocationDropdown from '@/components/ui/LocationDropdown.vue';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import {
  getCityNames,
  getDistrictNames,
  getGroupedNeighborhoods,
} from '@/data/tr-locations';

const route = useRoute();
const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();
const isEdit = computed(() => !!route.params.id);

const form = reactive({
  types: [] as PropertyType[],
  listingType: 'SALE' as ListingType,
  city: '',
  districts: [] as string[],
  neighborhoods: [] as string[],
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

const minBudgetDisplay = ref('');
const maxBudgetDisplay = ref('');

function formatTR(n: number | undefined): string {
  return n != null ? n.toLocaleString('tr-TR') : '';
}

function onMinBudgetInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const raw = input.value.replace(/[^\d]/g, '');
  input.value = raw;
  minBudgetDisplay.value = raw;
  form.minBudget = raw ? parseInt(raw) : undefined;
}
function onMinBudgetBlur(e: Event) {
  const formatted = formatTR(form.minBudget);
  minBudgetDisplay.value = formatted;
  (e.target as HTMLInputElement).value = formatted;
}

function onMaxBudgetInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const raw = input.value.replace(/[^\d]/g, '');
  input.value = raw;
  maxBudgetDisplay.value = raw;
  form.maxBudget = raw ? parseInt(raw) : undefined;
}
function onMaxBudgetBlur(e: Event) {
  const formatted = formatTR(form.maxBudget);
  maxBudgetDisplay.value = formatted;
  (e.target as HTMLInputElement).value = formatted;
}

async function remove() {
  if (!isEdit.value) return;
  const ok = await confirm({
    title: 'Talebi sil',
    message: 'Bu talebi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    danger: true,
    icon: 'delete',
  });
  if (!ok) return;
  removing.value = true;
  try {
    await demandService.remove(route.params.id as string);
    toast.success('Talep silindi');
    router.push('/demand');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Silme başarısız';
    toast.error(error.value || 'Silme başarısız');
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

// Konum yardımcıları
const cityOptions = computed(() => getCityNames());
const districtOptions = computed(() => form.city ? getDistrictNames(form.city) : []);
const groupedNeighborhoodOptions = computed(() =>
  form.city && form.districts.length
    ? getGroupedNeighborhoods(form.city, form.districts).map((g) => ({ group: g.district, items: g.neighborhoods }))
    : [],
);

watch(() => form.city, () => { form.districts = []; form.neighborhoods = []; });
watch(() => form.districts, () => {
  // Seçili mahallelerden artık geçersiz olanları temizle
  const allNeighborhoods = groupedNeighborhoodOptions.value.flatMap((g) => g.items);
  form.neighborhoods = form.neighborhoods.filter((n) => allNeighborhoods.includes(n));
}, { deep: true });

// ── Kriterler → canlı eşleştirme ──
const criteria = computed<MatchCriteria>(() => ({
  types: form.types.length ? form.types : undefined,
  listingType: form.listingType,
  city: form.city.trim() || undefined,
  districts: form.districts.length ? form.districts : undefined,
  neighborhoods: form.neighborhoods.length ? form.neighborhoods : undefined,
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

// ── Eşleştirme (pin) state ──
const activeTab = ref<'pinned' | 'all'>('pinned');
// Mobil: tek seferde tek panel göster (sekmeli geçiş)
const mobilePanel = ref<'form' | 'matches'>('form');
const pinnedIds = ref<Set<string>>(new Set());
const pinnedResults = ref<ScoredPortfolio[]>([]);
const pinnedLoading = ref(false);
const isDragging = ref(false);
const isDragOver = ref(false);
const dragPortfolioId = ref<string | null>(null);
const justPinnedId = ref<string | null>(null);
const dropSuccess = ref(false);

async function loadPinnedMatches() {
  if (!isEdit.value) return;
  pinnedLoading.value = true;
  try {
    pinnedResults.value = await demandMatchService.listPinned(route.params.id as string);
    pinnedIds.value = new Set(pinnedResults.value.map((r) => r.portfolio.id));
  } catch {
    pinnedResults.value = [];
  } finally {
    pinnedLoading.value = false;
  }
}

async function togglePin(portfolioId: string) {
  if (!isEdit.value) return;
  const demandId = route.params.id as string;
  try {
    if (pinnedIds.value.has(portfolioId)) {
      await demandMatchService.unpin(demandId, portfolioId);
      pinnedIds.value.delete(portfolioId);
      pinnedIds.value = new Set(pinnedIds.value);
      pinnedResults.value = pinnedResults.value.filter((r) => r.portfolio.id !== portfolioId);
    } else {
      await demandMatchService.pin(demandId, portfolioId);
      pinnedIds.value.add(portfolioId);
      pinnedIds.value = new Set(pinnedIds.value);
      const matched = results.value.find((r) => r.portfolio.id === portfolioId);
      if (matched) pinnedResults.value = [matched, ...pinnedResults.value];
      justPinnedId.value = portfolioId;
      setTimeout(() => { justPinnedId.value = null; }, 700);
    }
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Eşleştirme güncellenemedi');
  }
}

function onDragStart(portfolioId: string) {
  if (!isEdit.value) return;
  isDragging.value = true;
  dragPortfolioId.value = portfolioId;
}
function onDragEnd() {
  isDragging.value = false;
  isDragOver.value = false;
  dragPortfolioId.value = null;
}
async function onDrop() {
  isDragOver.value = false;
  isDragging.value = false;
  if (dragPortfolioId.value && !pinnedIds.value.has(dragPortfolioId.value)) {
    await togglePin(dragPortfolioId.value);
    dropSuccess.value = true;
    setTimeout(() => { dropSuccess.value = false; }, 600);
  }
  dragPortfolioId.value = null;
}

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
function dimLabel(k: DimensionKey) {
  return DIMENSION_LABELS[k];
}
const activeBreakdown = (r: ScoredPortfolio) => r.breakdown.filter((b) => b.active);

// ── Skor renk skalası: yeşil (iyi) → kırmızı (zayıf) ──
/** Kart köşesindeki büyük skor rozeti (0..100). */
function scoreBadgeBg(s: number) {
  if (s >= 80) return 'bg-emerald-600/90';
  if (s >= 60) return 'bg-lime-600/90';
  if (s >= 40) return 'bg-amber-500/90';
  if (s >= 20) return 'bg-orange-500/90';
  return 'bg-red-600/90';
}
/** Dimension uyum çubuğunun dolgu rengi (score 0..1). */
function dimBarColor(score: number) {
  const s = score * 100;
  if (s >= 80) return 'bg-emerald-500';
  if (s >= 60) return 'bg-lime-500';
  if (s >= 40) return 'bg-amber-500';
  if (s >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}
/** Dimension yüzde sayısının metin rengi (score 0..1). */
function dimTextColor(score: number) {
  const s = score * 100;
  if (s >= 80) return 'text-emerald-600';
  if (s >= 60) return 'text-lime-600';
  if (s >= 40) return 'text-amber-600';
  if (s >= 20) return 'text-orange-600';
  return 'text-red-600';
}

// ── Portföy önizleme modalı ──
const previewPortfolio = ref<Portfolio | null>(null);
const previewOrigin = ref<{ x: number; y: number } | null>(null);
function openPreview(p: Portfolio, ev?: MouseEvent) {
  const el = ev?.currentTarget as HTMLElement | undefined;
  if (el) {
    const r = el.getBoundingClientRect();
    previewOrigin.value = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  } else {
    previewOrigin.value = null;
  }
  previewPortfolio.value = p;
}
function closePreview() {
  previewPortfolio.value = null;
}

// ── Yükleme (edit) ──
onMounted(async () => {
  if (isEdit.value) {
    let d: Demand;
    try {
      d = await demandService.get(route.params.id as string);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Talep yüklenemedi');
      router.push('/demand');
      return;
    }
    Object.assign(form, {
      types: d.types,
      listingType: d.listingType ?? 'SALE',
      city: d.city ?? '',
      districts: d.districts?.length ? [...d.districts] : d.district ? [d.district] : [],
      neighborhoods: d.neighborhoods?.length ? [...d.neighborhoods] : d.neighborhood ? [d.neighborhood] : [],
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
    minBudgetDisplay.value = formatTR(form.minBudget);
    maxBudgetDisplay.value = formatTR(form.maxBudget);
  }
  fetchMatches();
  if (isEdit.value) loadPinnedMatches();
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
      districts: form.districts.length ? form.districts : undefined,
      neighborhoods: form.neighborhoods.length ? form.neighborhoods : undefined,
      district: form.districts[0] || undefined,
      neighborhood: form.neighborhoods[0] || undefined,
      regions: [...form.districts, ...form.neighborhoods].filter(Boolean),
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
  <div class="flex flex-col md:h-[100dvh] md:overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 flex items-center gap-3 px-4 md:px-8 py-5 border-b border-outline-variant bg-surface">
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

    <!-- Mobil panel sekmeleri -->
    <div class="md:hidden shrink-0 flex border-b border-outline-variant bg-surface">
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2 py-3 text-label-md font-semibold border-b-2 transition-all active:bg-surface-container"
        :class="mobilePanel === 'form' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'"
        @click="mobilePanel = 'form'"
      >
        <span class="material-symbols-outlined text-[18px]">tune</span>
        Kriterler
      </button>
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2 py-3 text-label-md font-semibold border-b-2 transition-all active:bg-surface-container"
        :class="mobilePanel === 'matches' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'"
        @click="mobilePanel = 'matches'"
      >
        <span class="material-symbols-outlined text-[18px]">join_inner</span>
        Eşleşmeler
        <span
          v-if="results.length > 0"
          class="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
          :class="mobilePanel === 'matches' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'"
        >{{ results.length }}</span>
      </button>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- ── SOL: Kriterler ── -->
      <div
        class="w-full md:w-[42%] border-r border-outline-variant flex flex-col overflow-hidden bg-surface-container/30 relative"
        :class="{ 'hidden md:flex': mobilePanel !== 'form' }"
        @dragover.prevent="isDragOver = isDragging"
        @dragleave="isDragOver = false"
        @drop.prevent="onDrop"
      >
        <!-- Drag-over overlay -->
        <Transition name="fade">
          <div
            v-if="isDragging && isEdit"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none transition-colors duration-150"
            :class="isDragOver ? 'bg-primary/10 border-2 border-dashed border-primary' : 'bg-surface/60'"
          >
            <span class="material-symbols-outlined text-[56px] transition-all duration-150" :class="isDragOver ? 'text-primary scale-110' : 'text-on-surface-variant/30'">bookmark_add</span>
            <p class="text-label-md font-semibold mt-2 transition-colors duration-150" :class="isDragOver ? 'text-primary' : 'text-on-surface-variant/40'">
              {{ isDragOver ? 'Bırakın — eşleştirilsin' : 'Portföyü buraya sürükleyin' }}
            </p>
          </div>
        </Transition>

        <!-- Drop success flash -->
        <Transition name="drop-success">
          <div
            v-if="dropSuccess"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-primary/15 backdrop-blur-[2px]"
          >
            <div class="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-primary text-on-primary shadow-xl animate-success-pop">
              <span class="material-symbols-outlined text-[44px]">bookmark_added</span>
              <p class="text-label-lg font-bold tracking-tight">Portföy eşleştirildi!</p>
            </div>
          </div>
        </Transition>
        <div class="flex-1 overflow-y-auto px-4 md:px-7 py-6 space-y-4">
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
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">İl <span class="text-error">(zorunlu filtre)</span></label>
                <LocationDropdown
                  v-model="form.city"
                  :options="cityOptions"
                  placeholder="İl seçin..."
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">
                  İlçe
                  <span class="font-normal text-on-surface-variant/60 ml-1">(çoklu seçim)</span>
                </label>
                <LocationDropdown
                  v-model="form.districts"
                  :options="districtOptions"
                  :multi="true"
                  :disabled="!form.city"
                  placeholder="İlçe seçin..."
                />
              </div>
              <div v-if="form.districts.length && groupedNeighborhoodOptions.length" class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">
                  Mahalle
                  <span class="font-normal text-on-surface-variant/60 ml-1">(çoklu seçim, isteğe bağlı)</span>
                </label>
                <LocationDropdown
                  v-model="form.neighborhoods"
                  :grouped-options="groupedNeighborhoodOptions"
                  :multi="true"
                  placeholder="Mahalle seçin..."
                />
              </div>
            </div>
          </div>

          <!-- Bütçe & m² -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Bütçe & Metrekare</p>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Min Bütçe</label>
                <input class="input" type="text" inputmode="numeric" :value="minBudgetDisplay"
                  @focus="minBudgetDisplay = form.minBudget?.toString() ?? ''"
                  @input="onMinBudgetInput"
                  @blur="onMinBudgetBlur"
                  placeholder="₺" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-label-sm font-semibold text-on-surface-variant">Max Bütçe <span class="text-error">(+%10 esneme)</span></label>
                <input class="input" type="text" inputmode="numeric" :value="maxBudgetDisplay"
                  @focus="maxBudgetDisplay = form.maxBudget?.toString() ?? ''"
                  @input="onMaxBudgetInput"
                  @blur="onMaxBudgetBlur"
                  placeholder="₺" />
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
        <div class="shrink-0 flex items-center gap-3 px-4 md:px-7 py-4 border-t border-outline-variant bg-surface">
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
      <div
        class="flex-1 flex flex-col overflow-hidden"
        :class="{ 'hidden md:flex': mobilePanel !== 'matches' }"
      >
        <!-- Tab başlıkları -->
        <div class="shrink-0 border-b border-outline-variant bg-surface">
          <div class="flex">
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-2 py-3.5 text-label-md font-semibold border-b-2 transition-all"
              :class="activeTab === 'pinned' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'"
              @click="activeTab = 'pinned'"
            >
              <span class="material-symbols-outlined text-[16px]">bookmark</span>
              Eşleştirilenler
              <span
                v-if="pinnedIds.size > 0"
                class="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
                :class="activeTab === 'pinned' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'"
              >{{ pinnedIds.size }}</span>
            </button>
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-2 py-3.5 text-label-md font-semibold border-b-2 transition-all"
              :class="activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'"
              @click="activeTab = 'all'"
            >
              <span class="material-symbols-outlined text-[16px]">join_inner</span>
              Tüm Eşleşmeler
              <span
                v-if="results.length > 0"
                class="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
                :class="activeTab === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'"
              >{{ results.length }}</span>
              <span v-if="loading" class="material-symbols-outlined text-[14px] animate-spin text-on-surface-variant">progress_activity</span>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 md:px-7 py-6">

          <!-- ── Sekme 1: Eşleştirilenler ── -->
          <template v-if="activeTab === 'pinned'">
            <div v-if="!isEdit" class="h-full flex flex-col items-center justify-center text-center">
              <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">bookmark_add</span>
              <p class="text-body-md text-on-surface-variant">Eşleştirme için önce talebi kaydedin.</p>
              <p class="text-label-md text-on-surface-variant/50 mt-1">Kaydettikten sonra portföyleri bu talebe sabitleyebilirsiniz.</p>
            </div>
            <div v-else-if="pinnedLoading" class="h-full flex items-center justify-center">
              <span class="material-symbols-outlined text-[32px] text-on-surface-variant/40 animate-spin">progress_activity</span>
            </div>
            <div v-else-if="!pinnedResults.length" class="h-full flex flex-col items-center justify-center text-center">
              <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">bookmark_border</span>
              <p class="text-body-md text-on-surface-variant">Henüz eşleştirilen portföy yok.</p>
              <p class="text-label-md text-on-surface-variant/50 mt-1">Sağ paneldeki portföyleri sürükleyerek veya <span class="material-symbols-outlined text-[12px] align-middle">bookmark_add</span> ikonuna tıklayarak eşleştirin.</p>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="r in pinnedResults" :key="r.portfolio.id"
                class="rounded-2xl overflow-hidden shadow-sm border-2 border-primary/30 flex flex-col bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                @click="openPreview(r.portfolio, $event)"
              >
                <!-- Görsel -->
                <div class="relative w-full h-52 bg-surface-container shrink-0">
                  <img v-if="r.portfolio.images?.length" :src="resolveImgUrl(r.portfolio.images[0])" :alt="r.portfolio.title ?? undefined" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center bg-surface-container">
                    <span class="material-symbols-outlined text-[48px] text-on-surface-variant/20">apartment</span>
                  </div>
                  <div class="absolute top-3 left-3">
                    <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/40 text-white backdrop-blur-sm">{{ LISTING_TYPE_LABELS[r.portfolio.listingType] }}</span>
                  </div>
                  <!-- Eşleştirildi rozeti -->
                  <div class="absolute top-3 right-3">
                    <span class="flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold bg-primary text-on-primary shadow-sm">
                      <span class="material-symbols-outlined text-[12px]">bookmark</span>
                      Eşleştirildi
                    </span>
                  </div>
                  <div class="absolute bottom-3 right-3 flex flex-col items-center justify-center w-[52px] h-[52px] rounded-2xl backdrop-blur-md shadow-lg"
                    :class="scoreBadgeBg(r.score)">
                    <span class="text-[22px] font-black leading-none text-white">{{ r.score }}</span>
                    <span class="text-[9px] font-semibold text-white/70 uppercase tracking-wide leading-none mt-0.5">puan</span>
                  </div>
                </div>
                <!-- Bilgi alanı -->
                <div class="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-2">
                  <h3 class="text-[13px] font-semibold text-on-surface leading-snug line-clamp-2">{{ r.portfolio.title || PROPERTY_TYPE_LABELS[r.portfolio.type] }}</h3>
                  <p class="text-[18px] font-black text-primary leading-none tracking-tight">{{ fmtPrice(r.portfolio.price) }}</p>
                  <p class="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-[12px] shrink-0">location_on</span>
                    <span class="truncate">{{ locationOf(r.portfolio) }}</span>
                  </p>
                  <div class="flex items-center gap-3 text-[11px] text-on-surface-variant">
                    <span class="flex items-center gap-0.5 font-medium"><span class="material-symbols-outlined text-[12px]">straighten</span>{{ r.portfolio.areaSqm }} m²</span>
                    <span class="flex items-center gap-0.5 font-medium"><span class="material-symbols-outlined text-[12px]">door_open</span>{{ r.portfolio.roomCount }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 mt-auto pt-1">
                    <a :href="`tel:${r.portfolio.ownerPhone}`" @click.stop
                      class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                      <span class="material-symbols-outlined text-[14px]">call</span>
                      {{ r.portfolio.ownerName }}
                    </a>
                    <button type="button" @click.stop="togglePin(r.portfolio.id)"
                      class="p-2 rounded-xl bg-error-container text-on-error-container hover:opacity-80 transition-all"
                      title="Eşleştirmeyi kaldır">
                      <span class="material-symbols-outlined text-[16px]">bookmark_remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ── Sekme 2: Tüm eşleşmeler ── -->
          <template v-else>
          <!-- Boş durum -->
          <div v-if="!results.length" class="h-full flex flex-col items-center justify-center text-center">
            <span class="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-3">search_off</span>
            <p class="text-body-md text-on-surface-variant">Kriterlere uygun portföy yok.</p>
            <p class="text-label-md text-on-surface-variant/60 mt-1">Filtreleri gevşetin veya talebi yine de kaydedin — yeni portföy gelince eşleşir.</p>
          </div>

          <!-- Kartlar: 2'li dikey grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="r in results" :key="r.portfolio.id"
              :draggable="isEdit"
              @dragstart="onDragStart(r.portfolio.id)"
              @dragend="onDragEnd"
              @click="openPreview(r.portfolio, $event)"
              class="rounded-2xl overflow-hidden border flex flex-col hover:-translate-y-0.5 transition-all duration-200 select-none cursor-pointer"
              :class="[
                pinnedIds.has(r.portfolio.id)
                  ? 'border-2 border-primary bg-primary/[0.03] shadow-[0_0_0_3px_rgba(78,96,79,0.15),0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'border border-outline-variant/50 bg-white shadow-sm hover:shadow-md',
                justPinnedId === r.portfolio.id ? 'animate-pin-pop' : ''
              ]"
            >
              <!-- Görsel -->
              <div class="relative w-full h-52 bg-surface-container shrink-0">
                <img
                  v-if="r.portfolio.images?.length"
                  :src="resolveImgUrl(r.portfolio.images[0])"
                  :alt="r.portfolio.title ?? undefined"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex flex-col items-center justify-center bg-surface-container">
                  <span class="material-symbols-outlined text-[48px] text-on-surface-variant/20">apartment</span>
                </div>

                <!-- Sol üst: ilan tipi -->
                <div class="absolute top-3 left-3">
                  <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/40 text-white backdrop-blur-sm">
                    {{ LISTING_TYPE_LABELS[r.portfolio.listingType] }}
                  </span>
                </div>

                <!-- Eşleştirildi görsel overlay -->
                <div v-if="pinnedIds.has(r.portfolio.id)" class="absolute inset-0 bg-primary/10 pointer-events-none" />

                <!-- Sol alt: eşleştirildi şerit rozeti -->
                <div v-if="pinnedIds.has(r.portfolio.id)"
                  class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-on-primary text-[11px] font-bold tracking-wide">
                  <span class="material-symbols-outlined text-[13px]">bookmark</span>
                  EŞLEŞTİRİLDİ
                </div>

                <!-- Sağ üst: pin butonu -->
                <div class="absolute top-3 right-3">
                  <button v-if="isEdit" type="button"
                    @click.stop="togglePin(r.portfolio.id)"
                    class="flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-md shadow-md transition-all duration-150"
                    :class="pinnedIds.has(r.portfolio.id)
                      ? 'bg-primary text-on-primary scale-110'
                      : 'bg-black/40 text-white hover:bg-primary hover:text-on-primary hover:scale-110'"
                    :title="pinnedIds.has(r.portfolio.id) ? 'Eşleştirmeyi kaldır' : 'Bu talebe eşleştir'">
                    <span class="material-symbols-outlined text-[18px]">{{ pinnedIds.has(r.portfolio.id) ? 'bookmark' : 'bookmark_add' }}</span>
                  </button>
                </div>

                <!-- Skor badge: pinned ise üstte, değilse altta -->
                <div
                  class="absolute flex flex-col items-center justify-center w-[52px] h-[52px] rounded-2xl backdrop-blur-md shadow-lg transition-all duration-300"
                  :class="[
                    pinnedIds.has(r.portfolio.id) ? 'bottom-10 right-3' : 'bottom-3 right-3',
                    scoreBadgeBg(r.score)
                  ]">
                  <span class="text-[22px] font-black leading-none text-white">{{ r.score }}</span>
                  <span class="text-[9px] font-semibold text-white/70 uppercase tracking-wide leading-none mt-0.5">puan</span>
                </div>
              </div>

              <!-- Bilgi alanı -->
              <div class="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-2">
                <!-- Başlık -->
                <h3 class="text-[13px] font-semibold text-on-surface leading-snug line-clamp-2">
                  {{ r.portfolio.title || PROPERTY_TYPE_LABELS[r.portfolio.type] }}
                </h3>

                <!-- Fiyat -->
                <p class="text-[18px] font-black text-primary leading-none tracking-tight">
                  {{ fmtPrice(r.portfolio.price) }}
                </p>

                <!-- Konum -->
                <p class="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[12px] shrink-0">location_on</span>
                  <span class="truncate">{{ locationOf(r.portfolio) }}</span>
                </p>

                <!-- Alan + oda + dimension çubukları -->
                <div class="flex items-center gap-3 text-[11px] text-on-surface-variant">
                  <span class="flex items-center gap-0.5 font-medium">
                    <span class="material-symbols-outlined text-[12px]">straighten</span>{{ r.portfolio.areaSqm }} m²
                  </span>
                  <span class="flex items-center gap-0.5 font-medium">
                    <span class="material-symbols-outlined text-[12px]">door_open</span>{{ r.portfolio.roomCount }}
                  </span>
                </div>

                <!-- Dimension uyum çubukları -->
                <div class="grid grid-cols-5 gap-2 py-1.5">
                  <div v-for="b in activeBreakdown(r)" :key="b.key">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] font-medium text-on-surface-variant/80 leading-none">{{ dimLabel(b.key) }}</span>
                      <span class="text-[11px] font-bold leading-none" :class="dimTextColor(b.score)">
                        {{ Math.round(b.score * 100) }}
                      </span>
                    </div>
                    <div class="h-2 rounded-full bg-surface-container overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500" :class="dimBarColor(b.score)"
                        :style="{ width: (b.score * 100) + '%' }" />
                    </div>
                  </div>
                </div>

                <!-- Uyuşan / eksik etiketler -->
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="k in r.reasons" :key="'r'+k"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-700">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span>{{ dimLabel(k) }}
                  </span>
                  <span v-for="k in r.gaps" :key="'g'+k"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-red-100 text-red-700">
                    <span class="material-symbols-outlined text-[14px]">cancel</span>{{ dimLabel(k) }}
                  </span>
                </div>

                <!-- Eşleşen özellikler -->
                <div v-if="r.matchedFeatures.length" class="flex flex-wrap gap-1">
                  <span v-for="f in r.matchedFeatures.slice(0, 3)" :key="f"
                    class="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant">
                    {{ f }}
                  </span>
                  <span v-if="r.matchedFeatures.length > 3"
                    class="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant">
                    +{{ r.matchedFeatures.length - 3 }}
                  </span>
                </div>

                <!-- Telefon butonu -->
                <a :href="`tel:${r.portfolio.ownerPhone}`" @click.stop
                  class="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                  <span class="material-symbols-outlined text-[14px]">call</span>
                  {{ r.portfolio.ownerName }}
                </a>
              </div>
            </div>
          </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Portföy önizleme modalı -->
    <PortfolioDetailModal
      :portfolio="previewPortfolio"
      :origin="previewOrigin"
      :can-pin="isEdit"
      :pinned="!!previewPortfolio && pinnedIds.has(previewPortfolio.id)"
      @toggle-pin="togglePin"
      @close="closePreview"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.drop-success-enter-active { transition: opacity 0.12s ease-out; }
.drop-success-leave-active { transition: opacity 0.4s ease-in; }
.drop-success-enter-from, .drop-success-leave-to { opacity: 0; }

/* Kart pin animasyonu — belirgin halka yayılımı */
@keyframes pin-pop {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0px  rgba(78,96,79,0.8), 0 2px 8px rgba(0,0,0,0.08); }
  20%  { transform: scale(1.07); box-shadow: 0 0 0 8px  rgba(78,96,79,0.35), 0 6px 20px rgba(0,0,0,0.14); }
  50%  { transform: scale(1.03); box-shadow: 0 0 0 18px rgba(78,96,79,0), 0 4px 14px rgba(0,0,0,0.1); }
  75%  { transform: scale(0.99); }
  100% { transform: scale(1);    box-shadow: 0 0 0 0px  rgba(78,96,79,0), 0 2px 8px rgba(0,0,0,0.08); }
}
.animate-pin-pop { animation: pin-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

/* Drop success içindeki kart pop */
@keyframes success-pop {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-success-pop { animation: success-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
</style>
