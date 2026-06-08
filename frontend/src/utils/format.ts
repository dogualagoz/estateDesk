export function fmtPrice(p: string | number | null | undefined): string {
  if (p == null) return '—';
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', year: 'numeric' });
}
