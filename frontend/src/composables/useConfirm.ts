import { reactive, readonly } from 'vue';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Tehlikeli/yıkıcı işlem (silme, çıkış) — kırmızı vurgu ve ikon. */
  danger?: boolean;
  /** Başlıkta gösterilecek Material Symbols ikon adı. */
  icon?: string;
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'icon'>> {
  open: boolean;
  icon: string | null;
  resolve: ((value: boolean) => void) | null;
}

const state = reactive<ConfirmState>({
  open: false,
  title: '',
  message: '',
  confirmText: 'Onayla',
  cancelText: 'Vazgeç',
  danger: false,
  icon: null,
  resolve: null,
});

function settle(value: boolean) {
  state.open = false;
  state.resolve?.(value);
  state.resolve = null;
}

/**
 * Programatik onay modalı. Tarayıcı confirm()'ini değiştirir.
 *
 *   const ok = await confirm({ title: 'Silinsin mi?', danger: true });
 *   if (!ok) return;
 */
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    state.title = options.title;
    state.message = options.message ?? '';
    state.confirmText = options.confirmText ?? (options.danger ? 'Sil' : 'Onayla');
    state.cancelText = options.cancelText ?? 'Vazgeç';
    state.danger = options.danger ?? false;
    state.icon = options.icon ?? (options.danger ? 'warning' : 'help');
    state.open = true;
    return new Promise<boolean>((resolve) => {
      state.resolve = resolve;
    });
  }

  return {
    confirm,
    state: readonly(state),
    accept: () => settle(true),
    cancel: () => settle(false),
  };
}
