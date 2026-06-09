<script setup lang="ts">
import { ref, watch, computed, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTour } from '@/composables/useTour';

const route = useRoute();
const router = useRouter();
const { state, current, isFirst, isLast, total, next, prev, stop } = useTour();

const rect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
const bubble = ref<HTMLElement | null>(null);
const bubbleStyle = ref<Record<string, string>>({});

const stepIndex = computed(() => state.index);
const PAD = 8;

let raf = 0;
let cancelled = false;

function cancel() {
  cancelled = true;
  cancelAnimationFrame(raf);
}

/** Hedef elemanı (gerekirse route değiştirerek) bulur ve konumlandırır. */
async function locate() {
  cancelled = false;
  const step = current.value;
  if (!step) return;

  // Doğru route'a geç
  if (step.route && route.path !== step.route) {
    await router.push(step.route);
    await nextTick();
  }

  if (!step.target) {
    rect.value = null; // ortalanmış balon
    await nextTick();
    positionBubble();
    return;
  }

  // Element belirene kadar bekle (~2.5s)
  const start = performance.now();
  const tryFind = () => {
    if (cancelled) return;
    const el = document.querySelector<HTMLElement>(step.target as string);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // scroll'un oturması için bir tık bekle
      setTimeout(() => {
        if (cancelled) return;
        measure(el);
      }, 320);
    } else if (performance.now() - start < 2500) {
      raf = requestAnimationFrame(tryFind);
    } else {
      rect.value = null; // bulunamadı → ortala
      positionBubble();
    }
  };
  tryFind();
}

function measure(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  rect.value = { top: r.top, left: r.left, width: r.width, height: r.height };
  nextTick(positionBubble);
}

function reMeasure() {
  const step = current.value;
  if (!step?.target) return positionBubble();
  const el = document.querySelector<HTMLElement>(step.target);
  if (el) measure(el);
}

function positionBubble() {
  const step = current.value;
  if (!step) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bw = bubble.value?.offsetWidth ?? 340;
  const bh = bubble.value?.offsetHeight ?? 180;
  const gap = 14;

  // Ortalanmış (hedefsiz veya küçük ekran)
  if (!rect.value || step.placement === 'center' || vw < 640) {
    bubbleStyle.value = {
      top: `${Math.max((vh - bh) / 2, 16)}px`,
      left: `${Math.max((vw - bw) / 2, 16)}px`,
    };
    return;
  }

  const r = rect.value;
  let top = 0;
  let left = 0;
  const placement = step.placement ?? 'bottom';

  if (placement === 'bottom') {
    top = r.top + r.height + gap;
    left = r.left;
  } else if (placement === 'top') {
    top = r.top - bh - gap;
    left = r.left;
  } else if (placement === 'right') {
    top = r.top;
    left = r.left + r.width + gap;
  } else if (placement === 'left') {
    top = r.top;
    left = r.left - bw - gap;
  }

  // Dikey taşma → alta sığmıyorsa üste al
  if (top + bh > vh - 12) top = Math.max(r.top - bh - gap, 12);
  if (top < 12) top = 12;
  // Yatay clamp
  left = Math.min(Math.max(left, 12), vw - bw - 12);

  bubbleStyle.value = { top: `${top}px`, left: `${left}px` };
}

const spotlightStyle = computed(() => {
  if (!rect.value) return null;
  const r = rect.value;
  return {
    top: `${r.top - PAD}px`,
    left: `${r.left - PAD}px`,
    width: `${r.width + PAD * 2}px`,
    height: `${r.height + PAD * 2}px`,
  };
});

watch([() => state.active, stepIndex], ([active]) => {
  cancel();
  if (active) locate();
  else rect.value = null;
});

function onScrollResize() {
  if (state.active) reMeasure();
}
window.addEventListener('resize', onScrollResize);
window.addEventListener('scroll', onScrollResize, true);

onUnmounted(() => {
  cancel();
  window.removeEventListener('resize', onScrollResize);
  window.removeEventListener('scroll', onScrollResize, true);
});

function finish() {
  stop();
}
function register() {
  stop();
  router.push('/register');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="state.active && current" class="fixed inset-0 z-[300]">
        <!-- Backdrop + spotlight -->
        <div
          v-if="spotlightStyle"
          class="absolute rounded-xl tour-spotlight pointer-events-none"
          :style="spotlightStyle"
        />
        <div v-else class="absolute inset-0 bg-black/55 pointer-events-auto" />

        <!-- Atla -->
        <button
          class="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest/95 text-on-surface-variant text-label-sm font-medium shadow-md hover:text-on-surface transition-colors"
          @click="finish"
        >
          Turu atla
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>

        <!-- Balon -->
        <div
          ref="bubble"
          class="tour-bubble absolute z-10 w-[min(92vw,360px)] rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-5"
          :style="bubbleStyle"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[18px]">{{ current.final ? 'rocket_launch' : 'tips_and_updates' }}</span>
            </span>
            <h3 class="text-body-md font-semibold text-on-surface">{{ current.title }}</h3>
          </div>

          <p class="text-label-md text-on-surface-variant leading-6">{{ current.body }}</p>

          <!-- İlerleme noktaları -->
          <div class="flex items-center gap-1.5 mt-4">
            <span
              v-for="i in total"
              :key="i"
              class="h-1.5 rounded-full transition-all duration-300"
              :class="i - 1 === state.index ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant'"
            />
          </div>

          <!-- Kontroller -->
          <div class="flex items-center justify-between gap-2 mt-4">
            <span class="text-label-sm text-on-surface-variant">{{ state.index + 1 }} / {{ total }}</span>
            <div class="flex items-center gap-2">
              <button v-if="!isFirst" class="btn ghost h-9" @click="prev">Geri</button>
              <template v-if="current.final">
                <button class="btn h-9" @click="finish">Kapat</button>
                <button class="btn primary h-9" @click="register">
                  Ücretsiz Başla
                  <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </template>
              <button v-else class="btn primary h-9" @click="next">
                {{ isLast ? 'Bitir' : 'İleri' }}
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-spotlight {
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  transition: top 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              left 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              width 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              height 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.tour-bubble {
  transition: top 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              left 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  animation: bubble-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes bubble-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.25s ease;
}
.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tour-spotlight, .tour-bubble { transition: none; animation: none; }
}
</style>
