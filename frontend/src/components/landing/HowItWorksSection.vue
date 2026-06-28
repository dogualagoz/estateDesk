<script setup lang="ts">
const steps = [
  {
    title: 'Portföyü ekleyin',
    body: 'İlanı tipi, konumu, fiyatı ve özellikleriyle kaydedin. Fotoğrafları sürükleyip bırakın.',
  },
  {
    title: 'Talebi tanımlayın',
    body: 'Müşterinin aradığı bütçe, bölge ve kriterleri girin. Birden fazla lokasyon seçebilirsiniz.',
  },
  {
    title: 'Eşleşmeyi yakalayın',
    body: 'Sistem en güçlü eşleşmeleri puanlayıp önünüze koyar. Doğru müşteriyi doğru mülkle buluşturun.',
  },
];
</script>

<template>
  <section id="how" class="py-20 md:py-28">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="max-w-2xl mb-12 md:mb-16" v-reveal>
        <span class="text-label-sm text-primary uppercase tracking-wider font-semibold">Nasıl Çalışır</span>
        <h2 class="text-[28px] leading-9 md:text-headline-xl font-bold text-on-surface mt-2 tracking-tight">
          Üç adımda fırsata dönüşür
        </h2>
      </div>

      <div class="grid md:grid-cols-3 gap-8 md:gap-6">

        <!-- ADIM 1: Portföyü ekleyin -->
        <div v-reveal="{ delay: 0 }" class="flex flex-col gap-4 h-full">
          <div class="mock-frame">
            <div class="browser-bar">
              <span class="dot bg-[#ff5f57]" /><span class="dot bg-[#febc2e]" /><span class="dot bg-[#28c840]" />
              <div class="ml-2 flex-1 h-3 rounded-full bg-surface-container max-w-[120px]" />
            </div>
            <div class="content-area">
              <div class="flex items-center justify-between mb-2">
                <div class="text-[11px] font-semibold text-on-surface">Yeni Portföy</div>
                <span class="step-badge">1</span>
              </div>
              <div class="field-label">İlan Tipi</div>
              <div class="flex gap-1.5 mt-1 mb-2.5">
                <span class="mock-chip active">Daire</span>
                <span class="mock-chip">Villa</span>
                <span class="mock-chip">Arsa</span>
              </div>
              <div class="flex gap-1.5 mb-2.5">
                <div class="mock-select flex-1">Satılık ▾</div>
                <div class="mock-input-sm flex-1">İstanbul, Kadıköy</div>
              </div>
              <div class="field-label">Fiyat</div>
              <div class="mock-input-row mt-1 mb-2.5">
                <span class="text-[10px] text-on-surface-variant pr-1.5 border-r border-outline-variant mr-1.5">₺</span>
                <span class="text-[11px] font-semibold text-on-surface">6.500.000</span>
              </div>
              <div class="field-label">Oda Sayısı</div>
              <div class="flex gap-1.5 mt-1 mb-2.5">
                <span class="mock-chip">1+1</span>
                <span class="mock-chip">2+1</span>
                <span class="mock-chip active">3+1</span>
                <span class="mock-chip">4+1</span>
              </div>
              <div class="field-label">Net Alan (m²)</div>
              <div class="mock-input-row mt-1 mb-2.5">
                <span class="text-[11px] font-semibold text-on-surface">145</span>
                <span class="text-[10px] text-on-surface-variant ml-1">m²</span>
              </div>
              <!-- spacer -->
              <div class="flex-1" />
              <div class="upload-zone mb-2.5">
                <span class="material-symbols-outlined text-[16px] text-on-surface-variant">cloud_upload</span>
                <span class="text-[9px] text-on-surface-variant ml-1">Fotoğraf sürükle veya seç</span>
              </div>
              <button class="mock-btn">Portföyü Kaydet</button>
            </div>
          </div>
          <div>
            <h3 class="text-body-lg font-semibold text-on-surface">{{ steps[0].title }}</h3>
            <p class="text-label-md text-on-surface-variant leading-6 mt-1.5">{{ steps[0].body }}</p>
          </div>
        </div>

        <!-- ADIM 2: Talebi tanımlayın -->
        <div v-reveal="{ delay: 120 }" class="flex flex-col gap-4 h-full">
          <div class="mock-frame">
            <div class="browser-bar">
              <span class="dot bg-[#ff5f57]" /><span class="dot bg-[#febc2e]" /><span class="dot bg-[#28c840]" />
              <div class="ml-2 flex-1 h-3 rounded-full bg-surface-container max-w-[120px]" />
            </div>
            <div class="content-area">
              <div class="flex items-center justify-between mb-2">
                <div class="text-[11px] font-semibold text-on-surface">Yeni Talep</div>
                <span class="step-badge">2</span>
              </div>
              <div class="field-label">Müşteri</div>
              <div class="mock-input-row mt-1 mb-2.5">
                <span class="text-[11px] text-on-surface">Yılmaz Ailesi</span>
              </div>
              <div class="field-label">Bütçe Aralığı</div>
              <div class="flex gap-1.5 mt-1 mb-2.5">
                <div class="mock-input-row flex-1">
                  <span class="text-[10px] text-on-surface-variant mr-1">Min ₺</span>
                  <span class="text-[11px] font-medium text-on-surface">5.000.000</span>
                </div>
                <div class="mock-input-row flex-1">
                  <span class="text-[10px] text-on-surface-variant mr-1">Max ₺</span>
                  <span class="text-[11px] font-medium text-on-surface">8.000.000</span>
                </div>
              </div>
              <div class="field-label">Lokasyon <span class="text-primary">(çoklu)</span></div>
              <div class="flex flex-wrap gap-1.5 mt-1 mb-2.5">
                <span class="mock-tag">Kadıköy</span>
                <span class="mock-tag">Üsküdar</span>
                <span class="mock-tag">Maltepe</span>
                <span class="mock-tag-add">+ Ekle</span>
              </div>
              <div class="field-label">Özellikler</div>
              <div class="flex gap-1.5 mt-1 mb-2.5 flex-wrap">
                <span class="mock-chip active">Balkon</span>
                <span class="mock-chip active">Ebeveyn</span>
                <span class="mock-chip">Garaj</span>
              </div>
              <div class="field-label">Oda</div>
              <div class="flex gap-1.5 mt-1 mb-2.5">
                <span class="mock-chip">2+1</span>
                <span class="mock-chip active">3+1</span>
                <span class="mock-chip active">4+1</span>
              </div>
              <div class="field-label">Net Alan (m²)</div>
              <div class="flex gap-1.5 mt-1 mb-2.5">
                <div class="mock-input-row flex-1">
                  <span class="text-[10px] text-on-surface-variant mr-1">Min</span>
                  <span class="text-[11px] font-medium text-on-surface">100</span>
                </div>
                <div class="mock-input-row flex-1">
                  <span class="text-[10px] text-on-surface-variant mr-1">Max</span>
                  <span class="text-[11px] font-medium text-on-surface">200</span>
                </div>
              </div>
              <!-- spacer -->
              <div class="flex-1" />
              <button class="mock-btn">Talebi Kaydet</button>
            </div>
          </div>
          <div>
            <h3 class="text-body-lg font-semibold text-on-surface">{{ steps[1].title }}</h3>
            <p class="text-label-md text-on-surface-variant leading-6 mt-1.5">{{ steps[1].body }}</p>
          </div>
        </div>

        <!-- ADIM 3: Eşleşmeyi yakalayın -->
        <div v-reveal="{ delay: 240 }" class="flex flex-col gap-4 h-full">
          <div class="mock-frame">
            <div class="browser-bar">
              <span class="dot bg-[#ff5f57]" /><span class="dot bg-[#febc2e]" /><span class="dot bg-[#28c840]" />
              <div class="ml-2 flex-1 h-3 rounded-full bg-surface-container max-w-[120px]" />
            </div>
            <div class="content-area">
              <div class="flex items-center justify-between mb-2">
                <div class="text-[11px] font-semibold text-on-surface">Eşleşmeler</div>
                <span class="step-badge">3</span>
              </div>
              <!-- Talep özeti -->
              <div class="rounded-lg bg-primary/8 border border-primary/20 px-2.5 py-2 flex items-center gap-2 mb-2.5">
                <span class="material-symbols-outlined text-[14px] text-primary">person_search</span>
                <div class="min-w-0">
                  <div class="text-[10px] font-semibold text-primary truncate">Yılmaz Ailesi · 3+1 · Kadıköy</div>
                  <div class="text-[9px] text-on-surface-variant">5M–8M ₺ · 3 lokasyon</div>
                </div>
              </div>
              <!-- Eşleşme kartları -->
              <div class="space-y-1.5">
                <div class="match-card">
                  <div class="score-badge high">%94</div>
                  <div class="min-w-0 flex-1">
                    <div class="text-[11px] font-semibold text-on-surface truncate">Bağdat Cad. 3+1</div>
                    <div class="text-[9px] text-on-surface-variant">Kadıköy · 6.5M ₺ · 145 m²</div>
                  </div>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
                </div>
                <div class="match-card">
                  <div class="score-badge mid">%87</div>
                  <div class="min-w-0 flex-1">
                    <div class="text-[11px] font-semibold text-on-surface truncate">Moda Mahallesi 3+1</div>
                    <div class="text-[9px] text-on-surface-variant">Kadıköy · 7.2M ₺ · 138 m²</div>
                  </div>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
                </div>
                <div class="match-card">
                  <div class="score-badge mid">%79</div>
                  <div class="min-w-0 flex-1">
                    <div class="text-[11px] font-semibold text-on-surface truncate">Altıyol 4+1 Geniş</div>
                    <div class="text-[9px] text-on-surface-variant">Kadıköy · 7.8M ₺ · 172 m²</div>
                  </div>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
                </div>
                <div class="match-card opacity-50">
                  <div class="score-badge low">%61</div>
                  <div class="min-w-0 flex-1">
                    <div class="text-[11px] font-semibold text-on-surface truncate">Fenerbahçe 3+1</div>
                    <div class="text-[9px] text-on-surface-variant">Kadıköy · 5.9M ₺ · 118 m²</div>
                  </div>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
                </div>
                <div class="match-card opacity-25">
                  <div class="score-badge low">%54</div>
                  <div class="min-w-0 flex-1">
                    <div class="text-[11px] font-semibold text-on-surface truncate">Kozyatağı 3+1</div>
                    <div class="text-[9px] text-on-surface-variant">Kadıköy · 5.2M ₺ · 110 m²</div>
                  </div>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
                </div>
              </div>
              <!-- spacer -->
              <div class="flex-1" />
              <!-- Alt bilgi -->
              <div class="text-[9px] text-on-surface-variant text-center pt-2 mt-2 border-t border-outline-variant">
                23 portföy tarandı · 5 güçlü eşleşme bulundu
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-body-lg font-semibold text-on-surface">{{ steps[2].title }}</h3>
            <p class="text-label-md text-on-surface-variant leading-6 mt-1.5">{{ steps[2].body }}</p>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.mock-frame {
  @apply flex-1 flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest shadow-md overflow-hidden select-none;
}

