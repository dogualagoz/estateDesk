import { api } from './api';
import type { User } from '@/types/user';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
};
