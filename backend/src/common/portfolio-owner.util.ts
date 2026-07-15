const MASKED_OWNER_NAME = 'Gizli';

interface OwnerNameFields {
  ownerName: string;
  ownerNameVisible: boolean;
  createdById: string;
}

/**
 * Mal sahibi adı varsayılan olarak gizlidir: yalnızca ekleyen danışman görebilir.
 * Ekleyen danışman `ownerNameVisible` alanını açarsa ofisteki herkes (admin dahil) görebilir.
 */
export function maskOwnerName<T extends OwnerNameFields>(item: T, userId: string): T {
  if (item.createdById === userId || item.ownerNameVisible) return item;
  return { ...item, ownerName: MASKED_OWNER_NAME };
}

export function maskOwnerNames<T extends OwnerNameFields>(items: T[], userId: string): T[] {
  return items.map((item) => maskOwnerName(item, userId));
}
