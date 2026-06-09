import { api } from './api';
import type { Role } from '@/types/user';
import type { OfficeSummary, OfficeMember, Invite, InvitePreview } from '@/types/office';

export type ExportDataset = 'portfolios' | 'demands';
export type ExportFormat = 'csv' | 'xlsx';

export const officeService = {
  create: (name: string) =>
    api.post<OfficeSummary>('/offices', { name }).then((r) => r.data),
  me: () => api.get<OfficeSummary>('/offices/me').then((r) => r.data),
  rename: (name: string) =>
    api.patch<OfficeSummary>('/offices/me', { name }).then((r) => r.data),
  members: () => api.get<OfficeMember[]>('/offices/me/members').then((r) => r.data),
  removeMember: (memberId: string) =>
    api.delete<{ success: boolean }>(`/offices/members/${memberId}`).then((r) => r.data),
  changeMemberRole: (memberId: string, role: Role) =>
    api
      .patch<{ success: boolean }>(`/offices/members/${memberId}/role`, { role })
      .then((r) => r.data),

  /** Portföy/talep verisini CSV veya XLSX olarak indirir. */
  exportData: async (
    dataset: ExportDataset,
    format: ExportFormat,
    memberId?: string,
  ) => {
    const res = await api.get('/offices/export', {
      params: { dataset, format, ...(memberId ? { memberId } : {}) },
      responseType: 'blob',
    });

    // Dosya adını Content-Disposition başlığından çöz, yoksa makul bir varsayılan üret
    const disposition = res.headers['content-disposition'] as string | undefined;
    let filename = `estatedesk-${dataset}.${format}`;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = decodeURIComponent(match[1]);

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Ofis başına tek paylaşılan davet linki (Notion/Figma mantığı)
  getInviteLink: () => api.get<Invite>('/offices/invite-link').then((r) => r.data),
  resetInviteLink: () =>
    api.post<Invite>('/offices/invite-link/reset', {}).then((r) => r.data),

  createInvite: () =>
    api.post<Invite>('/offices/invites', {}).then((r) => r.data),
  listInvites: () => api.get<Invite[]>('/offices/invites').then((r) => r.data),
  revokeInvite: (id: string) =>
    api.delete<{ success: boolean }>(`/offices/invites/${id}`).then((r) => r.data),

  previewInvite: (token: string) =>
    api.get<InvitePreview>(`/invites/${token}`).then((r) => r.data),
  registerWithInvite: (token: string, payload: { email: string; password: string; fullName: string }) =>
    api.post<any>(`/invites/${token}/register`, payload).then((r) => r.data),
  acceptInvite: (token: string) =>
    api.post<OfficeSummary>(`/invites/${token}/accept`).then((r) => r.data),

  leaveOffice: () =>
    api.delete<{ success: boolean }>('/offices/leave').then((r) => r.data),
};
