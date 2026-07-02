import { onBeforeUnmount, ref, watch, type ComputedRef } from 'vue';
import { matchingService } from '@/services/matching.service';
import { demandMatchService } from '@/services/demandMatch.service';
import type { MatchCriteria, ScoredPortfolio } from '@/types/matching';
import { useToast } from '@/composables/useToast';

/**
 * Talep formunun sağ paneli için canlı eşleştirme durumu:
 * - kriter değiştikçe debounce'lu (300ms) skorlu portföy getirme
 * - pin (eşleştirme) durumu: pinle/kaldır, pinli liste
 * - sürükle-bırak ile pinleme durumu
 *
 * @param criteria  Form alanlarından türetilen canlı eşleştirme kriterleri
 * @param demandId  Kayıtlı talep id'si (yeni talep henüz kaydedilmediyse undefined)
 */
export function useDemandMatching(
  criteria: ComputedRef<MatchCriteria>,
  demandId: () => string | undefined,
) {
  const toast = useToast();

  // ── Canlı eşleşme sonuçları ──
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

  // ── Eşleştirme (pin) durumu ──
  const pinnedIds = ref<Set<string>>(new Set());
  const pinnedResults = ref<ScoredPortfolio[]>([]);
  const pinnedLoading = ref(false);
  const justPinnedId = ref<string | null>(null);

  async function loadPinnedMatches() {
    const id = demandId();
    if (!id) return;
    pinnedLoading.value = true;
    try {
      pinnedResults.value = await demandMatchService.listPinned(id);
      pinnedIds.value = new Set(pinnedResults.value.map((r) => r.portfolio.id));
    } catch {
      pinnedResults.value = [];
    } finally {
      pinnedLoading.value = false;
    }
  }

  async function togglePin(portfolioId: string) {
    const id = demandId();
    if (!id) return;
    try {
      if (pinnedIds.value.has(portfolioId)) {
        await demandMatchService.unpin(id, portfolioId);
        pinnedIds.value.delete(portfolioId);
        pinnedIds.value = new Set(pinnedIds.value);
        pinnedResults.value = pinnedResults.value.filter((r) => r.portfolio.id !== portfolioId);
      } else {
        await demandMatchService.pin(id, portfolioId);
        pinnedIds.value.add(portfolioId);
        pinnedIds.value = new Set(pinnedIds.value);
        const matched = results.value.find((r) => r.portfolio.id === portfolioId);
        if (matched) pinnedResults.value = [matched, ...pinnedResults.value];
        justPinnedId.value = portfolioId;
        setTimeout(() => {
          justPinnedId.value = null;
        }, 700);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Eşleştirme güncellenemedi');
    }
  }

  // ── Sürükle-bırak durumu (kart → sol panel) ──
  const isDragging = ref(false);
  const isDragOver = ref(false);
  const dragPortfolioId = ref<string | null>(null);
  const dropSuccess = ref(false);

  function onDragStart(portfolioId: string) {
    if (!demandId()) return;
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
      setTimeout(() => {
        dropSuccess.value = false;
      }, 600);
    }
    dragPortfolioId.value = null;
  }

  return {
    results,
    loading,
    fetchMatches,
    pinnedIds,
    pinnedResults,
    pinnedLoading,
    justPinnedId,
    loadPinnedMatches,
    togglePin,
    isDragging,
    isDragOver,
    dropSuccess,
    onDragStart,
    onDragEnd,
    onDrop,
  };
}

export type DemandMatching = ReturnType<typeof useDemandMatching>;
