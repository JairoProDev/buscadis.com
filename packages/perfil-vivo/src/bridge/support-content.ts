/**
 * Extrae FAQ / nosotros / promo / galería desde filas de business_profiles
 * y fuentes relacionadas (blocks, deals, banner/gallery).
 */
import type {
  FotoGaleria,
  ItemFaq,
  MiembroEquipo,
  NosotrosContenido,
  Novedad,
  PromocionVigente,
} from '../types';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

/** profile_blocks type=faq → items */
export function faqsFromProfileBlocks(blocks: unknown): ItemFaq[] {
  if (!Array.isArray(blocks)) return [];
  const out: ItemFaq[] = [];
  for (const b of blocks) {
    const block = asRecord(b);
    if (!block || block.type !== 'faq' || block.visible === false) continue;
    const cfg = asRecord(block.config) || {};
    const items = Array.isArray(cfg.items)
      ? cfg.items
      : Array.isArray(cfg.faqs)
        ? cfg.faqs
        : [];
    for (let i = 0; i < items.length; i++) {
      const it = asRecord(items[i]);
      if (!it) continue;
      const pregunta = String(it.pregunta || it.question || '').trim();
      const respuesta = String(it.respuesta || it.answer || '').trim();
      if (!pregunta || !respuesta) continue;
      out.push({
        id: String(it.id || block.id || `faq-${out.length}`),
        pregunta: pregunta.slice(0, 160),
        respuesta: respuesta.slice(0, 1200),
      });
    }
  }
  return out.slice(0, 12);
}

export function nosotrosFromProfile(row: Record<string, unknown>): NosotrosContenido | null {
  const texto = String(row.description || '').trim();
  if (texto.length < 20) return null;
  const eslogan = String(row.tagline || '').trim() || undefined;
  return { texto: texto.slice(0, 2000), eslogan };
}

/** Mejor promo no vencida desde deals o un campo promocional. */
export function promocionFromProfile(
  row: Record<string, unknown>,
  dealRows: unknown[] = [],
  now = Date.now()
): PromocionVigente | null {
  type Cand = PromocionVigente & { priority: number };
  const cands: Cand[] = [];

  for (const d of dealRows) {
    const deal = asRecord(d);
    if (!deal) continue;
    const status = String(deal.status || deal.state || 'active');
    if (status === 'expired' || status === 'draft' || status === 'archived') continue;
    const vence =
      typeof deal.ends_at === 'string'
        ? deal.ends_at
        : typeof deal.expires_at === 'string'
          ? deal.expires_at
          : undefined;
    if (vence && Date.parse(vence) <= now) continue;
    const titulo = String(deal.title || deal.titulo || '').trim();
    if (!titulo) continue;
    cands.push({
      id: String(deal.id || `deal-${cands.length}`),
      titulo: titulo.slice(0, 80),
      condicion: String(deal.description || deal.condicion || '')
        .trim()
        .slice(0, 160) || undefined,
      codigo: String(deal.code || deal.codigo || '').trim() || undefined,
      venceEn: vence,
      ctaLabel: 'Pedir esta promo',
      priority: typeof deal.priority === 'number' ? deal.priority : 0,
    });
  }

  const promoCfg = asRecord(row.promo_config) || asRecord(row.active_promo);
  if (promoCfg) {
    const titulo = String(promoCfg.title || promoCfg.titulo || '').trim();
    const vence =
      typeof promoCfg.ends_at === 'string'
        ? promoCfg.ends_at
        : typeof promoCfg.venceEn === 'string'
          ? promoCfg.venceEn
          : undefined;
    if (titulo && (!vence || Date.parse(vence) > now)) {
      cands.push({
        id: String(promoCfg.id || 'promo-cfg'),
        titulo: titulo.slice(0, 80),
        condicion: String(promoCfg.condicion || promoCfg.condition || '')
          .trim()
          .slice(0, 160) || undefined,
        codigo: String(promoCfg.codigo || promoCfg.code || '').trim() || undefined,
        venceEn: vence,
        priority: 100,
      });
    }
  }

  // Fallback: story_highlights como promo puntual (si no hay deals)
  if (!cands.length && Array.isArray(row.story_highlights)) {
    for (const h of row.story_highlights) {
      const hl = asRecord(h);
      if (!hl) continue;
      const titulo = String(hl.title || '').trim();
      if (!titulo) continue;
      cands.push({
        id: String(hl.id || `hl-${cands.length}`),
        titulo: titulo.slice(0, 80),
        condicion: String(hl.subtitle || hl.description || '')
          .trim()
          .slice(0, 160) || undefined,
        priority: 1,
      });
      break;
    }
  }

  if (!cands.length) return null;
  cands.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const ta = a.venceEn ? Date.parse(a.venceEn) : Number.POSITIVE_INFINITY;
    const tb = b.venceEn ? Date.parse(b.venceEn) : Number.POSITIVE_INFINITY;
    return ta - tb;
  });
  const { priority: _p, ...best } = cands[0];
  return best;
}

