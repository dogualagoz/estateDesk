<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { demandShareService } from '@/services/demandShare.service';
import { SHARE_MODE_LABELS, type DemandShare, type DemandShareMode } from '@/types/demandShare';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const props = defineProps<{
  open: boolean;
  demandId: string;
  pinnedCount: number;
  allCount: number;
  /** Popover'ın altına hizalanacağı tetikleyici buton. */
  anchor?: HTMLElement | null;
}>();
const emit = defineEmits<{ (e: 'close'): void }>();

const toast = useToast();
const { confirm } = useConfirm();

const mode = ref<DemandShareMode>('PINNED');
const note = ref('');
const creating = ref(false);
const shares = ref<DemandShare[]>([]);
const copied = ref(false);

/** Seçili moda ait aktif defter (varsa). */
const currentShare = computed(() => shares.value.find((s) => s.mode === mode.value) ?? null);

// ── Konumlandırma (butona göre, body'ye teleport) ──
const pos = reactive({ top: 0, right: 0 });
function reposition() {
  const el = props.anchor;
  if (!el) return;
  const r = el.getBoundingClientRect();
  pos.top = r.bottom + 8;
  pos.right = Math.max(8, window.innerWidth - r.right);
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      mode.value = props.pinnedCount > 0 ? 'PINNED' : 'ALL_MATCHES';
      note.value = '';
      copied.value = false;
      await nextTick();
      reposition();
      window.addEventListener('resize', reposition);
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('keydown', onKeydown);
      loadShares();
    } else {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('keydown', onKeydown);
    }
  },
);
onBeforeUnmount(() => {
  window.removeEventListener('resize', reposition);
  window.removeEventListener('scroll', reposition, true);
  window.removeEventListener('keydown', onKeydown);
});
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}

async function loadShares() {
  try {
    shares.value = await demandShareService.listShares(props.demandId);
  } catch {
    shares.value = [];
  }
}

async function create() {
  creating.value = true;
  try {
    const share = await demandShareService.createShare(props.demandId, {
      mode: mode.value,
      note: note.value.trim() || undefined,
    });
    shares.value = [share, ...shares.value];
    note.value = '';
    await copy(share);
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Bağlantı oluşturulamadı');
  } finally {
    creating.value = false;
  }
}

async function copy(share: DemandShare) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(share.link);
    } else {
      throw new Error('clipboard yok');
    }
  } catch {
    const ta = document.createElement('textarea');
    ta.value = share.link;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      document.body.removeChild(ta);
      toast.error('Bağlantı kopyalanamadı, manuel olarak kopyalayın');
      return;
    }
    document.body.removeChild(ta);
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

async function revoke(share: DemandShare) {
  const ok = await confirm({
    title: 'Bağlantıyı iptal et',
    message: 'Bu linke artık erişilemeyecek. Devam edilsin mi?',
    danger: true,
    icon: 'link_off',
  });
  if (!ok) return;
  try {
    await demandShareService.revokeShare(props.demandId, share.id);
    shares.value = shares.value.filter((s) => s.id !== share.id);
    toast.success('Bağlantı iptal edildi');
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'İptal başarısız');
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}
</script>

<template>
  <Teleport to="body">
    <!-- Dışarı tıkla-kapat (karartmasız) -->
    <div v-if="open" class="fixed inset-0 z-[240]" @click="emit('close')" />

    <Transition name="pop">
      <div
        v-if="open"
        class="fixed z-[250] w-[min(360px,calc(100vw-1rem))] rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant overflow-hidden"
        :style="{ top: pos.top + 'px', right: pos.right + 'px' }"
      >
        <!-- Başlık -->
        <div class="flex items-center gap-2 px-4 pt-3.5 pb-3 border-b border-outline-variant">
          <span class="material-symbols-outlined text-[20px] text-primary">menu_book</span>
          <p class="flex-1 text-body-md font-semibold text-on-surface">Defteri paylaş</p>
          <button
            class="p-1.5 -mr-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div class="px-4 py-3.5 space-y-3.5">
          <!-- Mod seçimi: segment kontrolü -->
          <div class="flex p-1 rounded-xl bg-surface-container">
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-label-md font-semibold transition-all"
              :class="mode === 'PINNED' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'"
              @click="mode = 'PINNED'"
            >
              <span class="material-symbols-outlined text-[16px]">bookmark</span>
              {{ SHARE_MODE_LABELS.PINNED }}
              <span class="text-[11px] font-bold opacity-70">{{ pinnedCount }}</span>
            </button>
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-label-md font-semibold transition-all"
              :class="mode === 'ALL_MATCHES' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'"
              @click="mode = 'ALL_MATCHES'"
            >
              <span class="material-symbols-outlined text-[16px]">join_inner</span>
              {{ SHARE_MODE_LABELS.ALL_MATCHES }}
              <span class="text-[11px] font-bold opacity-70">{{ allCount }}</span>
            </button>
          </div>

          <!-- DURUM A: aktif bağlantı var → Notion/Figma tarzı link kutusu -->
          <template v-if="currentShare">
            <div class="flex items-center gap-1.5 p-1.5 pl-3 rounded-xl border border-outline-variant bg-surface-container/40">
              <span class="material-symbols-outlined text-[18px] text-primary shrink-0">link</span>
              <span class="flex-1 text-label-md text-on-surface truncate">{{ currentShare.link }}</span>
              <button
                type="button"
                class="btn primary h-9 px-3.5 shrink-0"
                @click="copy(currentShare)"
              >
                <span class="material-symbols-outlined text-[16px]">{{ copied ? 'check' : 'content_copy' }}</span>
                {{ copied ? 'Kopyalandı' : 'Kopyala' }}
              </button>
            </div>
            <div class="flex items-center justify-between gap-2">
              <p class="text-label-sm text-on-surface-variant flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">schedule</span>
                {{ fmtDate(currentShare.expiresAt) }} tarihine kadar geçerli
              </p>
              <button
                type="button"
                class="text-label-sm font-medium text-error hover:underline"
                @click="revoke(currentShare)"
              >
                İptal et
              </button>
            </div>
          </template>

          <!-- DURUM B: bağlantı yok → not + oluştur -->
          <template v-else>
            <textarea
              v-model="note"
              rows="2"
              maxlength="280"
              class="textarea w-full text-label-md"
              placeholder="Not ekleyin (isteğe bağlı) — örn. Sayın Ahmet Bey, sizin için seçtiklerim."
            />
            <button
              type="button"
              class="btn primary w-full h-10"
              :disabled="creating"
              @click="create"
            >
              <span class="material-symbols-outlined text-[18px]">{{ creating ? 'hourglass_empty' : 'link' }}</span>
              {{ creating ? 'Oluşturuluyor…' : 'Bağlantı oluştur' }}
            </button>
            <p class="text-label-sm text-on-surface-variant/70 text-center">
              Bağlantıyı bilen herkes 7 gün boyunca görüntüleyebilir.
            </p>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: top right;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-6px);
}
</style>
