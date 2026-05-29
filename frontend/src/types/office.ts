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
  email: string;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  link: string;
}

export interface InvitePreview {
  email: string;
  officeName: string;
  invitedByName: string;
  status: InviteStatus;
  expiresAt: string;
  valid: boolean;
}
