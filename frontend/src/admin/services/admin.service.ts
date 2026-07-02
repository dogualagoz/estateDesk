import { api } from '@/services/api';
import type {
  AdminAuditLog,
  AdminOffice,
  AdminOfficeDetail,
  AdminOverview,
  AdminRequestLog,
  AdminSummary,
  AdminSystem,
  AdminUser,
  Paged,
  TimeseriesPoint,
} from '../types';

/** /admin API istemcisi — obje-literal servis deseni (diğer servislerle aynı). */
export const adminService = {
  overview: () => api.get<AdminOverview>('/admin/overview').then((r) => r.data),

  summary: (days = 30) =>
    api.get<AdminSummary>('/admin/analytics/summary', { params: { days } }).then((r) => r.data),

  timeseries: (metric: 'logins' | 'signups' | 'requests', days = 30) =>
    api
      .get<{ metric: string; days: number; points: TimeseriesPoint[] }>(
        '/admin/analytics/timeseries',
        { params: { metric, days } },
      )
      .then((r) => r.data),

  system: () => api.get<AdminSystem>('/admin/system').then((r) => r.data),

  // ── Kullanıcılar ──
  users: (params: {
    q?: string;
    status?: 'active' | 'inactive';
    role?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<Paged<AdminUser>>('/admin/users', { params }).then((r) => r.data),

  createUser: (payload: {
    email: string;
    fullName: string;
    password: string;
    role?: string;
    officeId?: string;
  }) => api.post<AdminUser>('/admin/users', payload).then((r) => r.data),

  updateUser: (
    id: string,
    payload: { fullName?: string; role?: string; isActive?: boolean; password?: string },
  ) => api.patch<AdminUser>(`/admin/users/${id}`, payload).then((r) => r.data),

  deactivateUser: (id: string) => api.delete<AdminUser>(`/admin/users/${id}`).then((r) => r.data),

  // ── Ofisler ──
  offices: (params: { q?: string; page?: number; pageSize?: number }) =>
    api.get<Paged<AdminOffice>>('/admin/offices', { params }).then((r) => r.data),

  office: (id: string) => api.get<AdminOfficeDetail>(`/admin/offices/${id}`).then((r) => r.data),

  deactivateOffice: (id: string) =>
    api
      .delete<{ success: boolean; deactivatedMembers: number }>(`/admin/offices/${id}`)
      .then((r) => r.data),

  // ── Loglar ──
  requestLogs: (params: Record<string, unknown>) =>
    api.get<Paged<AdminRequestLog>>('/admin/logs/requests', { params }).then((r) => r.data),

  auditLogs: (params: Record<string, unknown>) =>
    api.get<Paged<AdminAuditLog>>('/admin/logs/audit', { params }).then((r) => r.data),
};
