export type IntakeInvalidReason = 'EXPIRED' | 'REVOKED';

interface IntakeLinkLike {
  status: string;
  expiresAt: Date;
  office: { name: string };
  createdBy: { fullName: string };
}

/** Linkin geçersizlik nedenini ayırt eder (UI'da farklı mesajlar için). */
export function getIntakeInvalidReason(link: {
  status: string;
  expiresAt: Date;
}): IntakeInvalidReason | null {
  if (link.status === 'REVOKED') return 'REVOKED';
  if (link.expiresAt < new Date()) return 'EXPIRED';
  return null;
}

/**
 * Public önizleme yanıtı — allowlist (demand-share.sanitize deseni).
 * Id/officeId/token/başvuru verisi ASLA sızmaz; geçersiz linkte ofis/danışman
 * adı da verilmez.
 */
export function sanitizeIntakePreview(link: IntakeLinkLike) {
  const invalidReason = getIntakeInvalidReason(link);
  if (invalidReason) {
    return { valid: false as const, invalidReason };
  }
  return {
    valid: true as const,
    invalidReason: null,
    officeName: link.office.name,
    agentName: link.createdBy.fullName,
  };
}
