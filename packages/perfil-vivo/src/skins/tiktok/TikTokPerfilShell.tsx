'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type {
  DiaSemana,
  MetodoPago,
  PerfilPayload,
  Producto,
} from '../../types';
import type { HandoffLinks } from '../../modulos/PerfilContext';
import { formatPrecio } from '../../estado/calcular-estado';
import { fechaRelativa } from '../../resenas/helpers';
import { usePerfilFonts } from '../../tema/load-fonts';
import { tokens } from '@buscadis/tokens';
import './tiktok-perfil.css';

type TabId = 'catalogo' | 'info' | 'resenas';

type SocialItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

const BUSCADIS_ACCENT = tokens['--bs-identity'];

const SOCIAL_ORDER = [
  'web',
  'whatsapp',
  'facebook',
  'instagram',
  'tiktok',
  'linkedin',
  'x',
  'youtube',
  'maps',
  'telegram',
] as const;

const SOCIAL_ICON: Record<string, string> = {
  web: '/perfil-vivo/canales/web.png',
  whatsapp: '/perfil-vivo/canales/whatsapp.png',
  facebook: '/perfil-vivo/canales/facebook.png',
  instagram: '/perfil-vivo/canales/instagram.png',
  tiktok: '/perfil-vivo/canales/tiktok.png',
  youtube: '/perfil-vivo/canales/youtube.png',
  maps: '/perfil-vivo/canales/maps.png',
  linkedin: '/perfil-vivo/canales/linkedin.png',
  x: '/perfil-vivo/canales/x.png',
  telegram: '/perfil-vivo/canales/telegram.png',
};

const PAGO_ICON: Partial<Record<MetodoPago, string>> = {
  yape: '/perfil-vivo/pago/yape-tile.png',
  plin: '/perfil-vivo/pago/plin-tile.png',
  visa: '/perfil-vivo/pago/visa.png',
  mastercard: '/perfil-vivo/pago/mastercard.png',
  amex: '/perfil-vivo/pago/amex.png',
  efectivo: '/perfil-vivo/pago/efectivo.png',
  transferencia: '/perfil-vivo/pago/transferencia.png',
  credito: '/perfil-vivo/pago/credito.png',
  cripto: '/perfil-vivo/pago/cripto.png',
  bcp: '/perfil-vivo/pago/bcp.png',
  interbank: '/perfil-vivo/pago/interbank.png',
  bbva: '/perfil-vivo/pago/bbva.png',
};

