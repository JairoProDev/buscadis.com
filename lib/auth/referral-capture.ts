/**
 * Capture and persist referral codes (?ref=) for influencer attribution.
 */

const STORAGE_KEY = 'buscadis_ref';
const COOKIE_NAME = 'buscadis_ref';
const MAX_AGE_DAYS = 30;

export function captureReferralFromUrl(search?: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(search ?? window.location.search);
  const code = (params.get('ref') || '').trim().toUpperCase();
  if (!code || code.length < 4 || code.length > 32) return null;
  try {
    localStorage.setItem(STORAGE_KEY, code);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${MAX_AGE_DAYS * 86400}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  return code;
}

export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLs = localStorage.getItem(STORAGE_KEY);
    if (fromLs) return fromLs;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
