<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { adminService } from '../services/admin.service';
import type { AdminFeedbackMessage, AdminFeedbackThread } from '../types';
import { useToast } from '@/composables/useToast';

const { error } = useToast();

const threads = ref<AdminFeedbackThread[]>([]);
const selected = ref<AdminFeedbackThread | null>(null);
const messages = ref<AdminFeedbackMessage[]>([]);
const loadingThreads = ref(false);
const loadingMessages = ref(false);
const draft = ref('');
const sending = ref(false);
const listRef = ref<HTMLElement | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  });
}

async function loadThreads() {
  loadingThreads.value = true;
  try {
    const res = await adminService.feedbackThreads({ pageSize: 100 });
    threads.value = res.items;
  } catch {
    error('Sohbetler yüklenemedi');
  } finally {
    loadingThreads.value = false;
  }
}

async function selectThread(t: AdminFeedbackThread) {
  selected.value = t;
  loadingMessages.value = true;
  try {
    messages.value = await adminService.feedbackMessages(t.officeId);
    scrollToBottom();
    if (t.unreadCount > 0) {
      await adminService.feedbackMarkRead(t.officeId);
      t.unreadCount = 0;
    }
  } catch {
    error('Mesajlar yüklenemedi');
  } finally {
    loadingMessages.value = false;
  }
}

async function reply() {
  if (!selected.value) return;
  const body = draft.value.trim();
  if (!body || sending.value) return;
  sending.value = true;
  try {
    const msg = await adminService.feedbackReply(selected.value.officeId, body);
    messages.value.push(msg);
    draft.value = '';
    scrollToBottom();
  } catch {
    error('Cevap gönderilemedi');
  } finally {
    sending.value = false;
  }
}

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  loadThreads();
  // Açık sohbeti ve listeyi tazele (AdminSystemView 30 sn poll deseni)
  pollTimer = setInterval(async () => {
    await loadThreads();
    if (selected.value) {
      messages.value = await adminService.feedbackMessages(selected.value.officeId).catch(() => messages.value);
    }
  }, 30_000);
});
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div class="p-6 h-[calc(100vh-0px)] flex flex-col">
    <div class="mb-4">
      <h1 class="text-headline-lg font-bold text-on-surface">Mesajlar</h1>
      <p class="text-label-md text-on-surface-variant">Ofislerden gelen geri bildirimler</p>
    </div>

    <div class="flex-1 min-h-0 flex gap-4">
      <!-- Sohbet listesi -->
      <div class="w-72 shrink-0 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-y-auto">
        <div v-if="loadingThreads && threads.length === 0" class="p-4 text-label-md text-on-surface-variant">
          Yükleniyor…
        </div>
        <p v-else-if="threads.length === 0" class="p-4 text-label-md text-on-surface-variant">
          Henüz mesaj yok.
        </p>
        <button
          v-for="t in threads"
          :key="t.officeId"
          class="w-full text-left px-4 py-3 border-b border-outline-variant/60 hover:bg-surface-container transition-colors"
          :class="selected?.officeId === t.officeId ? 'bg-primary-fixed/40' : ''"
          @click="selectThread(t)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-label-md font-semibold text-on-surface truncate">{{ t.officeName }}</span>
            <span
              v-if="t.unreadCount > 0"
              class="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center"
            >{{ t.unreadCount }}</span>
          </div>
          <p class="text-label-sm text-on-surface-variant truncate mt-0.5">{{ t.lastMessageSnippet }}</p>
          <p class="text-[11px] text-on-surface-variant/70 mt-0.5">{{ formatTime(t.lastMessageAt) }}</p>
        </button>
      </div>

      <!-- Sohbet paneli -->
      <div class="flex-1 min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest flex flex-col">
        <template v-if="selected">
          <div class="px-5 py-3 border-b border-outline-variant shrink-0">
            <h2 class="text-title-md font-semibold text-on-surface">{{ selected.officeName }}</h2>
          </div>

          <div ref="listRef" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div v-if="loadingMessages" class="text-label-md text-on-surface-variant">Yükleniyor…</div>
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex flex-col"
              :class="m.fromAdmin ? 'items-end' : 'items-start'"
            >
              <div
                class="max-w-[75%] rounded-xl px-3.5 py-2.5 text-body-md whitespace-pre-wrap break-words"
                :class="m.fromAdmin
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface'"
              >{{ m.body }}</div>
              <span class="text-label-sm text-on-surface-variant mt-1 px-1">
                {{ m.senderName }} · {{ formatTime(m.createdAt) }}
              </span>
            </div>
          </div>

          <div class="px-4 py-3 border-t border-outline-variant shrink-0">
            <form class="flex items-end gap-2" @submit.prevent="reply">
              <textarea
                v-model="draft"
                rows="2"
                maxlength="4000"
                placeholder="Cevabınızı yazın…"
                class="flex-1 resize-none rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
                @keydown.enter.exact.prevent="reply"
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
        </template>

        <div v-else class="flex-1 flex items-center justify-center text-on-surface-variant">
          <div class="text-center">
            <span class="material-symbols-outlined text-[44px] mb-2">forum</span>
            <p class="text-label-md">Bir sohbet seçin</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
