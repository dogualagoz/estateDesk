import { api } from './api';
import type { User } from '@/types/user';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (payload: RegisterPayload) =>
    api.post<LoginResponse>('/auth/register', payload).then((r) => r.data),
  demoLogin: () => api.post<LoginResponse>('/auth/demo').then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
};
