import type { Role } from './user';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface OfficeSummary {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; fullName: string };
  _count: { members: number; portfolios: number; demands: number };
}

export interface OfficeMember {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  portfolioCount: number;
  demandCount: number;
}

export interface Invite {
  id: string;
  email?: string | null;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  expiresInSeconds: number;
  expiresInDays: number;
  createdAt: string;
  link: string;
}

export interface InvitePreview {
  officeName: string;
  invitedByName: string;
  status: InviteStatus;
  expiresAt: string;
  expiresInSeconds: number;
  expiresInDays: number;
  valid: boolean;
}
