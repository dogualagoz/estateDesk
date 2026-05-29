<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/layout/AppShell.vue';

const route = useRoute();
const hideShell = computed(() => route.meta?.public === true || route.meta?.bare === true);
</script>

<template>
  <router-view v-if="hideShell" />
  <AppShell v-else>
    <router-view />
  </AppShell>
</template>
