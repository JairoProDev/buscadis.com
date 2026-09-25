import type { MapListing } from '@/lib/map/types';

export function formatMapPrice(listing: Pick<MapListing, 'precio' | 'moneda' | 'tipoPrecio'>): string {
  if (listing.tipoPrecio === 'gratis') return 'Gratis';
  if (listing.tipoPrecio === 'a_convenir' || listing.precio == null) return 'Consultar';
  const symbol = listing.moneda === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${Math.round(listing.precio).toLocaleString('es-PE')}`;
}

export function whatsappUrlFromContact(contacto: string | null | undefined): string | null {
  if (!contacto) return null;
  const digits = contacto.replace(/\D/g, '');
  if (digits.length < 9) return null;
  const local = digits.length > 9 ? digits.slice(-9) : digits;
  if (!/^9\d{8}$/.test(local)) return null;
  return `https://wa.me/51${local}`;
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function boundsAroundCusco() {
  return { south: -13.62, west: -72.08, north: -13.44, east: -71.86 };
}

export function boundsKey(b: { south: number; west: number; north: number; east: number }): string {
  const r = (n: number) => n.toFixed(3);
  return `${r(b.south)},${r(b.west)},${r(b.north)},${r(b.east)}`;
}
