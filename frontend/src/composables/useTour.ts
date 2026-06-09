import { reactive, computed } from 'vue';

export interface TourStep {
  /** Adım gösterilmeden önce gidilecek route (gerekliyse). */
  route: string;
  /** Spotlight uygulanacak element seçicisi. null ise ekran ortasında balon. */
  target: string | null;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Son adım: "Kaydol" CTA'sı gösterilir. */
  final?: boolean;
}

export const TOUR_STORAGE_KEY = 'ed_demo_tour_done';

const steps: TourStep[] = [
  {
    route: '/demo',
    target: '[data-tour="dashboard-header"]',
    title: 'Kontrol paneliniz',
    body: 'Burası Defter. Günlük özetiniz, hızlı notlarınız ve sizi bekleyen eşleşmeler tek ekranda toplanır.',
    placement: 'bottom',
  },
  {
    route: '/demo',
    target: '[data-tour="pending-matches"]',
    title: 'Eşleşmesi bekleyen talepler',
    body: 'Her talebin yanında en güçlü portföy eşleşmesi ve yüzdelik skoru çıkar. Renk kodu talebin ne kadar beklediğini gösterir — soğumadan harekete geçin.',
    placement: 'right',
  },
  {
    route: '/demo/portfolio',
    target: '[data-tour="portfolio-list"]',
    title: 'Portföyleriniz',
    body: 'Tüm ilanlarınız burada. Tipe, bölgeye ve fiyata göre filtreleyin; demo ofisinde 260 örnek portföy sizi bekliyor.',
    placement: 'bottom',
  },
  {
    route: '/demo/demand',
    target: '[data-tour="demand-list"]',
    title: 'Müşteri talepleri',
    body: 'Alıcı ve kiracı arayışlarını kaydedin. Her talep kartında o talebe en uygun portföy ve eşleşme skoru otomatik görünür.',
    placement: 'bottom',
  },
  {
    route: '/demo/demand',
    target: null,
    title: 'Gerisi sizde',
    body: 'İşte emlakdefter böyle çalışıyor: portföy ve talebi otomatik eşleştirip hiçbir fırsatı kaçırmamanızı sağlar. Kendi ofisinizi kurmaya hazır mısınız?',
    placement: 'center',
    final: true,
  },
];

const state = reactive({
  active: false,
  index: 0,
});

export function useTour() {
  const current = computed<TourStep | null>(() =>
    state.active ? steps[state.index] ?? null : null,
  );
  const isFirst = computed(() => state.index === 0);
  const isLast = computed(() => state.index === steps.length - 1);

  function start() {
    state.index = 0;
    state.active = true;
  }

  function stop() {
    state.active = false;
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, '1');
    } catch {
      /* yoksay */
    }
  }

  function next() {
    if (state.index < steps.length - 1) state.index += 1;
    else stop();
  }

  function prev() {
    if (state.index > 0) state.index -= 1;
  }

  function hasSeenTour() {
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  return {
    state,
    steps,
    current,
    isFirst,
    isLast,
    total: steps.length,
    start,
    stop,
    next,
    prev,
    hasSeenTour,
  };
}
