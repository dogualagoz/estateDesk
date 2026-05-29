import { api } from './api';
import type { OfficeSummary, OfficeMember, Invite, InvitePreview } from '@/types/office';

export const officeService = {
  create: (name: string) =>
    api.post<OfficeSummary>('/offices', { name }).then((r) => r.data),
  me: () => api.get<OfficeSummary>('/offices/me').then((r) => r.data),
  members: () => api.get<OfficeMember[]>('/offices/me/members').then((r) => r.data),

  createInvite: (email: string) =>
    api.post<Invite>('/offices/invites', { email }).then((r) => r.data),
  listInvites: () => api.get<Invite[]>('/offices/invites').then((r) => r.data),
  revokeInvite: (id: string) =>
    api.delete<{ success: boolean }>(`/offices/invites/${id}`).then((r) => r.data),

  previewInvite: (token: string) =>
    api.get<InvitePreview>(`/invites/${token}`).then((r) => r.data),
  acceptInvite: (token: string) =>
    api.post<OfficeSummary>(`/invites/${token}/accept`).then((r) => r.data),
};
