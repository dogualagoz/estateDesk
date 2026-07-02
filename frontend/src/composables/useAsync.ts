import { ref } from 'vue';
import { useToast } from './useToast';

interface RunOptions {
  /** Hata durumunda gösterilecek varsayılan mesaj (API mesajı öncelikli). */
  errorMessage?: string;
  /** Başarıda gösterilecek toast (verilmezse toast çıkmaz). */
  successMessage?: string;
  /** Hata toast'ı kapatmak için false (hata yine error ref'ine yazılır). */
  toastError?: boolean;
}

/**
 * View'larda tekrar eden try/catch + loading + toast desenini tek yere toplar.
 *
 * Kullanım:
 *   const { run, loading, error } = useAsync();
 *   const silindi = await run(() => demandService.remove(id), {
 *     errorMessage: 'Silme başarısız',
 *     successMessage: 'Talep silindi',
 *   });
 *   if (silindi !== undefined) router.push('/demand');
 *
 * Başarısızlıkta `undefined` döner; başarıda fonksiyonun sonucunu döner.
 * Böylece çağıran taraf yönlendirme gibi devam adımlarını koşullayabilir.
 */
export function useAsync() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const toast = useToast();

  async function run<T>(fn: () => Promise<T>, opts: RunOptions = {}): Promise<T | undefined> {
    loading.value = true;
    error.value = null;
    try {
      const result = await fn();
      if (opts.successMessage) toast.success(opts.successMessage);
      return result;
    } catch (e: unknown) {
      // API hata gövdesindeki mesajı tercih et; yoksa çağıranın verdiği genel mesaj
      const apiMessage = (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      error.value = apiMessage || opts.errorMessage || 'İşlem başarısız';
      if (opts.toastError !== false) toast.error(error.value);
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  return { run, loading, error };
}
