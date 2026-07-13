<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
import { useFeedbackStore } from '@/stores/feedback';
import { useToast } from '@/composables/useToast';

const feedback = useFeedbackStore();
const { error } = useToast();

const open = ref(false);
const draft = ref('');
const sending = ref(false);
const loading = ref(false);
const listRef = ref<HTMLElement | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  });
}

async function refresh() {
  await feedback.fetchMessages();
  scrollToBottom();
}

async function openModal() {
  open.value = true;
  loading.value = true;
  try {
    await refresh();
    await feedback.markRead();
  } catch {
    error('Mesajlar yüklenemedi');
  } finally {
    loading.value = false;
  }
  // Açıkken yeni admin cevaplarını yakala
  pollTimer = setInterval(async () => {
    await feedback.fetchMessages();
    await feedback.markRead();
  }, 10_000);
}

function closeModal() {
  open.value = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function send() {
  const body = draft.value.trim();
  if (!body || sending.value) return;
  sending.value = true;
  try {
    await feedback.send(body);
    draft.value = '';
    scrollToBottom();
  } catch {
    error('Mesaj gönderilemedi');
  } finally {
    sending.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal();
}

watch(open, (v) => {
  if (v) window.addEventListener('keydown', handleKeydown);
  else window.removeEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  window.removeEventListener('keydown', handleKeydown);
});

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

defineExpose({ openModal });
</script>

<template>
  <!-- Sidebar butonu -->
  <button
    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-md text-on-primary/65 hover:bg-white/10 hover:text-on-primary transition-colors duration-150 w-full"
    @click="openModal"
  >
    <span class="relative">
      <span class="material-symbols-outlined text-[20px]">forum</span>
      <span
        v-if="feedback.unreadCount > 0"
        class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center"
      >{{ feedback.unreadCount > 9 ? '9+' : feedback.unreadCount }}</span>
    </span>
    Geri Bildirim
  </button>

  <!-- Sohbet modalı -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-4"
        @click.self="closeModal"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal" />

        <div class="add-sheet relative bg-surface-container-lowest rounded-t-2xl md:rounded-2xl shadow-lg w-full max-w-none md:max-w-lg flex flex-col max-h-[85vh] md:max-h-[600px]">
          <div class="md:hidden mx-auto mt-2 h-1.5 w-10 rounded-full bg-outline-variant shrink-0" />

          <!-- Başlık -->
          <div class="flex items-center justify-between px-6 pt-4 pb-3 border-b border-outline-variant shrink-0">
            <div>
              <h2 class="text-headline-md font-semibold text-on-surface">Bize Yazın</h2>
              <p class="text-label-sm text-on-surface-variant">Görüş ve önerileriniz doğrudan bize ulaşır</p>
            </div>
            <button
              class="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
              @click="closeModal"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Mesaj listesi -->
          <div ref="listRef" class="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[240px]">
            <div v-if="loading" class="flex justify-center py-8">
              <span class="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
            </div>
            <p
              v-else-if="feedback.messages.length === 0"
              class="text-center text-label-md text-on-surface-variant py-8"
            >
              Görüş ve önerilerinizi buradan iletebilirsiniz.
            </p>
            <div
              v-for="m in feedback.messages"
              :key="m.id"
              class="flex flex-col"
              :class="m.fromAdmin ? 'items-start' : 'items-end'"
            >
              <div
                class="max-w-[85%] rounded-xl px-3.5 py-2.5 text-body-md whitespace-pre-wrap break-words"
                :class="m.fromAdmin
                  ? 'bg-surface-container text-on-surface'
                  : 'bg-primary text-on-primary'"
              >{{ m.body }}</div>
              <span class="text-label-sm text-on-surface-variant mt-1 px-1">
                {{ m.fromAdmin ? 'EstateDesk' : m.senderName }} · {{ formatTime(m.createdAt) }}
              </span>
            </div>
          </div>

          <!-- Yazma alanı -->
          <div class="px-4 py-3 border-t border-outline-variant shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3">
            <form class="flex items-end gap-2" @submit.prevent="send">
              <textarea
                v-model="draft"
                rows="2"
                maxlength="4000"
                placeholder="Mesajınızı yazın…"
                class="flex-1 resize-none rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
                @keydown.enter.exact.prevent="send"
              />
              <button
                type="submit"
                :disabled="sending || !draft.trim()"
                class="h-10 px-4 rounded-lg bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50 transition-opacity flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-[18px]">send</span>
                Gönder
              </button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
