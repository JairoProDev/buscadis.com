export type IdentityDocType = 'dni_frente' | 'dni_reverso' | 'selfie';
export type IdentityKycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export const IDENTITY_DOC_TYPES: IdentityDocType[] = ['dni_frente', 'dni_reverso', 'selfie'];

export const IDENTITY_DOC_LABELS: Record<IdentityDocType, string> = {
  dni_frente: 'DNI frente',
  dni_reverso: 'DNI reverso',
  selfie: 'Selfie con el DNI',
};

/** Capabilities that require approved photo KYC. */
export const KYC_REQUIRED_CAPABILITIES = ['publish', 'business', 'rider'] as const;

export function normalizePersonName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalizePersonName(s).split(' ').filter((t) => t.length > 1));
}

/**
 * Jaccard-like overlap of name tokens (0–1).
 * Compares Google/display name vs padrón nombre completo.
 */
export function nameMatchScore(googleOrDisplay: string, padronFullName: string): number {
  const a = tokenSet(googleOrDisplay);
  const b = tokenSet(padronFullName);
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter += 1;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : Math.round((inter / union) * 100) / 100;
}

export function isIdentityKycApproved(status?: string | null): boolean {
  return status === 'approved';
}

export function requiresPhotoKyc(capability: string): boolean {
  return (KYC_REQUIRED_CAPABILITIES as readonly string[]).includes(capability);
}