.browser-bar {
  @apply flex items-center gap-1.5 px-3 h-7 bg-surface-container-low border-b border-outline-variant shrink-0;
}

.dot {
  @apply w-2 h-2 rounded-full;
}

.content-area {
  @apply flex-1 flex flex-col p-3 bg-surface;
}

.step-badge {
  @apply inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold;
}

.field-label {
  @apply text-[9px] uppercase tracking-wider text-on-surface-variant font-semibold;
}

.mock-input-row {
  @apply flex items-center h-7 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5;
}

.mock-input-sm {
  @apply flex items-center h-7 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 text-[10px] text-on-surface-variant;
}

.mock-select {
  @apply flex items-center h-7 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 text-[10px] text-on-surface cursor-default;
}

.mock-chip {
  @apply inline-flex items-center px-2 py-0.5 rounded-full border border-outline-variant bg-surface-container text-[9px] text-on-surface-variant cursor-default;
}
.mock-chip.active {
  @apply border-primary bg-primary/10 text-primary font-semibold;
}

.mock-tag {
  @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[9px] font-medium;
}
.mock-tag-add {
  @apply inline-flex items-center px-2 py-0.5 rounded-full border border-dashed border-primary text-primary text-[9px] cursor-default;
}

.upload-zone {
  @apply flex items-center justify-center h-10 rounded-lg border border-dashed border-outline-variant bg-surface-container;
}

.mock-btn {
  @apply w-full h-7 rounded-lg bg-primary text-on-primary text-[10px] font-semibold cursor-default;
}

.match-card {
  @apply flex items-center gap-2 rounded-lg border border-outline-variant border-l-[3px] border-l-primary bg-surface-container-lowest px-2 py-1.5;
}

.score-badge {
  @apply shrink-0 inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded-full;
}
.score-badge.high {
  @apply bg-primary-fixed text-on-primary-fixed-variant;
}
.score-badge.mid {
  @apply bg-surface-container-highest text-on-surface-variant;
}
.score-badge.low {
  @apply bg-surface-container-high text-on-surface-variant;
}
</style>
