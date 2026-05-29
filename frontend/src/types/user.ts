export type Role = 'ADMIN' | 'AGENT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  officeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** /users/:id profili — üye bilgisi + portföy/talep sayıları. */
export interface UserProfile extends User {
  portfolioCount: number;
  demandCount: number;
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
