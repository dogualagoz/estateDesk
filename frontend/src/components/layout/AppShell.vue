<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import Topbar from './Topbar.vue';
</script>

<template>
  <div class="shell">
    <Sidebar />
    <div class="main">
      <Topbar />
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--surface);
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.content {
  flex: 1;
  overflow: auto;
}
@media (max-width: 768px) {
  .shell { flex-direction: column; }
  .content { padding-bottom: 72px; }
}
</style>
