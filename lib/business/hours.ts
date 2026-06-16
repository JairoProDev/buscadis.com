import type { BusinessHours } from '@/types/business';

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

export function isBusinessOpenNow(hours: BusinessHours | undefined): boolean | null {
  if (!hours || Object.keys(hours).length === 0) return null;

  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const today = hours[dayKey];
  if (!today) return null;
  if (today.closed) return false;

  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  if (closeMins <= openMins) {
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}
