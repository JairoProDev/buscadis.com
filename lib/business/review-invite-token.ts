import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const DEFAULT_SECRET = 'perfil-vivo-review-invite-dev-only';

function secret(): string {
  return (
    process.env.PERFIL_VIVO_REVIEW_SECRET ||
    process.env.PERFIL_VIVO_HANDOFF_SECRET ||
    DEFAULT_SECRET
  );
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

export type ReviewInvitePayload = {
  v: 1;
  negocioId: string;
  slug: string;
  nombre: string;
  /** nonce anti-replay blando */
  n: string;
  ts: number;
  /** ms epoch expiry */
  exp: number;
};

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export function crearTokenResenaInvite(input: {
  negocioId: string;
  slug: string;
  nombre: string;
  ttlMs?: number;
}): string {
  const body: ReviewInvitePayload = {
    v: 1,
    negocioId: input.negocioId,
    slug: input.slug,
    nombre: input.nombre.slice(0, 60),
    n: randomBytes(8).toString('hex'),
    ts: Date.now(),
    exp: Date.now() + (input.ttlMs ?? TTL_MS),
  };
  const data = b64url(JSON.stringify(body));
  const sig = b64url(createHmac('sha256', secret()).update(data).digest());
  return `${data}.${sig}`;
}

export function verificarTokenResenaInvite(token: string): ReviewInvitePayload | null {
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
    const parsed = JSON.parse(fromB64url(data).toString('utf8')) as ReviewInvitePayload;
    if (parsed.v !== 1 || !parsed.negocioId || !parsed.slug) return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function rutaResenaInvite(token: string): string {
  return `/resena/${encodeURIComponent(token)}`;
}
