<script setup lang="ts">
import { ref } from 'vue';

const faqs = [
  {
    q: 'emlakdefter tam olarak ne işe yarar?',
    a: 'Elinizdeki portföyleri (satılık/kiralık ilanlar) ve müşteri taleplerini tek yerde tutar; ikisini ağırlıklı bir puanlamayla otomatik eşleştirir. Böylece “elimde buna uygun bir şey var mıydı?” sorusunu sistem sizin yerinize cevaplar.',
  },
  {
    q: 'Eşleştirme nasıl çalışıyor?',
    a: 'Önce sert filtreler uygulanır (mülk tipi, kiralık/satılık, zorunlu özellikler). Ardından bütçe, konum yakınlığı, oda sayısı, alan ve bonus özellikler ayrı ayrı puanlanıp ağırlıklı bir skora dönüştürülür. Konum, 375 ilçenin koordinatıyla gerçek mesafeye göre hesaplanır.',
  },
  {
    q: 'Verilerim diğer ofislerle karışır mı?',
    a: 'Hayır. Her portföy ve talep bir ofise bağlıdır; tüm listeleme, arama ve eşleştirme yalnızca kendi ofisinizin verisiyle çalışır. Ofisler birbirinin verisini göremez.',
  },
  {
    q: 'Ekibimi nasıl eklerim?',
    a: 'Ofisinizin tek paylaşılabilir davet linkini ekip arkadaşlarınıza gönderirsiniz. Linke tıklayıp kaydolan herkes doğrudan ofisinize katılır. Yöneticiler rolleri ve üyeleri Ofisim ekranından yönetir.',
  },
  {
    q: 'Demo gerçek uygulamayı mı gösteriyor?',
    a: 'Evet. “Demo’yu İncele” ile içi dolu örnek bir ofise salt-okunur olarak girersiniz; gerçek ekranlarda gezer, adım adım tanıtım turuyla işleyişi görürsünüz. Demo modunda yapılan değişiklikler kaydedilmez.',
  },
  {
    q: 'Şu an ücret alıyor musunuz?',
    a: 'Hayır. Fiyatlandırma paketleri hazırlanıyor; şimdilik kaydolup tüm özellikleri ücretsiz kullanabilirsiniz. Kredi kartı gerekmez.',
  },
];

const open = ref<number | null>(0);
function toggle(i: number) {
  open.value = open.value === i ? null : i;
}
</script>

<template>
  <section id="faq" class="py-20 md:py-28">
    <div class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="text-center mb-12 md:mb-16" v-reveal>
        <span class="text-label-sm text-primary uppercase tracking-wider font-semibold">SSS</span>
        <h2 class="text-[28px] leading-9 md:text-headline-xl font-bold text-on-surface mt-2 tracking-tight">
          Sık sorulan sorular
        </h2>
      </div>

      <div class="space-y-3">
        <div
          v-for="(f, i) in faqs"
          :key="i"
          v-reveal="{ delay: Math.min(i, 4) * 60 }"
          class="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden transition-colors"
          :class="open === i ? 'border-primary/40' : ''"
        >
          <button
            class="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-surface-container-low transition-colors"
            @click="toggle(i)"
          >
            <span class="text-body-md font-semibold text-on-surface">{{ f.q }}</span>
            <span
              class="material-symbols-outlined text-[22px] text-primary shrink-0 transition-transform duration-300"
              :class="open === i ? 'rotate-180' : ''"
            >expand_more</span>
          </button>
          <div class="faq-body grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]" :class="open === i ? 'open' : ''">
            <div class="overflow-hidden">
              <p class="px-5 pb-5 text-label-md text-on-surface-variant leading-6">{{ f.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-body {
  grid-template-rows: 0fr;
}
.faq-body.open {
  grid-template-rows: 1fr;
}
</style>
