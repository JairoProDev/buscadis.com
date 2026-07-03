export const BASE_DAILY_RATE = 5;

export const DAILY_RATE_OPTIONS = [5, 10, 20] as const;
export type DailyRateOption = (typeof DAILY_RATE_OPTIONS)[number];

export const DAY_BUNDLES = [
  { days: 1, label: '1 día', discountLabel: null as string | null },
  { days: 7, label: '1 semana', discountLabel: 'S/ 35 → S/ 30' },
  { days: 30, label: '1 mes', discountLabel: 'S/ 150 → S/ 100' },
] as const;

export type DayBundle = (typeof DAY_BUNDLES)[number]['days'];

export function calculateTotalPrice(days: number, dailyRate: number): number {
  const base = dailyRate * days;
  if (days >= 30) return Math.min(base, 100 * (dailyRate / BASE_DAILY_RATE));
  if (days >= 7) return Math.min(base, 30 * (dailyRate / BASE_DAILY_RATE));
  return base;
}

export function calculateListPrice(days: number, dailyRate: number): number {
  return dailyRate * days;
}

export function hasDiscount(days: number): boolean {
  return days >= 7;
}

/** Exponential reach bonus: more spend = disproportionately more reach */
export function estimateDailyReach(dailyRate: number): number {
  const multiplier = dailyRate / BASE_DAILY_RATE;
  const base = 500;
  const bonus = Math.pow(multiplier, 1.15);
  return Math.round(base * bonus);
}

export function estimateTotalReach(dailyRate: number, days: number): number {
  return estimateDailyReach(dailyRate) * days;
}

export function formatPrice(amount: number): string {
  return `S/ ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function getYapePhone(): string {
  return process.env.NEXT_PUBLIC_YAPE_PHONE || process.env.YAPE_PHONE || '999999999';
}

export function getYapeQrUrl(): string | null {
  return process.env.NEXT_PUBLIC_YAPE_QR_URL || process.env.YAPE_QR_URL || null;
}

export function buildWhatsAppPaymentMessage(params: {
  adisoId: string;
  total: number;
  days: number;
  dailyRate: number;
}): string {
  const phone = getYapePhone();
  return encodeURIComponent(
    `Hola, acabo de publicar mi aviso en Buscadis (${params.adisoId}). ` +
      `Pagé S/ ${params.total} por ${params.days} día(s) a S/ ${params.dailyRate}/día. ` +
      `Adjunto captura de Yape al ${phone}.`
  );
}
