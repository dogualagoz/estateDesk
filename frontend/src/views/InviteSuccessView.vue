<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  router.push('/');
});
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[480px] flex flex-col items-center gap-gutter text-center">
      <!-- Success icon with animation -->
      <div class="success-icon">
        <span class="material-symbols-outlined">check_circle</span>
      </div>

      <!-- Messages -->
      <div class="space-y-2">
        <h1 class="text-headline-lg font-semibold text-on-surface">Hoş geldiniz!</h1>
        <p class="text-label-md text-on-surface-variant">
          Hesabınız oluşturuldu ve ofise katıldınız.
        </p>
      </div>

      <!-- Loading indicator -->
      <div class="loading-dots">
        <div></div>
        <div></div>
        <div></div>
      </div>

      <!-- Redirecting text -->
      <p class="text-label-sm text-on-surface-variant">Dashboard'a yönlendiriliyorsunuz…</p>
    </main>
  </div>
</template>

<style scoped>
.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  margin-bottom: 16px;
  animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-icon .material-symbols-outlined {
  font-size: 48px;
  color: white;
  font-variation-settings: 'FILL' 1;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-dots {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 24px;
}

.loading-dots div {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: bounce 1.4s infinite;
}

.loading-dots div:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots div:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
