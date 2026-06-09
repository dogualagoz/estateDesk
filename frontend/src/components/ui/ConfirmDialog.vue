<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import { useConfirm } from '@/composables/useConfirm';

const { state, accept, cancel } = useConfirm();

function handleKeydown(e: KeyboardEvent) {
  if (!state.open) return;
  if (e.key === 'Escape') cancel();
  else if (e.key === 'Enter') accept();
}

// Modal açıkken klavye kısayollarını dinle
watch(
  () => state.open,
  (open) => {
    if (open) window.addEventListener('keydown', handleKeydown);
    else window.removeEventListener('keydown', handleKeydown);
  },
);
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="state.open"
        class="fixed inset-0 z-[250] flex items-end md:items-center justify-center md:p-4"
        @click.self="cancel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cancel" />

        <!-- Panel -->
        <div class="confirm-panel relative bg-surface-container-lowest rounded-t-2xl md:rounded-2xl shadow-lg w-full max-w-none md:max-w-[400px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 flex flex-col gap-stack-md">
          <!-- Tutma çubuğu (mobil) -->
          <div class="md:hidden mx-auto -mt-2 mb-1 h-1.5 w-10 rounded-full bg-outline-variant" />

          <!-- İkon -->
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center self-center md:self-start"
            :class="state.danger ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'"
          >
            <span class="material-symbols-outlined text-[26px]">{{ state.icon }}</span>
          </div>

          <!-- Metin -->
          <div class="text-center md:text-left">
            <h2 class="text-headline-sm font-semibold text-on-surface">{{ state.title }}</h2>
            <p v-if="state.message" class="text-label-md text-on-surface-variant mt-1.5 leading-relaxed">
              {{ state.message }}
            </p>
          </div>

          <!-- Butonlar -->
          <div class="flex flex-col-reverse md:flex-row md:justify-end gap-2 mt-1">
            <button class="btn secondary md:w-auto h-11" @click="cancel">
              {{ state.cancelText }}
            </button>
            <button
              class="btn h-11 md:w-auto"
              :class="state.danger ? 'danger' : 'primary'"
              @click="accept"
            >
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.25s ease;
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-active .confirm-panel,
.confirm-fade-leave-active .confirm-panel {
  transition: transform 0.34s cubic-bezier(0.32, 0.72, 0, 1);
}
.confirm-fade-enter-from .confirm-panel,
.confirm-fade-leave-to .confirm-panel {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .confirm-fade-enter-from .confirm-panel,
  .confirm-fade-leave-to .confirm-panel {
    transform: scale(0.95) translateY(8px);
  }
}
</style>
