// Admin API yanıt tipleri — izolasyon gereği ana types/ klasörüne taşınmaz.
import type { Role } from '@/types/user';

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalOffices: number;
  totalPortfolios: number;
  totalDemands: number;
  last24h: { logins: number; requests: number; serverErrors: number };
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  isDemo: boolean;
  officeId: string | null;
  office: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOffice {
  id: string;
  name: string;
  createdAt: string;
  feedbackEnabled: boolean;
  owner: { id: string; fullName: string; email: string };
  _count: { members: number; portfolios: number; demands: number; invites?: number };
}

export interface AdminFeedbackThread {
  officeId: string;
  officeName: string;
  lastMessageAt: string | null;
  lastMessageSnippet: string;
  unreadCount: number;
}

export interface AdminFeedbackMessage {
  id: string;
  body: string;
  fromAdmin: boolean;
  senderName: string;
  createdAt: string;
}

export interface AdminOfficeDetail extends AdminOffice {
  members: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    isActive: boolean;
    createdAt: string;
  }[];
  lastActivityAt: string | null;
}

export interface AdminRequestLog {
  id: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId: string | null;
  officeId: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string } | null;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  userId: string | null;
  officeId: string | null;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  requestId: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string } | null;
}

export interface AdminSummary {
  days: number;
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  newOffices: number;
  logins: number;
  topOffices: { officeId: string; name: string; requests: number }[];
}

export interface TimeseriesPoint {
  date: string;
  count: number;
}

export interface AdminSystem {
  dbPingMs: number;
  uptimeSeconds: number;
  nodeVersion: string;
  memoryMb: number;
  tables: { requestLogs: number; auditLogs: number };
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
