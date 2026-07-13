import { api } from './api';

export interface FeedbackStatus {
  enabled: boolean;
  unreadCount: number;
}

export interface FeedbackMessage {
  id: string;
  body: string;
  fromAdmin: boolean;
  senderName: string;
  createdAt: string;
}

export const feedbackService = {
  status: () => api.get<FeedbackStatus>('/feedback/status').then((r) => r.data),

  messages: () => api.get<FeedbackMessage[]>('/feedback/messages').then((r) => r.data),

  send: (body: string) =>
    api.post<FeedbackMessage>('/feedback/messages', { body }).then((r) => r.data),

  markRead: () => api.post('/feedback/read').then((r) => r.data),
};
