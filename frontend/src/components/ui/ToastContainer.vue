<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, dismiss } = useToast();

const config = {
  success: { icon: 'check_circle', cls: 'toast-success' },
  error: { icon: 'error', cls: 'toast-error' },
  info: { icon: 'info', cls: 'toast-info' },
} as const;
</script>

<template>
  <Teleport to="body">
    <div class="fixed z-[300] inset-x-0 bottom-0 md:bottom-auto md:top-0 md:right-0 md:inset-x-auto flex flex-col items-center md:items-end gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast pointer-events-auto flex items-center gap-3 w-full max-w-[420px] px-4 py-3 rounded-xl shadow-lg border bg-surface-container-lowest"
          :class="config[t.type].cls"
          role="status"
        >
          <span class="material-symbols-outlined text-[20px] shrink-0 toast-icon">{{ config[t.type].icon }}</span>
          <p class="text-label-md text-on-surface flex-1 min-w-0">{{ t.message }}</p>
          <button
            class="shrink-0 p-1 -mr-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Kapat"
            @click="dismiss(t.id)"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-success { border-color: #b6d7b6; }
.toast-success .toast-icon { color: #2e7d32; }
.toast-error { border-color: var(--error-container, #ffdad6); }
.toast-error .toast-icon { color: var(--error, #ba1a1a); }
.toast-info { border-color: var(--outline-variant, #c3c8c0); }
.toast-info .toast-icon { color: var(--primary, #4e604f); }

/* Giriş/çıkış animasyonu — mobilde alttan, masaüstünde sağdan */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
.toast-leave-active {
  position: absolute;
}

@media (min-width: 768px) {
  .toast-enter-from,
  .toast-leave-to {
    transform: translateX(24px);
  }
}
</style>
