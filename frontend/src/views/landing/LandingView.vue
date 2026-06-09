<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import LandingNav from '@/components/landing/LandingNav.vue';
import HeroSection from '@/components/landing/HeroSection.vue';
import StatsStrip from '@/components/landing/StatsStrip.vue';
import FeaturesSection from '@/components/landing/FeaturesSection.vue';
import ComponentShowcase from '@/components/landing/ComponentShowcase.vue';
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue';
import PricingSection from '@/components/landing/PricingSection.vue';
import FaqSection from '@/components/landing/FaqSection.vue';
import FinalCtaSection from '@/components/landing/FinalCtaSection.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';

const router = useRouter();
const toast = useToast();

const demoLoading = ref(false);

async function startDemo() {
  if (demoLoading.value) return;
  demoLoading.value = true;
  try {
    // Demo oturumunu route guard açar; tur "?tour=1" ile başlar
    await router.push({ name: 'demo', query: { tour: '1' } });
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Demo şu anda açılamadı, lütfen tekrar deneyin.');
  } finally {
    demoLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface font-sans antialiased">
    <LandingNav :demo-loading="demoLoading" @demo="startDemo" />

    <main>
      <HeroSection :demo-loading="demoLoading" @demo="startDemo" />
      <StatsStrip />
      <FeaturesSection />
      <ComponentShowcase />
      <HowItWorksSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection :demo-loading="demoLoading" @demo="startDemo" />
    </main>

    <LandingFooter @demo="startDemo" />
  </div>
</template>