const DIAS: { key: DiaSemana; label: string }[] = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' },
  { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

const HL_LINKS: Record<string, string> = {
  'hl-deals': '/deals',
  'hl-publicar': '/publicar',
  'hl-ayuda': '/ayuda',
  'hl-gratis': '/guia',
};

/* ————————————————————————————————————————————
   Icons
   ———————————————————————————————————————————— */

function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 5L8 12l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShare() {
  // Classic "share" — box with an arrow going up out of it
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.2v12.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8 7.4l4-4.2 4 4.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 12.4v6.6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWA({ size = 18 }: { size?: number }) {
  // Compact WhatsApp glyph, inherits currentColor
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.52.08-.8.37-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.23 5.14 4.53.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Zm-5.43 7.25h-.02a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.76 1 1.02-3.67-.24-.38A9.86 9.86 0 0 1 2.1 12c0-5.46 4.45-9.9 9.98-9.9 2.66 0 5.15 1.03 7.04 2.9A9.83 9.83 0 0 1 22.07 12c0 5.46-4.45 9.9-9.99 9.9Z" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function IconVerified() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M12 2.2 14.4 4l2.8-.4 1.2 2.6 2.6 1.2-.4 2.8L22 12l-1.4 2.4.4 2.8-2.6 1.2-1.2 2.6-2.8-.4L12 21.8l-2.4-1.4-2.8.4-1.2-2.6-2.6-1.2.4-2.8L2 12l1.4-2.4-.4-2.8 2.6-1.2L7 4l2.8.4L12 2.2Z" />
      <path d="M8.2 12.1 10.6 14.5 15.8 9.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron({ up = false }: { up?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden style={up ? { transform: 'rotate(180deg)' } : undefined}>
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="4" width="4.2" height="16" rx="1" />
      <rect x="9.9" y="4" width="4.2" height="16" rx="1" />
      <rect x="15.8" y="4" width="4.2" height="16" rx="1" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.5 14.6 9l6 .5-4.6 4 1.4 5.8L12 16.5 6.6 19.3 8 13.5 3.4 9.5l6-.5L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconBookmark({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden>
      <path d="M7 4.5h10v15l-5-3.2L7 19.5v-15Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="11" r="2" fill="currentColor" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ————————————————————————————————————————————
   Helpers
   ———————————————————————————————————————————— */

function buildSocials(payload: PerfilPayload, handoffs: HandoffLinks): SocialItem[] {
  const { negocio } = payload;
  const byTipo = new Map<string, string>();
  if (negocio.contacto.web) byTipo.set('web', negocio.contacto.web);
  if (handoffs.whatsappPrimary) byTipo.set('whatsapp', handoffs.whatsappPrimary);
  else if (negocio.contacto.whatsapp) {
    byTipo.set('whatsapp', `https://wa.me/${negocio.contacto.whatsapp.replace(/\D/g, '')}`);
  }
  for (const r of negocio.contacto.redes ?? []) {
    if (!r.activa || !r.url) continue;
    const t = String(r.tipo).toLowerCase();
    if (!byTipo.has(t)) byTipo.set(t, r.url);
  }
  const items: SocialItem[] = [];
  for (const key of SOCIAL_ORDER) {
    const href = byTipo.get(key);
    const icon = SOCIAL_ICON[key];
    if (!href || !icon) continue;
    items.push({
      key,
      label: key === 'web' ? 'Sitio web' : key.charAt(0).toUpperCase() + key.slice(1),
      href,
      icon,
    });
  }
  return items.slice(0, 10);
}

function productThumb(p: Producto, index: number): string {
  if (p.imagenes[0]?.url) return p.imagenes[0].url;
  const hue = (index * 47 + 190) % 360;
  const initial = (p.nombre[0] || '?').toUpperCase();
  const short = p.nombre.length > 18 ? `${p.nombre.slice(0, 16)}…` : p.nombre;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue} 48% 52%)"/>
        <stop offset="100%" stop-color="hsl(${(hue + 28) % 360} 42% 38%)"/>
      </linearGradient></defs>
      <rect width="240" height="240" fill="url(#g)"/>
      <circle cx="120" cy="98" r="36" fill="rgba(255,255,255,0.22)"/>
      <text x="120" y="110" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="36" font-weight="700">${initial}</text>
      <text x="120" y="178" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="14" font-weight="600">${short.replace(/[<>&]/g, '')}</text>
    </svg>`
  )}`;
}

/* ————————————————————————————————————————————
   Component
   ———————————————————————————————————————————— */

export function TikTokPerfilShell({
  payload,
  handoffs,
}: {
  payload: PerfilPayload;
  handoffs: HandoffLinks;
}) {
  const { negocio, productos, nosotros, metricas, estadoVivo, faqs, resenas, publicaciones } =
    payload;

  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabId>('catalogo');
  const [filter, setFilter] = useState<string>('Todos');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [bioOpen, setBioOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<string | null>(faqs[0]?.id ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [brandVisible, setBrandVisible] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const identityRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  usePerfilFonts(rootRef);

  useEffect(() => {
    const el = identityRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setBrandVisible(!entry!.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry!.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(`buscadis-saved-${negocio.slug}`) === '1') setSaved(true);
    } catch { /* SSR / privacy */ }
  }, [negocio.slug]);

  const logo = negocio.identidad.logoUrl;
  const bannerUrl = negocio.identidad.portadaUrl;
  const showBanner = Boolean(bannerUrl);
  const verified = (negocio.verificacion?.nivel ?? 0) >= 1;
  const category = negocio.categoria.nombre;
  const accent = negocio.identidad.colorSemilla || BUSCADIS_ACCENT;
  const rootStyle = { '--tt-accent': accent } as CSSProperties;

  const eslogan = negocio.eslogan || '';
  const bio =
    nosotros?.texto?.trim() ||
    `${category} en ${negocio.ubicacion?.distrito ?? 'Perú'}`;
  // When there is already an eslogan, collapse bio to ~1 line by default
  const bioMaxChars = eslogan ? 64 : 110;
  const bioLong = bio.length > bioMaxChars;
  const bioShown =
    bioOpen || !bioLong ? bio : `${bio.slice(0, bioMaxChars).replace(/\s+\S*$/, '')}…`;

  // Hide "@handle" when it is redundant with the display name
  // (i.e. buscadis / demo-buscadis vs "Buscadis")
  const displaySlug = negocio.slug.replace(/^demo-/, '');
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hideHandle = normalize(displaySlug) === normalize(negocio.nombre);

  // Hide live-hours strip for digital / plataforma businesses, or when the
  // profile is intentionally not exposing a physical store location.
  const digitalCategoryIds = new Set([
    'plataforma',
    'digital',
    'marketplace',
    'online',
    'saas',
    'servicio_online',
    'servicios_digitales',
    'app',
    'web',
  ]);
  // Solo negocios digitales/plataforma: ocultar strip de horario en fold.
  // No usar mostrarDireccionExacta — muchos locales físicos ocultan la calle
  // por privacidad pero sí quieren "Abierto ahora".
  const hideLiveHours = digitalCategoryIds.has(
    String(negocio.categoria.id || '').toLowerCase(),
  );

  // Platform "Recursos" chips (Deals / Publicar / Ayuda / Guía) are Buscadis-owned
  // and only make sense on the Buscadis profile itself. We move them into the
  // Info tab as a lightweight "Recursos" section instead of stealing above-the-fold.
  const showResources = ['buscadis', 'demo-buscadis'].includes(negocio.slug.toLowerCase());

  const rating = metricas?.calificacion?.promedio ?? 0;
  const ratingCount = metricas?.calificacion?.total ?? resenas.length;
  const respuestaMin = metricas?.respuestaMedianaMin;
  const antiguedad = metricas?.antiguedadDesde
    ? new Date(metricas.antiguedadDesde).getFullYear()
    : null;

  const categoryChip = `${category}${negocio.ubicacion?.departamento ? ` · ${negocio.ubicacion.departamento}` : ''}`;

  const socials = useMemo(() => buildSocials(payload, handoffs), [payload, handoffs]);

  const whatsappHref = useMemo(() => {
    const wa = socials.find((s) => s.key === 'whatsapp')?.href;
    if (wa) return wa;
    if (negocio.contacto.whatsapp) {
      return `https://wa.me/${negocio.contacto.whatsapp.replace(/\D/g, '')}`;
    }
    return null;
  }, [socials, negocio.contacto.whatsapp]);

  const folders = useMemo(() => {
    // Keep the chip row short so we don't push the grid down and we don't
    // blow the "≤10 interactives before first product" KPI.
    const set = new Set<string>(['Todos']);
    const hasDestacado = productos.some((p) => p.destacado);
    if (hasDestacado) set.add('Destacados');
    for (const p of productos) {
      if (p.grupo) set.add(p.grupo);
    }
    // Tags are noisier than grupos — only mix them in if we still have room.
    if (set.size < 5) {
      for (const p of productos) {
        for (const t of p.etiquetas ?? []) {
          set.add(t.replace(/_/g, ' '));
          if (set.size >= 5) break;
        }
        if (set.size >= 5) break;
      }
    }
    return Array.from(set)
      .slice(0, 5)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  }, [productos]);

  const gridItems = useMemo(() => {
    let list = [...productos];
    if (filter === 'Destacados') list = list.filter((p) => p.destacado);
    else if (filter !== 'Todos') {
      const f = filter.toLowerCase();
      list = list.filter(
        (p) =>
          p.grupo?.toLowerCase() === f ||
          (p.etiquetas ?? []).some((t) => t.replace(/_/g, ' ').toLowerCase() === f),
      );
    }
    const q = catalogQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.grupo?.toLowerCase().includes(q) ||
          (p.etiquetas ?? []).some((t) => t.replace(/_/g, ' ').toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => Number(b.destacado) - Number(a.destacado));
  }, [productos, filter, catalogQuery]);

  const chips = useMemo(
    () => [
      { id: 'hl-deals', label: 'Deals', href: HL_LINKS['hl-deals'] },
      { id: 'hl-publicar', label: 'Publicar', href: HL_LINKS['hl-publicar'] },
      { id: 'hl-ayuda', label: 'Ayuda', href: HL_LINKS['hl-ayuda'] },
      { id: 'hl-gratis', label: 'Guía', href: HL_LINKS['hl-gratis'] },
    ],
    [],
  );

  const feedItems = useMemo(() => {
    type FeedItem = {
      id: string;
      titulo: string;
      resumen?: string;
      imagenUrl?: string;
      url?: string;
      publicadaEn: string;
    };
    const items: FeedItem[] = [];
    for (const p of publicaciones ?? []) {
      items.push({
        id: p.id,
        titulo: p.titulo,
        resumen: p.resumen,
        url: p.url,
        publicadaEn: p.publicadaEn,
        imagenUrl: '/og-image.jpg',
      });
    }
    return items
      .sort((a, b) => new Date(b.publicadaEn).getTime() - new Date(a.publicadaEn).getTime())
      .slice(0, 2);
  }, [publicaciones]);

  const hoursLabel = useMemo(() => {
    if (!estadoVivo) return null;
    if (!estadoVivo.abierto) {
      const msg = estadoVivo.mensaje;
      const cerradoMatch = msg.match(/^Cerrado\s*[·:]\s*(.+)/i);
      if (cerradoMatch) return cerradoMatch[1]!.charAt(0).toUpperCase() + cerradoMatch[1]!.slice(1);
      if (estadoVivo.abreEn) return `Abre ${estadoVivo.abreEn}`;
      return 'Abre pronto';
    }
    return estadoVivo.mensaje;
  }, [estadoVivo]);

  const showSearch = productos.length >= 8;

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function onShare() {
    const url =
      typeof window !== 'undefined'
        ? window.location.href
        : `https://buscadis.com/@${negocio.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: negocio.nombre, url });
        return;
      }
    } catch { /* user cancelled */ }
    try {
      await navigator.clipboard.writeText(url);
      flash('Enlace copiado');
    } catch {
      flash('No se pudo compartir');
    }
  }

  function onSave() {
    const next = !saved;
    setSaved(next);
    try {
      localStorage.setItem(`buscadis-saved-${negocio.slug}`, next ? '1' : '');
    } catch { /* privacy */ }
    flash(next ? 'Guardado (demo)' : 'Eliminado de guardados');
  }

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: 'catalogo', label: 'Catálogo', icon: <IconGrid /> },
    { id: 'info', label: 'Info', icon: <IconInfo /> },
    { id: 'resenas', label: 'Reseñas', icon: <IconStar /> },
  ];

  return (
    <div
      ref={rootRef}
      className="tt-root"
      data-skin="tiktok"
      data-banner={showBanner ? '1' : '0'}
      style={rootStyle}
    >
      {/* ———— Hero / Banner ———— */}
      <div className={showBanner ? 'tt-hero' : undefined}>
        {showBanner && bannerUrl ? (
          <div className="tt-banner" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="" />
            <span className="tt-banner__scrim" />
            <span className="tt-banner__fade" />
          </div>
        ) : null}

        <header className="tt-top">
          <div className="tt-top__left">
            <button
              type="button"
              className="tt-top__btn"
              aria-label="Volver"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) window.history.back();
                else window.location.href = '/';
              }}
            >
              <IconBack />
            </button>
            <a
              className={`tt-top__brand${brandVisible ? ' tt-top__brand--show' : ''}`}
              href="/"
            >
              Buscadis
            </a>
          </div>
          <div className="tt-top__right">
            <button type="button" className="tt-top__btn" aria-label="Compartir" onClick={onShare}>
              <IconShare />
            </button>
            <button
              type="button"
              className="tt-top__btn"
              aria-label="Más opciones"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconMore />
            </button>
          </div>
        </header>
      </div>

      {/* ———— Dropdown menu ———— */}
      {menuOpen ? (
        <div className="tt-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); flash('Notificaciones (próximo)'); }}>
            Notificaciones
          </button>
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setTab('info'); }}>
            Ver ubicación y horario
          </button>
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onShare(); }}>
            Copiar enlace
          </button>
          <a role="menuitem" href="/ayuda" onClick={() => setMenuOpen(false)}>
            Ayuda Buscadis
          </a>
        </div>
      ) : null}

      {/* ———— Identity ———— */}
      <section className="tt-identity" ref={identityRef}>
        <div className="tt-avatar">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" />
          ) : (
            <div className="tt-avatar__fallback">{negocio.nombre.charAt(0)}</div>
          )}
        </div>
        <div className="tt-identity__text">
          <div className="tt-name-row">
            <h1 className="tt-name">{negocio.nombre}</h1>
            {verified ? (
              <span className="tt-verified" title="Verificado en Buscadis">
                <IconVerified />
                <span className="tt-sr">Verificado</span>
              </span>
            ) : null}
          </div>
          <span className="tt-category-chip">{categoryChip}</span>
          {hideHandle ? null : <p className="tt-handle">@{displaySlug}</p>}
          <div className="tt-trust" role="list">
            {rating > 0 ? (
              <button
                type="button"
                className="tt-trust__item"
                role="listitem"
                onClick={() => setTab('resenas')}
              >
                <span className="tt-trust__val">{rating.toFixed(1)}★</span>
                <span className="tt-trust__label">({ratingCount})</span>
              </button>
            ) : null}
            {respuestaMin != null ? (
              <span className="tt-trust__item" role="listitem">
                <span className="tt-trust__val">~{respuestaMin} min</span>
                <span className="tt-trust__label">respuesta</span>
              </span>
            ) : null}
            {antiguedad ? (
              <span className="tt-trust__item" role="listitem">
                <span className="tt-trust__val">Desde {antiguedad}</span>
              </span>
            ) : verified ? (
              <span className="tt-trust__item" role="listitem">
                <span className="tt-trust__val">Verificado</span>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* ———— Bio / eslogan / hours ———— */}
      <section className="tt-bio">
        {eslogan ? <p className="tt-bio__eslogan">{eslogan}</p> : null}
        <p className="tt-bio__text">
          {bioShown}
          {bioLong ? (
            <>
              {' '}
              <button type="button" className="tt-bio__more" onClick={() => setBioOpen((v) => !v)}>
                {bioOpen ? 'menos' : 'más'}
              </button>
            </>
          ) : null}
        </p>
        {hoursLabel && !hideLiveHours ? (
          <button type="button" className="tt-live" onClick={() => setTab('info')}>
            <span className={estadoVivo?.abierto ? 'tt-live__dot tt-live__dot--on' : 'tt-live__dot'} />
            {hoursLabel}
            <span className="tt-live__hint">Horario</span>
          </button>
        ) : null}
      </section>

      {/* ———— CTAs ———— */}
      <div className="tt-actions" ref={actionsRef}>
        {whatsappHref ? (
          <a
            className="tt-btn tt-btn--accent tt-btn--primary"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
          >
            <span className="tt-btn__glyph"><IconWA size={18} /></span>
            WhatsApp
          </a>
        ) : (
          <button
            type="button"
            className="tt-btn tt-btn--accent tt-btn--primary"
            onClick={() => {
              setTab('info');
              flash('Revisa contacto en Info');
            }}
          >
            <span className="tt-btn__glyph"><IconWA size={18} /></span>
            WhatsApp
          </button>
        )}
        <button
          type="button"
          className={`tt-btn tt-btn--icon${saved ? ' tt-btn--saved' : ''}`}
          aria-label={saved ? 'Quitar de guardados' : 'Guardar'}
          onClick={onSave}
        >
          <IconBookmark filled={saved} />
        </button>
      </div>

      {/* Platform chips (Deals / Publicar / Ayuda / Guía) are no longer above the
          fold — they'd steal the catalog on 390×844. On the Buscadis-owned profile
          they're rendered inside Info as "Recursos". On every other profile they
          simply don't appear (they belong to the platform, not the SMB owner). */}

      {/* ———— Tabs (3 only) ———— */}
      <div className="tt-tabs" role="tablist" aria-label="Secciones del perfil">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="tt-tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            <span className="tt-tab__icon">{t.icon}</span>
            <span className="tt-tab__label">
              {t.label}
              {t.id === 'resenas' && ratingCount > 0 ? (
                <span className="tt-tab__count">{ratingCount}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {/* ———— CATÁLOGO ———— */}
      {tab === 'catalogo' ? (
        <>
          {showSearch ? (
            <div className="tt-catalog-bar">
              <label className="tt-search">
                <IconSearch />
                <span className="tt-sr">Buscar en catálogo</span>
                <input
                  type="search"
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  placeholder="Buscar en el catálogo…"
                  autoComplete="off"
                />
              </label>
            </div>
          ) : null}
          <div className="tt-folders" aria-label="Carpetas del catálogo">
            {folders.map((label) => (
              <button
                key={label}
                type="button"
                className={`tt-folder${filter === label ? ' tt-folder--on' : ''}`}
                onClick={() => setFilter(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="tt-grid-wrap">
            {gridItems.length === 0 ? (
              <p className="tt-empty">
                {catalogQuery.trim() ? 'Sin resultados para esa búsqueda' : 'Sin ítems en esta carpeta'}
              </p>
            ) : (
              <div className="tt-grid">
                {(() => {
                  // Only badge the *first* destacado to keep visual noise low
                  // ("one Destacado badge max feel").
                  const firstDestacadoId = gridItems.find((p) => p.destacado)?.id;
                  return gridItems.map((p, i) => {
                    const href =
                      handoffs.productoWhatsapp?.[p.id] ||
                      `/v/${encodeURIComponent(negocio.slug)}#catalogo`;
                    const isFree = p.precio?.valor === 0;
                    const price =
                      p.precio != null
                        ? isFree
                          ? 'Gratis'
                          : formatPrecio(p.precio.valor, p.precio.moneda)
                        : '';
                    return (
                      <a key={p.id} className="tt-cell" href={href} title={p.nombre}>
                        <div className="tt-cell__img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={productThumb(p, i)}
                            alt={p.nombre}
                            loading={i < 4 ? 'eager' : 'lazy'}
                          />
                          {p.destacado && p.id === firstDestacadoId ? (
                            <span className="tt-cell__pin">Destacado</span>
                          ) : null}
                        </div>
                        <div className="tt-cell__info">
                          <span className="tt-cell__name">{p.nombre}</span>
                          {price ? (
                            <span
                              className={`tt-cell__price${isFree ? ' tt-cell__price--free' : ''}`}
                            >
                              {price}
                            </span>
                          ) : null}
                        </div>
                      </a>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* ———— INFO ———— */}
      {tab === 'info' ? (
        <div className="tt-panel">
          {feedItems.length > 0 ? (
            <section className="tt-block" id="novedades-info">
              <h2 className="tt-block__title">Novedades</h2>
              <div className="tt-novedades-cards">
                {feedItems.map((item) => (
                  <a key={item.id} className="tt-novedad-card" href={item.url || '#'}>
                    {item.imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="tt-novedad-card__img" src={item.imagenUrl} alt="" />
                    ) : null}
                    <div className="tt-novedad-card__body">
                      <h3>{item.titulo}</h3>
                      {item.resumen ? <p>{item.resumen}</p> : null}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {negocio.ubicacion ? (
            <section className="tt-block" id="ubicacion">
              <h2 className="tt-block__title">
                <IconPin /> Ubicación
              </h2>
              <p className="tt-block__body">
                {negocio.ubicacion.direccion}
                {negocio.ubicacion.referencia ? ` · ${negocio.ubicacion.referencia}` : ''}
              </p>
              <p className="tt-block__muted">
                {negocio.ubicacion.distrito}, {negocio.ubicacion.provincia},{' '}
                {negocio.ubicacion.departamento}
              </p>
              {handoffs.ruta ? (
                <a className="tt-link-btn" href={handoffs.ruta}>
                  Cómo llegar
                </a>
              ) : null}
            </section>
          ) : null}

          {negocio.horario ? (
            <section className="tt-block" id="horario">
              <h2 className="tt-block__title">
                <IconClock /> Horario
              </h2>
              <ul className="tt-hours">
                {DIAS.map(({ key, label }) => {
                  const franjas = negocio.horario!.semana[key] || [];
                  return (
                    <li key={key}>
                      <span>{label}</span>
                      <span>
                        {franjas.length === 0
                          ? 'Cerrado'
                          : franjas.map((f) => `${f.desde}–${f.hasta}`).join(', ')}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {estadoVivo ? <p className="tt-block__muted">{estadoVivo.mensaje}</p> : null}
            </section>
          ) : null}

          {negocio.metodosPago && negocio.metodosPago.length > 0 ? (
            <section className="tt-block" id="pago">
              <h2 className="tt-block__title">Medios de pago</h2>
              <div className="tt-pagos">
                {negocio.metodosPago.map((m) => (
                  <div key={m} className="tt-pago" title={m}>
                    {PAGO_ICON[m] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={PAGO_ICON[m]} alt={m} />
                    ) : (
                      <span>{m}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {socials.length > 0 ? (
            <section className="tt-block" id="canales">
              <h2 className="tt-block__title">Canales</h2>
              <div className="tt-canales">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    className="tt-canal"
                    href={s.href}
                    target={s.key === 'whatsapp' ? undefined : '_blank'}
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" />
                    <span>{s.label}</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {nosotros?.texto ? (
            <section className="tt-block" id="nosotros">
              <h2 className="tt-block__title">Sobre nosotros</h2>
              <p className="tt-block__body">{nosotros.texto}</p>
            </section>
          ) : null}

          {showResources ? (
            <section className="tt-block" id="recursos">
              <h2 className="tt-block__title">Recursos Buscadis</h2>
              <div className="tt-recursos">
                {chips.map((c) => (
                  <a key={c.id} className="tt-recurso" href={c.href}>
                    {c.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {faqs.length > 0 ? (
            <section className="tt-block" id="faq">
              <h2 className="tt-block__title">Preguntas frecuentes</h2>
              <div className="tt-faq">
                {faqs.map((f) => {
                  const open = faqOpen === f.id;
                  return (
                    <div key={f.id} className="tt-faq__item">
                      <button
                        type="button"
                        className="tt-faq__q"
                        aria-expanded={open}
                        onClick={() => setFaqOpen(open ? null : f.id)}
                      >
                        {f.pregunta}
                        <IconChevron up={open} />
                      </button>
                      {open ? <p className="tt-faq__a">{f.respuesta}</p> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {/* ———— RESEÑAS ———— */}
      {tab === 'resenas' ? (
        <div className="tt-panel">
          <div className="tt-rating">
            <strong>{rating.toFixed(1)}</strong>
            <span>
              {ratingCount} reseñas
              {metricas?.calificacion ? ' · verificadas en Buscadis' : ''}
            </span>
          </div>

          {metricas?.calificacion?.distribucion ? (
            <div className="tt-histogram" aria-label="Distribución de calificaciones">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = metricas.calificacion!.distribucion![star] ?? 0;
                const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                return (
                  <div key={star} className="tt-histogram__row">
                    <span className="tt-histogram__star">{star}★</span>
                    <div className="tt-histogram__bar">
                      <div className="tt-histogram__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="tt-histogram__count">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <ul className="tt-reviews">
            {resenas.map((r) => (
              <li key={r.id} className="tt-review">
                <div className="tt-review__head">
                  <span className="tt-review__av">{r.autor.iniciales}</span>
                  <div className="tt-review__meta">
                    <p className="tt-review__name">
                      {r.autor.nombre}
                      {r.contactoVerificado ? (
                        <span className="tt-review__verified" title="Compra verificada en Buscadis">
                          {' '}
                          · verificado
                        </span>
                      ) : null}
                    </p>
                    <p className="tt-review__stars">
                      {'★'.repeat(r.estrellas)}
                      {'☆'.repeat(5 - r.estrellas)}
                    </p>
                  </div>
                  {r.creadaEn ? (
                    <time className="tt-review__date" dateTime={r.creadaEn}>
                      {fechaRelativa(r.creadaEn)}
                    </time>
                  ) : null}
                </div>
                {r.texto ? <p className="tt-review__text">{r.texto}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ———— Footer ———— */}
      <footer className="tt-foot">
        <p>
          {negocio.nombre} · {category} en Buscadis
        </p>
      </footer>

      {/* ———— Sticky WhatsApp bar ———— */}
      {whatsappHref ? (
        <div className={`tt-sticky${stickyVisible ? ' tt-sticky--show' : ''}`}>
          <a
            className="tt-sticky__btn"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
          >
            <span className="tt-sticky__glyph"><IconWA size={20} /></span>
            WhatsApp
          </a>
        </div>
      ) : null}

      {/* ———— Toast ———— */}
      {toast ? <div className="tt-toast">{toast}</div> : null}
    </div>
  );
}
