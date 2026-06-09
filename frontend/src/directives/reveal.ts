import type { Directive } from 'vue';

/**
 * v-reveal — element görünüm alanına girince yumuşakça belirir.
 *
 * Kullanım:
 *   <div v-reveal>...</div>
 *   <div v-reveal="{ delay: 120 }">...</div>   // ms cinsinden gecikme (stagger)
 *
 * `prefers-reduced-motion` açıksa animasyon atlanır, içerik anında görünür.
 */

interface RevealOptions {
  delay?: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const observers = new WeakMap<HTMLElement, IntersectionObserver>();

export const reveal: Directive<HTMLElement, RevealOptions | undefined> = {
  mounted(el, binding) {
    const delay = binding.value?.delay ?? 0;

    if (prefersReducedMotion()) {
      el.classList.add('reveal-visible');
      return;
    }

    el.classList.add('reveal-init');
    if (delay) el.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('reveal-visible');
            observer.unobserve(el);
            observers.delete(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(el);
    observers.set(el, observer);
  },
  unmounted(el) {
    observers.get(el)?.disconnect();
    observers.delete(el);
  },
};
