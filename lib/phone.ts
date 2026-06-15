/** Máscara visible cuando el usuario escribe un teléfono en el composer. */
export const PHONE_MASK = '••• ••• •••';

const PHONE_PATTERN =
  /(?:\+?(?:51|0)?[\s.\-()]*)?(?:9[\s.\-]?\d{2}[\s.\-]?\d{3}[\s.\-]?\d{3}|\d{2,3}[\s.\-]?\d{3}[\s.\-]?\d{4})|(?:\+?\d{1,3}[\s.\-]*)?\(?\d{2,4}\)?[\s.\-]?\d{3,4}[\s.\-]?\d{3,4}/gi;

const MASK_PATTERN = /•{3}\s*•{3}\s*•{3}/g;

export interface PhoneMatch {
  raw: string;
  normalized: string;
  index: number;
}

export function normalizePhoneDigits(digits: string): string {
  let d = digits.replace(/\D/g, '');
  if (d.startsWith('51') && d.length >= 11) d = d.slice(2);
  if (d.startsWith('0') && d.length === 10) d = d.slice(1);
  return d;
}

function isValidPhoneDigits(digits: string): boolean {
  const d = normalizePhoneDigits(digits);
  return d.length >= 9 && d.length <= 15;
}

export function findPhoneMatches(text: string): PhoneMatch[] {
  const matches: PhoneMatch[] = [];
  const re = new RegExp(PHONE_PATTERN.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const digits = raw.replace(/\D/g, '');
    if (!isValidPhoneDigits(digits)) continue;
    matches.push({
      raw,
      normalized: normalizePhoneDigits(digits),
      index: m.index,
    });
  }
  return matches;
}

export function maskPhonesInText(text: string): string {
  const matches = findPhoneMatches(text);
  if (!matches.length) return text;

  let result = text;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { raw, index } = matches[i];
    result = result.slice(0, index) + PHONE_MASK + result.slice(index + raw.length);
  }
  return result;
}

export function removePhonesFromText(text: string): string {
  let result = text.replace(MASK_PATTERN, '');

  const matches = findPhoneMatches(result);
  for (let i = matches.length - 1; i >= 0; i--) {
    const { raw, index } = matches[i];
    result = result.slice(0, index) + result.slice(index + raw.length);
  }

  return result
    .replace(/(?:whatsapp|wsp|cel|tel|telf|telefono|móvil|movil)\s*:?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[,.\-–]\s*/g, '')
    .trim();
}

export function extractPrimaryPhone(text: string, fallback?: string | null): string | null {
  const matches = findPhoneMatches(text);
  if (matches.length > 0) return matches[matches.length - 1].normalized;

  if (fallback?.trim()) {
    const digits = fallback.replace(/\D/g, '');
    if (isValidPhoneDigits(digits)) return normalizePhoneDigits(digits);
  }

  return null;
}
