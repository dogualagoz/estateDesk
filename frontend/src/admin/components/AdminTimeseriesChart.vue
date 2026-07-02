<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { TimeseriesPoint } from '../types';

/**
 * Günlük zaman serisi çizgi grafiği. Chart.js dinamik import edilir ve
 * yalnızca gerekli parçalar register edilir (tree-shaking) — admin chunk'ı
 * dışında ana bundle'a maliyeti yoktur.
 */
const props = defineProps<{
  points: TimeseriesPoint[];
  label: string;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
// Chart tipi dinamik import'tan geldiği için burada gevşek tutulur
let chart: { destroy(): void; data: any; update(): void } | null = null;

async function render() {
  if (!canvas.value) return;
  const {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Tooltip,
  } = await import('chart.js');
  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

  chart?.destroy();
  chart = new Chart(canvas.value, {
    type: 'line',
    data: buildData(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { tooltip: { intersect: false, mode: 'index' } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
      },
    },
  });
}

function buildData() {
  return {
    labels: props.points.map((p) => p.date.slice(5)), // "MM-DD"
    datasets: [
      {
        label: props.label,
        data: props.points.map((p) => p.count),
        borderColor: '#4e604f', // adaçayı — marka birincil rengi
        backgroundColor: 'rgba(78, 96, 79, 0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };
}

watch(
  () => props.points,
  () => {
    if (!chart) return;
    chart.data = buildData();
    chart.update();
  },
);

onMounted(render);
onBeforeUnmount(() => chart?.destroy());
</script>

<template>
  <div class="h-56">
    <canvas ref="canvas" />
  </div>
</template>
