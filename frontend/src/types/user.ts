export type Role = 'ADMIN' | 'AGENT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  role?: Role;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  fullName?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}
