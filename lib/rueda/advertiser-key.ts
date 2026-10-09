/** Clave estable del anunciante (mismo teléfono Perú → misma cuenta). */
export function ruedaAdvertiserPhoneKey(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '').slice(-9);
  if (!/^9\d{8}$/.test(d)) return null;
  return `pe9:${d}`;
}
