import { api } from './api';
import type { SearchResults, SearchScope } from '@/types/search';

export const searchService = {
  global: (q: string, opts: { limit?: number; scope?: SearchScope } = {}) =>
    api
      .get<SearchResults>('/search', { params: { q, ...opts } })
      .then((r) => r.data),
};
