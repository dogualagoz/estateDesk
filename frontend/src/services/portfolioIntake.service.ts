import { api } from './api';
import type { CreatePortfolioPayload } from '@/types/portfolio';

export interface IntakeLink {
  id: string;
  label: string | null;
  status: 'ACTIVE' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  submissionCount: number;
  link: string;
}

export interface IntakePreview {
  valid: boolean;
  invalidReason: 'EXPIRED' | 'REVOKED' | null;
  officeName?: string;
  agentName?: string;
}

export type IntakeSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IntakeSubmission {
  id: string;
  submitterName: string;
  submitterPhone: string;
  type: string;
  listingType: 'SALE' | 'RENT';
  title: string | null;
  city: string;
  district: string;
  neighborhood: string | null;
  areaSqm: number;
  roomCount: string;
  price: string | number;
  features: string[];
  description: string | null;
  images: string[];
  status: IntakeSubmissionStatus;
  rejectReason: string | null;
  portfolioId: string | null;
  reviewedAt: string | null;
  reviewedBy: { id: string; fullName: string } | null;
  link: { label: string | null; createdById: string };
  createdAt: string;
}

/** Public başvuru formunun metin alanları (FormData'ya yazılır). */
export interface IntakeSubmitFields {
  submitterName: string;
  submitterPhone: string;
  type: string;
  listingType: string;
  title?: string;
  city: string;
  district: string;
  neighborhood?: string;
  areaSqm: number;
  roomCount: string;
  price: number;
  features: string[];
  description?: string;
}

export const portfolioIntakeService = {
  // PUBLIC — mülk sahibi (auth yok)
  preview: (token: string) =>
    api.get<IntakePreview>(`/intake/${token}`).then((r) => r.data),

  submit: (token: string, fields: IntakeSubmitFields, files: File[]) => {
    const fd = new FormData();
    fd.append('submitterName', fields.submitterName);
    fd.append('submitterPhone', fields.submitterPhone);
    fd.append('type', fields.type);
    fd.append('listingType', fields.listingType);
    if (fields.title) fd.append('title', fields.title);
    fd.append('city', fields.city);
    fd.append('district', fields.district);
    if (fields.neighborhood) fd.append('neighborhood', fields.neighborhood);
    fd.append('areaSqm', String(fields.areaSqm));
    fd.append('roomCount', fields.roomCount);
    fd.append('price', String(fields.price));
    for (const f of fields.features) fd.append('features', f);
    if (fields.description) fd.append('description', fields.description);
    fd.append('kvkkAccepted', 'true');
    for (const file of files) fd.append('files', file);
    return api
      .post<{ success: boolean }>(`/intake/${token}/submissions`, fd)
      .then((r) => r.data);
  },

  // Danışman — link yönetimi
  createLink: (label?: string) =>
    api.post<IntakeLink>('/portfolio-intake/links', { label }).then((r) => r.data),

  listLinks: () => api.get<IntakeLink[]>('/portfolio-intake/links').then((r) => r.data),

  revokeLink: (id: string) =>
    api.delete<{ success: boolean }>(`/portfolio-intake/links/${id}`).then((r) => r.data),

  // Danışman — başvuru inceleme
  submissions: (status?: IntakeSubmissionStatus) =>
    api
      .get<IntakeSubmission[]>('/portfolio-intake/submissions', { params: { status } })
      .then((r) => r.data),

  pendingCount: () =>
    api.get<{ count: number }>('/portfolio-intake/submissions/count').then((r) => r.data),

  submission: (id: string) =>
    api.get<IntakeSubmission>(`/portfolio-intake/submissions/${id}`).then((r) => r.data),

  approve: (id: string, payload: CreatePortfolioPayload) =>
    api
      .post<{ success: boolean; portfolioId: string }>(
        `/portfolio-intake/submissions/${id}/approve`,
        payload,
      )
      .then((r) => r.data),

  reject: (id: string, reason?: string) =>
    api
      .post<{ success: boolean }>(`/portfolio-intake/submissions/${id}/reject`, { reason })
      .then((r) => r.data),
};
