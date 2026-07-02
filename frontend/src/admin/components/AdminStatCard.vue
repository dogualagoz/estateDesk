<script setup lang="ts">
/** Tek metrik kartı — panel genelinde tutarlı istatistik kutusu. */
defineProps<{
  label: string;
  value: string | number;
  icon: string;
  /** Değerin altında küçük açıklama (ör. "son 24 saat"). */
  hint?: string;
  /** Değer vurgusu: hata sayıları için kırmızı vb. */
  tone?: 'default' | 'danger';
}>();
</script>

<template>
  <div class="card !p-stack-md flex items-center gap-stack-md">
    <div
      class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
      :class="tone === 'danger' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed-variant'"
    >
      <span class="material-symbols-outlined text-[22px]">{{ icon }}</span>
    </div>
    <div class="min-w-0">
      <div
        class="text-headline-md font-semibold leading-none"
        :class="tone === 'danger' ? 'text-error' : 'text-on-surface'"
      >
        {{ value }}
      </div>
      <div class="text-label-sm text-on-surface-variant mt-1.5 leading-tight">
        {{ label }}
        <span v-if="hint" class="text-on-surface-variant/60">· {{ hint }}</span>
      </div>
    </div>
  </div>
</template>
