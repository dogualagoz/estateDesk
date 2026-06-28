<script setup lang="ts">
/**
 * Hero için stilize, statik uygulama önizlemesi.
 * Gerçek API'ye bağlanmaz; tasarım token'larıyla çizilmiş bir vitrindir.
 */
const navItems = [
  { icon: 'dashboard', label: 'Dashboard', active: true },
  { icon: 'maps_home_work', label: 'Portföyler', active: false },
  { icon: 'ads_click', label: 'Talepler', active: false },
  { icon: 'groups', label: 'Ofisim', active: false },
];

const matches = [
  { name: 'Yılmaz Ailesi', detail: '3+1 • Kadıköy • 6.5M ₺', score: 94 },
  { name: 'Demir İnşaat', detail: 'Arsa • Çankaya • 12M ₺', score: 88 },
  { name: 'Kaya Holding', detail: 'Ofis • Şişli • 45.000 ₺/ay', score: 81 },
];
</script>

<template>
  <div class="preview-frame relative rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden select-none">
    <!-- Tarayıcı çubuğu -->
    <div class="flex items-center gap-2 px-4 h-9 bg-surface-container-low border-b border-outline-variant">
      <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
      <span class="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
      <span class="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
      <div class="ml-3 flex-1 h-4 rounded-full bg-surface-container max-w-[180px]" />
    </div>

    <div class="flex h-[340px] sm:h-[380px]">
      <!-- Mini sidebar -->
      <aside class="w-14 sm:w-40 shrink-0 bg-primary text-on-primary flex flex-col py-3 px-2 sm:px-3 gap-1">
        <div class="hidden sm:flex items-center gap-1.5 px-2 pb-3">
          <img :src="'/logo.svg'" alt="emlakdefter" class="h-5 w-5 rounded" />
          <span class="font-bold text-[13px] text-on-primary/95 tracking-tight">emlakdefter</span>
        </div>
        <div
          v-for="n in navItems"
          :key="n.label"
          class="flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-medium transition-colors"
          :class="n.active ? 'bg-white/15 text-on-primary' : 'text-on-primary/60'"
        >
          <span class="material-symbols-outlined text-[18px]">{{ n.icon }}</span>
          <span class="hidden sm:inline">{{ n.label }}</span>
        </div>
      </aside>

      <!-- İçerik -->
      <div class="flex-1 min-w-0 p-3 sm:p-4 bg-background overflow-hidden">
        <div class="text-label-sm text-on-surface-variant uppercase tracking-wider">Dashboard</div>
        <div class="text-on-surface font-semibold text-[15px] mt-0.5 mb-3">Bugünkü eşleşmeler</div>

        <!-- İstatistik kutuları -->
        <div class="grid grid-cols-3 gap-2 mb-3">
          <div class="rounded-lg border border-outline-variant bg-surface-container-lowest p-2">
            <div class="text-[18px] font-bold text-on-surface leading-none">215</div>
            <div class="text-[10px] text-on-surface-variant mt-1">Portföy</div>
          </div>
          <div class="rounded-lg border border-outline-variant bg-surface-container-lowest p-2">
            <div class="text-[18px] font-bold text-on-surface leading-none">52</div>
            <div class="text-[10px] text-on-surface-variant mt-1">Aktif Talep</div>
          </div>
          <div class="rounded-lg border border-outline-variant bg-surface-container-lowest p-2">
            <div class="text-[18px] font-bold text-primary leading-none">18</div>
            <div class="text-[10px] text-on-surface-variant mt-1">Yeni Eşleşme</div>
          </div>
        </div>

        <!-- Eşleşme kartları -->
        <div class="space-y-2">
          <div
            v-for="(m, i) in matches"
            :key="m.name"
            class="float-card flex items-center gap-2 rounded-lg border border-outline-variant border-l-[3px] border-l-primary bg-surface-container-lowest px-2.5 py-2"
            :style="{ animationDelay: `${i * 0.4}s` }"
          >
            <div class="min-w-0 flex-1">
              <div class="text-[12px] font-semibold text-on-surface truncate">{{ m.name }}</div>
              <div class="text-[10px] text-on-surface-variant truncate">{{ m.detail }}</div>
            </div>
            <span class="shrink-0 inline-flex items-center justify-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant">
              %{{ m.score }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-frame {
  animation: preview-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes preview-in {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

.float-card {
  animation: float 4.5s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .preview-frame, .float-card { animation: none; }
}
</style>
