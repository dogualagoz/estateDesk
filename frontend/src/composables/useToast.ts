import { reactive } from 'vue';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  /** Otomatik kapanma süresi (ms). 0 = otomatik kapanma yok. */
  duration: number;
}

const toasts = reactive<Toast[]>([]);
let seq = 0;

function dismiss(id: number) {
  const idx = toasts.findIndex((t) => t.id === id);
  if (idx >= 0) toasts.splice(idx, 1);
}

function push(type: ToastType, message: string, duration = 3500) {
  const id = ++seq;
  toasts.push({ id, type, message, duration });
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

/**
 * Global toast bildirim sistemi. Tarayıcı alert()'ini değiştirir ve
 * başarılı işlemler için sakin geri bildirim sağlar.
 */
export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message: string, duration?: number) => push('success', message, duration),
    error: (message: string, duration?: number) => push('error', message, duration),
    info: (message: string, duration?: number) => push('info', message, duration),
  };
}
