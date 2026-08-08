import type { Negocio } from '../types';
import { safeParseNegocio } from '../schemas';
import {
  knownBusinessOverride,
  normalizeWhatsappPe,
  ubicacionFromAddress,
} from './known-businesses';

/**
 * Adaptador BusinessProfile → Negocio.
 * Devuelve null si faltan campos esenciales; no lanza.
 */
export function negocioFromBusinessProfile(row: unknown): Negocio | null {
  if (!row || typeof row !== 'object') return null;
  const p = row as Record<string, unknown>;

  const slug = typeof p.slug === 'string' ? p.slug : null;
  const name = typeof p.name === 'string' ? p.name : null;
  if (!slug || !name) return null;

  const known = knownBusinessOverride(slug);

  const themeColor =
    typeof p.theme_color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p.theme_color)
      ? p.theme_color
      : '#1F4FD8';

  const themeMode = p.theme_mode;
  const tema =
    themeMode === 'dark' ? 'oscuro' : themeMode === 'system' ? 'auto' : 'claro';

  const planRaw = p.subscription_tier;
  const plan: 'free' | 'pro' | 'max' =
    planRaw === 'enterprise' ? 'max' : planRaw === 'pro' ? 'pro' : 'free';

  const tier = p.verification_tier;
  let nivel: 0 | 1 | 2 | 3 = 0;
  if (tier === 'basic' || tier === 'identity') nivel = 1;
  else if (tier === 'business') nivel = 2;
  else if (tier === 'premium') nivel = 3;
  else if (p.is_verified === true) nivel = 1;

  const address = typeof p.contact_address === 'string' ? p.contact_address : '';
  const ubicacion = known?.ubicacion
    ? known.ubicacion
    : address
      ? ubicacionFromAddress(address)
      : undefined;

  const eslogan =
    known?.eslogan ||
    (typeof p.tagline === 'string' ? p.tagline.slice(0, 90) : undefined);

  const wa = normalizeWhatsappPe(
    typeof p.contact_whatsapp === 'string' ? p.contact_whatsapp : undefined
  );
  const phone = normalizeWhatsappPe(
    typeof p.contact_phone === 'string' ? p.contact_phone : undefined
  );

  const candidate = {
    id: String(p.id ?? slug),
    slug,
    nombre: name.slice(0, 60),
    eslogan,
    categoria: known?.categoria ?? { id: 'general', nombre: 'Negocio' },
    arquetipo: known?.arquetipo ?? ('retail' as const),
    plan,
    estado: p.is_published === false ? ('pausado' as const) : ('activo' as const),
    identidad: {
      logoUrl: typeof p.logo_url === 'string' ? p.logo_url : undefined,
      portadaUrl: typeof p.banner_url === 'string' ? p.banner_url : undefined,
      colorSemilla: themeColor,
      tema,
      formaCards: 'suave' as const,
    },
    contacto: {
      whatsapp: wa,
      telefono: phone || wa,
      email: typeof p.contact_email === 'string' ? p.contact_email : undefined,
      redes: [],
    },
    ubicacion,
    verificacion: { nivel },
    metricasDeclaradas: [],
    modulos: [
      { tipo: 'hero' as const, visible: true, orden: 0 },
      { tipo: 'metricas' as const, visible: true, orden: 1 },
      { tipo: 'estado' as const, visible: true, orden: 2 },
      { tipo: 'acciones' as const, visible: true, orden: 3 },
      { tipo: 'catalogo' as const, visible: true, orden: 4 },
    ],
    conteos: { productos: 0, resenas: 0, fotosGaleria: 0 },
    creadoEn:
      typeof p.created_at === 'string'
        ? p.created_at
        : new Date().toISOString(),
    actualizadoEn:
      typeof p.updated_at === 'string'
        ? p.updated_at
        : new Date().toISOString(),
  };

  if (!candidate.identidad.logoUrl) delete candidate.identidad.logoUrl;
  if (!candidate.identidad.portadaUrl) delete candidate.identidad.portadaUrl;
  if (!candidate.contacto.email) delete candidate.contacto.email;
  if (!candidate.eslogan) delete candidate.eslogan;

  const parsed = safeParseNegocio(candidate);
  return parsed.success ? (parsed.data as Negocio) : null;
}
