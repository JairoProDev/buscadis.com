import type { PvCartItem } from './cart';

/** Payload compacto para compartir carrito en `?pedido=` (no UUID). */
type CompactPedido = {
  n?: string;
  i: Array<{ p: string; t: string; q: number; $?: number; m?: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPedidoOrderId(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof btoa === 'function'
      ? btoa(bin)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array | null {
  try {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
    if (typeof atob === 'function') {
      const bin = atob(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new Uint8Array(Buffer.from(b64, 'base64'));
  } catch {
    return null;
  }
}

export function encodePedidoCart(
  items: PvCartItem[],
  note?: string
): string | null {
  if (!items.length) return null;
  const payload: CompactPedido = {
    ...(note?.trim() ? { n: note.trim().slice(0, 200) } : {}),
    i: items.map((it) => ({
      p: it.productId,
      t: it.title.slice(0, 80),
      q: Math.max(1, Math.min(99, Math.floor(it.qty))),
      ...(it.price != null ? { $: it.price } : {}),
      ...(it.imageUrl ? { m: it.imageUrl.slice(0, 300) } : {}),
    })),
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  // Evitar URLs enormes
  if (bytes.length > 1800) return null;
  return toBase64Url(bytes);
}

export function decodePedidoCart(
  token: string
): { items: PvCartItem[]; note?: string } | null {
  const raw = fromBase64Url(token.trim());
  if (!raw?.length) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(raw)) as CompactPedido;
    if (!parsed?.i || !Array.isArray(parsed.i) || !parsed.i.length) return null;
    const items: PvCartItem[] = parsed.i
      .filter((x) => x?.p && x?.t && typeof x.q === 'number' && x.q > 0)
      .slice(0, 40)
      .map((x) => ({
        productId: String(x.p).slice(0, 80),
        title: String(x.t).slice(0, 120),
        qty: Math.max(1, Math.min(99, Math.floor(x.q))),
        ...(typeof x.$ === 'number' && x.$ >= 0 ? { price: x.$ } : {}),
        ...(x.m ? { imageUrl: String(x.m).slice(0, 500) } : {}),
      }));
    if (!items.length) return null;
    return {
      items,
      ...(parsed.n?.trim() ? { note: parsed.n.trim().slice(0, 500) } : {}),
    };
  } catch {
    return null;
  }
}

/** Ruta relativa compartible: `/@slug?pedido=…` */
export function buildPedidoSharePath(
  slug: string,
  pedidoToken: string
): string {
  return `/@${slug}?pedido=${encodeURIComponent(pedidoToken)}`;
}
