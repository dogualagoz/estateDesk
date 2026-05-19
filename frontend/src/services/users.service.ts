import { api } from './api';
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user';

export const usersService = {
  list: () => api.get<User[]>('/users').then((r) => r.data),
  create: (payload: CreateUserPayload) => api.post<User>('/users', payload).then((r) => r.data),
  update: (id: string, payload: UpdateUserPayload) =>
    api.patch<User>(`/users/${id}`, payload).then((r) => r.data),
  deactivate: (id: string) => api.delete<User>(`/users/${id}`).then((r) => r.data),
};
