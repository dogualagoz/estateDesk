import { ref, watch, type Ref } from 'vue';

/** Sayıyı TR binlik ayraçlı metne çevirir (12500000 → "12.500.000"). */
export function formatTR(n: number | string | undefined | null): string {
  if (n == null || n === '') return '';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return Number.isNaN(num) ? '' : num.toLocaleString('tr-TR');
}

interface CurrencyInputOptions {
  /**
   * true: yazarken de binlik ayraçlı gösterir (portföy fiyat alanı davranışı).
   * false (varsayılan): yazarken ham rakam, blur'da biçimli (talep bütçe davranışı).
   */
  liveFormat?: boolean;
}

/**
 * TR binlik ayraçlı para/bütçe input davranışı.
 * Demand (bütçe) ve Portfolio (fiyat) formlarındaki tekrarın tek kaynağı.
 *
 * Kullanım:
 *   const minBudget = useCurrencyInput(toRef(form, 'minBudget'));
 *   <input :value="minBudget.display.value" @focus="minBudget.onFocus"
 *          @input="minBudget.onInput" @blur="minBudget.onBlur" />
 *
 * Model dışarıdan değişirse (edit modunda yükleme) görüntü otomatik eşitlenir.
 */
export function useCurrencyInput(model: Ref<number | undefined>, opts: CurrencyInputOptions = {}) {
  const display = ref(formatTR(model.value));

  // Dış kaynaklı model değişimini yakala (ör. edit yüklemesi). Kullanıcı
  // yazarken model ile display'in rakamları zaten eşit olduğundan no-op kalır.
  watch(model, (v) => {
    const displayDigits = display.value.replace(/[^\d]/g, '');
    const modelDigits = v != null ? String(v) : '';
    if (displayDigits !== modelDigits) display.value = formatTR(v);
  });

  function onFocus() {
    display.value = model.value?.toString() ?? '';
  }

  function onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = input.value.replace(/[^\d]/g, '');
    model.value = raw ? parseInt(raw) : undefined;
    if (opts.liveFormat) {
      const formatted = raw ? parseInt(raw).toLocaleString('tr-TR') : '';
      display.value = formatted;
      input.value = formatted;
      // İmleci sona taşı (biçimlendirme karakter eklediği için)
      requestAnimationFrame(() => input.setSelectionRange(formatted.length, formatted.length));
    } else {
      input.value = raw;
      display.value = raw;
    }
  }

  function onBlur(e: Event) {
    const formatted = formatTR(model.value);
    display.value = formatted;
    (e.target as HTMLInputElement).value = formatted;
  }

  return { display, onFocus, onInput, onBlur };
}
