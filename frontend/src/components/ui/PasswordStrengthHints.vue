<script setup lang="ts">
import { usePasswordStrength } from '@/composables/usePasswordStrength';

const props = defineProps<{ password: string }>();
const { hasMinLength, hasUppercase, hasDigit } = usePasswordStrength(() => props.password);
</script>

<template>
  <ul class="flex flex-col gap-1 text-label-md mt-1">
    <li class="flex items-center gap-1.5" :class="hasMinLength ? 'text-primary' : 'text-on-surface-variant'">
      <span class="material-symbols-outlined text-[16px]">{{ hasMinLength ? 'check_circle' : 'circle' }}</span>
      En az 8 karakter
    </li>
    <li class="flex items-center gap-1.5" :class="hasUppercase ? 'text-primary' : 'text-on-surface-variant'">
      <span class="material-symbols-outlined text-[16px]">{{ hasUppercase ? 'check_circle' : 'circle' }}</span>
      Bir büyük harf
    </li>
    <li class="flex items-center gap-1.5" :class="hasDigit ? 'text-primary' : 'text-on-surface-variant'">
      <span class="material-symbols-outlined text-[16px]">{{ hasDigit ? 'check_circle' : 'circle' }}</span>
      Bir rakam
    </li>
  </ul>
</template>
