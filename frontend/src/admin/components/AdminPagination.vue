<script setup lang="ts">
import { computed } from 'vue';

/** Liste altı sayfalama çubuğu — tüm admin tabloları kullanır. */
const props = defineProps<{
  total: number;
  pageSize: number;
}>();

const page = defineModel<number>('page', { default: 1 });

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between pt-stack-md">
    <p class="text-label-sm text-on-surface-variant">{{ total }} kayıt · sayfa {{ page }}/{{ totalPages }}</p>
    <div class="flex gap-2">
      <button class="btn !py-1.5 text-[13px]" :disabled="page <= 1" @click="page--">
        <span class="material-symbols-outlined text-[16px]">chevron_left</span>
        Önceki
      </button>
      <button class="btn !py-1.5 text-[13px]" :disabled="page >= totalPages" @click="page++">
        Sonraki
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  </div>
</template>
