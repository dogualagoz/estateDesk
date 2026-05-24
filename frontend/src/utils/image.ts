const _apiBase = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export function resolveImgUrl(path: string): string {
  if (!path || path.startsWith('http') || path.startsWith('blob:')) return path;
  if (_apiBase.startsWith('http')) {
    return `${new URL(_apiBase).origin}${path}`;
  }
  return path;
}
