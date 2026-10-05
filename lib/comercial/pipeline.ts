import type { SalesStageId } from './types';

export const OPEN_STAGE_IDS: SalesStageId[] = [
  'nuevo',
  'contactado',
  'interesado',
  'propuesta',
  'negociacion',
];

export function isClosedStage(stageId: string): boolean {
  return stageId === 'ganado' || stageId === 'perdido';
}

export function normalizeWhatsApp(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return null;
  return digits.slice(-9);
}
