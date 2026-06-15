/** URL de bandera SVG (flagcdn) — funciona en Windows donde los emoji 🇵🇪 se ven como "PE" */
export function countryFlagUrl(code: string, width = 40): string {
  const c = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(c)) return '';
  const w = Math.min(Math.max(width, 20), 80);
  return `https://flagcdn.com/w${w}/${c}.png`;
}

export function countryFlagSrcSet(code: string, width = 40): string {
  const c = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(c)) return '';
  const w = Math.min(Math.max(width, 20), 80);
  return `https://flagcdn.com/w${w * 2}/${c}.png 2x`;
}

export function getLocationCountryCode(
  filter?: { countryCode?: string } | null,
  fallback = 'PE',
): string {
  return (filter?.countryCode || fallback).toUpperCase();
}
