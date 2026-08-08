import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CanalHandoff, HandoffPayload } from '../types';

const DEFAULT_SECRET = 'perfil-vivo-demo-handoff-dev-only';

function secret(): string {
  return process.env.PERFIL_VIVO_HANDOFF_SECRET || DEFAULT_SECRET;
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8');
  return b
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

export function crearTokenHandoff(
  payload: Omit<HandoffPayload, 'ts'> & { ts?: number }
): string {
  const body: HandoffPayload = {
    ...payload,
    ts: payload.ts ?? Date.now(),
  };
  const data = b64url(JSON.stringify(body));
  const sig = b64url(createHmac('sha256', secret()).update(data).digest());
  return `${data}.${sig}`;
}

export function verificarTokenHandoff(token: string): HandoffPayload | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = b64url(createHmac('sha256', secret()).update(data).digest());
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const json = fromB64url(data).toString('utf8');
    const parsed = JSON.parse(json) as HandoffPayload;
    if (!parsed.destino || !parsed.canal || !parsed.negocioId) return null;
    // Tokens older than 7 days rejected
    if (Date.now() - parsed.ts > 7 * 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function waMeUrl(phoneE164: string, text: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function mensajeWhatsAppPerfil(nombre: string): string {
  return `Hola, vi el perfil de ${nombre} en Buscadis y me gustaría más información.`;
}

export function mensajeWhatsAppProducto(
  nombreNegocio: string,
  nombreProducto: string,
  precioLabel?: string
): string {
  const p = precioLabel ? ` (${precioLabel})` : '';
  return `Hola, vi en Buscadis su ${nombreProducto}${p}. ¿Tienen stock?`;
}

export function buildHandoffPath(token: string): string {
  return `/r/${encodeURIComponent(token)}`;
}

export function crearHandoffWhatsApp(opts: {
  negocioId: string;
  slug: string;
  phone: string;
  nombre: string;
  modulo: string;
  productoId?: string;
  mensaje?: string;
}): string {
  const mensaje =
    opts.mensaje ?? mensajeWhatsAppPerfil(opts.nombre);
  const destino = waMeUrl(opts.phone, mensaje);
  const token = crearTokenHandoff({
    negocioId: opts.negocioId,
    slug: opts.slug,
    canal: 'whatsapp' as CanalHandoff,
    modulo: opts.modulo,
    productoId: opts.productoId,
    mensaje,
    destino,
  });
  return buildHandoffPath(token);
}

export function crearHandoffLlamada(opts: {
  negocioId: string;
  slug: string;
  phone: string;
  modulo: string;
}): string {
  const digits = opts.phone.replace(/\D/g, '');
  const destino = `tel:+${digits}`;
  const token = crearTokenHandoff({
    negocioId: opts.negocioId,
    slug: opts.slug,
    canal: 'llamada',
    modulo: opts.modulo,
    destino,
  });
  return buildHandoffPath(token);
}

export function crearHandoffRuta(opts: {
  negocioId: string;
  slug: string;
  lat: number;
  lng: number;
  modulo: string;
}): string {
  const destino = `https://www.google.com/maps/dir/?api=1&destination=${opts.lat},${opts.lng}`;
  const token = crearTokenHandoff({
    negocioId: opts.negocioId,
    slug: opts.slug,
    canal: 'ruta',
    modulo: opts.modulo,
    destino,
  });
  return buildHandoffPath(token);
}
