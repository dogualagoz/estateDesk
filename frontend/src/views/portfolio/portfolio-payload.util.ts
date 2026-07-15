import type { UpdatePortfolioPayload } from '@/types/portfolio';
import type { PortfolioFormState } from './portfolio-form-context';

/**
 * Mal sahibi adı/görünürlüğü yalnızca ekleyen danışman değiştirebilir —
 * kilitliyken (maskelenmiş değeri ezmemek için) bu alanlar hiç gönderilmez.
 * Hem PortfolioFormView (create) hem PortfolioDetailView'in satır içi
 * düzenlemesi bu fonksiyonu kullanır.
 */
export function buildPortfolioPayload(
  form: PortfolioFormState,
  ownerVisibilityLocked: boolean,
): UpdatePortfolioPayload {
  const payload: UpdatePortfolioPayload = {
    type: form.type,
    listingType: form.listingType,
    title: form.title || undefined,
    city: form.city,
    district: form.district,
    neighborhood: form.neighborhood || undefined,
    areaSqm: Number(form.areaSqm) || 0,
    roomCount: form.roomCount,
    price: Number(form.price),
    features: [...form.features],
    visibility: form.visibility,
    note: form.note || undefined,
    ownerPhone: form.ownerPhone,
    isShareable: form.isShareable,
  };

  if (!ownerVisibilityLocked) {
    payload.ownerName = form.ownerName;
    payload.ownerNameVisible = form.ownerNameVisible;
  }

  return payload;
}
