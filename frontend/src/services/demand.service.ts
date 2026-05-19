import { api } from './api';
import type {
  Demand,
  CreateDemandPayload,
  UpdateDemandPayload,
  DemandQuery,
} from '@/types/demand';
import type { Paginated } from '@/types/common';

export const demandService = {
  list: (q: DemandQuery = {}) =>
    api.get<Paginated<Demand>>('/demands', { params: q }).then((r) => r.data),
  get: (id: string) => api.get<Demand>(`/demands/${id}`).then((r) => r.data),
  create: (payload: CreateDemandPayload) =>
    api.post<Demand>('/demands', payload).then((r) => r.data),
  update: (id: string, payload: UpdateDemandPayload) =>
    api.patch<Demand>(`/demands/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/demands/${id}`).then((r) => r.data),
};
