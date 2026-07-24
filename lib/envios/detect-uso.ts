import type { MotoCategory, UsoDetectado } from './types';

/**
 * Inferencia silenciosa de uso (viaje vs envío).
 * No se muestra en UI — solo analytics / admin.
 */
const VIAJE_PATTERNS: RegExp[] = [
  /\bviaje\b/i,
  /\bpasajer[oa]s?\b/i,
  /\bllevarme\b/i,
  /\bllevame\b/i,
  /\brecoger\s+(a\s+)?(alguien|persona|mi|me)\b/i,
  /\btaxi\b/i,
  /\bmoto\s*taxi\b/i,
  /\bme\s+llevan?\b/i,
  /\bme\s+recogen?\b/i,
  /\bir\s+a\b/i,
  /\bllegar\s+a\b/i,
  /\baeropuerto\b/i,
  /\btraslado\b/i,
  /\bpersona\b/i,
  /\byo\s+voy\b/i,
  /\bnecesito\s+(ir|llegar|moverme)\b/i,
];

export function detectUso(
  category: MotoCategory,
  description: string
): UsoDetectado {
  const text = (description || '').trim();

  if (category === 'paquete' || category === 'documentos' || category === 'mandado') {
    if (VIAJE_PATTERNS.some((re) => re.test(text))) return 'posible_viaje';
    return 'envio';
  }

  if (category === 'olvidado') {
    if (VIAJE_PATTERNS.some((re) => re.test(text))) return 'posible_viaje';
    return 'envio';
  }

  // otro — principal camuflaje de viajes
  if (!text) return 'desconocido';
  if (VIAJE_PATTERNS.some((re) => re.test(text))) return 'posible_viaje';

  return 'envio';
}
