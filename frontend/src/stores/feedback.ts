import { ref } from 'vue';
import { defineStore } from 'pinia';
import { feedbackService, type FeedbackMessage } from '@/services/feedback.service';

/**
 * Geri bildirim kanalı durumu (beta). AppShell 60 sn'de bir fetchStatus
 * poll'lar; widget açıkken mesaj listesi ayrıca tazelenir.
 */
export const useFeedbackStore = defineStore('feedback', () => {
  const enabled = ref(false);
  const unreadCount = ref(0);
  const messages = ref<FeedbackMessage[]>([]);

  async function fetchStatus() {
    try {
      const s = await feedbackService.status();
      enabled.value = s.enabled;
      unreadCount.value = s.unreadCount;
    } catch {
      // Poll hatası sessiz geçilir (ör. oturum yenileme anı)
    }
  }

  async function fetchMessages() {
    messages.value = await feedbackService.messages();
  }

  async function send(body: string) {
    const msg = await feedbackService.send(body);
    messages.value.push(msg);
  }

  async function markRead() {
    unreadCount.value = 0;
    await feedbackService.markRead();
  }

  return { enabled, unreadCount, messages, fetchStatus, fetchMessages, send, markRead };
});
