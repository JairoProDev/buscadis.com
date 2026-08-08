import type { Resena } from '../types';

export function inicialesFromNombre(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const ini = parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  return ini || '?';
}

/** Color determinista (no foto de banco) a partir del nombre. */
export function colorFromNombre(nombre: string): string {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 42% 42%)`;
}

export function distribuirEstrellas(
  resenas: Resena[]
): Partial<Record<1 | 2 | 3 | 4 | 5, number>> {
  const d: Partial<Record<1 | 2 | 3 | 4 | 5, number>> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const r of resenas) {
    d[r.estrellas] = (d[r.estrellas] ?? 0) + 1;
  }
  return d;
}

export function promedioEstrellas(resenas: Resena[]): number {
  if (!resenas.length) return 0;
  const sum = resenas.reduce((a, r) => a + r.estrellas, 0);
  return Math.round((sum / resenas.length) * 10) / 10;
}

export function fechaRelativa(iso: string, now = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const days = Math.floor((now.getTime() - t) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  return `Hace ${years} año${years > 1 ? 's' : ''}`;
}

export function resenaFromDbRow(row: Record<string, unknown>): Resena | null {
  const id = typeof row.id === 'string' ? row.id : null;
  const rating = typeof row.rating === 'number' ? row.rating : null;
  const created =
    typeof row.created_at === 'string' ? row.created_at : null;
  if (!id || !rating || !created) return null;
  const stars = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
  const nombre =
    (typeof row.customer_name === 'string' && row.customer_name) ||
    'Cliente Buscadis';
  const texto =
    (typeof row.text === 'string' && row.text) ||
    (typeof row.comment === 'string' && row.comment) ||
    undefined;
  const respuestaTexto =
    typeof row.owner_reply === 'string'
      ? row.owner_reply
      : typeof row.respuesta === 'string'
        ? row.respuesta
        : undefined;
  const respuestaFecha =
    typeof row.owner_reply_at === 'string' ? row.owner_reply_at : undefined;

  return {
    id,
    autor: { nombre, iniciales: inicialesFromNombre(nombre) },
    estrellas: stars,
    texto,
    contactoVerificado: Boolean(
      row.verified_purchase ?? row.is_verified ?? false
    ),
    respuesta:
      respuestaTexto && respuestaFecha
        ? { texto: respuestaTexto, fecha: respuestaFecha }
        : respuestaTexto
          ? { texto: respuestaTexto, fecha: created }
          : undefined,
    creadaEn: created,
  };
}
