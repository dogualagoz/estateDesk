import { api } from './api';
import type {
  DemandShare,
  DemandShareMode,
  SharedCollectionResponse,
} from '@/types/demandShare';

/** Backend link'i yoksa frontend origin'inden tamamla (invite deseni). */
function withLink(s: DemandShare): DemandShare {
  return { ...s, link: s.link ?? `${window.location.origin}/defter/${s.token}` };
}

export const demandShareService = {
  createShare: (demandId: string, payload: { mode: DemandShareMode; note?: string }) =>
    api.post<DemandShare>(`/demand/${demandId}/shares`, payload).then((r) => withLink(r.data)),

  listShares: (demandId: string) =>
    api
      .get<DemandShare[]>(`/demand/${demandId}/shares`)
      .then((r) => r.data.map(withLink)),

  revokeShare: (demandId: string, shareId: string) =>
    api.delete(`/demand/${demandId}/shares/${shareId}`).then((r) => r.data),

  // PUBLIC — ziyaretçi defter görüntüleme (auth header yok)
  getSharedCollection: (token: string) =>
    api.get<SharedCollectionResponse>(`/shared/${token}`).then((r) => r.data),
};