export function galeriaFromProfile(
  row: Record<string, unknown>,
  productImageUrls: string[] = []
): FotoGaleria[] {
  const out: FotoGaleria[] = [];
  const gallery = row.gallery_images || row.profile_gallery;
  if (Array.isArray(gallery)) {
    for (let i = 0; i < gallery.length; i++) {
      const g = gallery[i];
      const url =
        typeof g === 'string'
          ? g
          : asRecord(g)?.url && typeof asRecord(g)!.url === 'string'
            ? String(asRecord(g)!.url)
            : null;
      if (!url) continue;
      out.push({
        id: `gal-${i}`,
        url,
        alt: typeof asRecord(g)?.alt === 'string' ? String(asRecord(g)!.alt) : undefined,
        etiqueta: 'local',
      });
    }
  }

  // Fallback: fotos de productos (resultado de obra / surtido)
  if (out.length < 3) {
    for (let i = 0; i < productImageUrls.length && out.length < 12; i++) {
      const url = productImageUrls[i];
      if (!url || url.startsWith('data:')) continue;
      if (out.some((f) => f.url === url)) continue;
      out.push({ id: `prod-gal-${i}`, url, etiqueta: 'resultado' });
    }
  }

  return out.slice(0, 12);
}

/** story_highlights + anuncio activo → novedades (P16 lite). */
export function novedadesFromProfile(row: Record<string, unknown>): Novedad[] {
  const out: Novedad[] = [];
  const updated =
    typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString();

  if (row.announcement_active === true) {
    const texto = String(row.announcement_text || '').trim();
    if (texto) {
      out.push({
        id: 'announcement',
        titulo: texto.slice(0, 80),
        texto: texto.length > 80 ? texto.slice(0, 280) : undefined,
        publicadaEn: updated,
      });
    }
  }

  if (Array.isArray(row.story_highlights)) {
    for (const h of row.story_highlights) {
      const hl = asRecord(h);
      if (!hl) continue;
      const titulo = String(hl.title || '').trim();
      if (!titulo) continue;
      const cover =
        typeof hl.cover_url === 'string' && /^https?:\/\//.test(hl.cover_url)
          ? hl.cover_url
          : undefined;
      const sub = String(hl.subtitle || hl.description || '').trim();
      out.push({
        id: String(hl.id || `nov-${out.length}`),
        titulo: titulo.slice(0, 80),
        texto: sub ? sub.slice(0, 280) : undefined,
        imagenUrl: cover,
        publicadaEn: updated,
      });
    }
  }

  return out.slice(0, 8);
}

/** profile_blocks type=team → miembros (si hay items). */
export function equipoFromProfileBlocks(blocks: unknown): MiembroEquipo[] {
  if (!Array.isArray(blocks)) return [];
  const out: MiembroEquipo[] = [];
  for (const b of blocks) {
    const block = asRecord(b);
    if (!block || block.type !== 'team' || block.visible === false) continue;
    const cfg = asRecord(block.config) || {};
    const items = Array.isArray(cfg.items)
      ? cfg.items
      : Array.isArray(cfg.members)
        ? cfg.members
        : Array.isArray(cfg.equipo)
          ? cfg.equipo
          : [];
    for (let i = 0; i < items.length; i++) {
      const it = asRecord(items[i]);
      if (!it) continue;
      const nombre = String(it.nombre || it.name || '').trim();
      const rol = String(it.rol || it.role || it.title || '').trim();
      if (!nombre || !rol) continue;
      const foto =
        typeof it.fotoUrl === 'string'
          ? it.fotoUrl
          : typeof it.photo_url === 'string'
            ? it.photo_url
            : typeof it.avatar_url === 'string'
              ? it.avatar_url
              : undefined;
      out.push({
        id: String(it.id || `eq-${out.length}`),
        nombre: nombre.slice(0, 60),
        rol: rol.slice(0, 60),
        fotoUrl:
          foto && /^https?:\/\//.test(foto) ? foto : undefined,
      });
    }
  }
  return out.slice(0, 8);
}

/**
 * FAQ sintéticas solo con datos reales del perfil (nunca inventa stock/precios).
 * Se usan cuando el negocio aún no escribió FAQs propias.
 */
export function faqsDerivadasDelPerfil(opts: {
  nombre: string;
  distrito?: string;
  whatsapp?: boolean;
  tieneHorario?: boolean;
  metodosPago?: string[];
  deliveryHint?: string | null;
}): ItemFaq[] {
  const out: ItemFaq[] = [];
  if (opts.tieneHorario) {
    out.push({
      id: 'auto-horario',
      pregunta: '¿Cuál es el horario de atención?',
      respuesta: `El horario de ${opts.nombre} está publicado en este perfil. Revisa la sección de ubicación y horario para el día de hoy.`,
    });
  }
  if (opts.whatsapp) {
    out.push({
      id: 'auto-wa',
      pregunta: '¿Cómo los contacto?',
      respuesta: `Escríbenos por WhatsApp desde este perfil. Es la forma más rápida de consultar precios y disponibilidad.`,
    });
  }
  if (opts.metodosPago && opts.metodosPago.length > 0) {
    const labels = opts.metodosPago
      .map((m) => {
        const map: Record<string, string> = {
          efectivo: 'efectivo',
          yape: 'Yape',
          plin: 'Plin',
          visa: 'Visa',
          transferencia: 'transferencia',
        };
        return map[m] || m;
      })
      .slice(0, 5)
      .join(', ');
    out.push({
      id: 'auto-pago',
      pregunta: '¿Qué métodos de pago aceptan?',
      respuesta: `Aceptamos ${labels}. Si tienes otra forma de pago, confírmalo al escribirnos.`,
    });
  }
  if (opts.distrito) {
    out.push({
      id: 'auto-ubi',
      pregunta: `¿Dónde están en ${opts.distrito}?`,
      respuesta: `${opts.nombre} está en ${opts.distrito}. La dirección y cómo llegar aparecen en este perfil.`,
    });
  }
  return out.slice(0, 4);
}
