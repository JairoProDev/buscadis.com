'use client';

import { usePerfil } from '../PerfilContext';

/**
 * Catálogo de canales/redes soportados (logos PNG en /public/perfil-vivo/canales).
 * Cualquier `tipo`/`network` del perfil se normaliza a una de estas keys.
 */
export type CanalKey =
  | 'web'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'messenger'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'telegram'
  | 'threads'
  | 'pinterest'
  | 'snapchat'
  | 'maps'
  | 'tripadvisor'
  | 'spotify'
  | 'twitch'
  | 'discord'
  | 'behance'
  | 'vimeo'
  | 'soundcloud'
  | 'github'
  | 'medium'
  | 'reddit'
  | 'google'
  | 'kwai'
  | 'custom';

const ORDEN: CanalKey[] = [
  'web',
  'whatsapp',
  'instagram',
  'facebook',
  'messenger',
  'tiktok',
  'kwai',
  'youtube',
  'linkedin',
  'x',
  'telegram',
  'threads',
  'pinterest',
  'snapchat',
  'maps',
  'tripadvisor',
  'spotify',
  'twitch',
  'discord',
  'behance',
  'vimeo',
  'soundcloud',
  'github',
  'medium',
  'reddit',
  'google',
  'custom',
];

const ICONS: Record<Exclude<CanalKey, 'custom'>, string> = {
  web: '/perfil-vivo/canales/web.png',
  whatsapp: '/perfil-vivo/canales/whatsapp.png',
  instagram: '/perfil-vivo/canales/instagram.png',
  facebook: '/perfil-vivo/canales/facebook.png',
  messenger: '/perfil-vivo/canales/messenger.png',
  tiktok: '/perfil-vivo/canales/tiktok.png',
  youtube: '/perfil-vivo/canales/youtube.png',
  linkedin: '/perfil-vivo/canales/linkedin.png',
  x: '/perfil-vivo/canales/x.png',
  telegram: '/perfil-vivo/canales/telegram.png',
  threads: '/perfil-vivo/canales/threads.png',
  pinterest: '/perfil-vivo/canales/pinterest.png',
  snapchat: '/perfil-vivo/canales/snapchat.png',
  maps: '/perfil-vivo/canales/maps.png',
  tripadvisor: '/perfil-vivo/canales/tripadvisor.png',
  spotify: '/perfil-vivo/canales/spotify.png',
  twitch: '/perfil-vivo/canales/twitch.png',
  discord: '/perfil-vivo/canales/discord.png',
  behance: '/perfil-vivo/canales/behance.png',
  vimeo: '/perfil-vivo/canales/vimeo.png',
  soundcloud: '/perfil-vivo/canales/soundcloud.png',
  github: '/perfil-vivo/canales/github.png',
  medium: '/perfil-vivo/canales/medium.png',
  reddit: '/perfil-vivo/canales/reddit.png',
  google: '/perfil-vivo/canales/google.png',
  kwai: '/perfil-vivo/canales/kwai.png',
};

const LABELS: Record<Exclude<CanalKey, 'custom'>, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  messenger: 'Messenger',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X',
  telegram: 'Telegram',
  threads: 'Threads',
  pinterest: 'Pinterest',
  snapchat: 'Snapchat',
  maps: 'Maps',
  tripadvisor: 'TripAdvisor',
  spotify: 'Spotify',
  twitch: 'Twitch',
  discord: 'Discord',
  behance: 'Behance',
  vimeo: 'Vimeo',
  soundcloud: 'SoundCloud',
  github: 'GitHub',
  medium: 'Medium',
  reddit: 'Reddit',
  google: 'Google',
  kwai: 'Kwai',
};

export function normalizeCanalTipo(raw: string): CanalKey {
  const t = raw.toLowerCase().trim().replace(/\s+/g, '');
  if (!t) return 'custom';
  if (t === 'web' || t === 'sitio' || t === 'website' || t === 'site') return 'web';
  if (t.includes('whatsapp') || t === 'wa' || t === 'wsp') return 'whatsapp';
  if (t.includes('instagram') || t === 'ig') return 'instagram';
  if (t.includes('messenger') || t === 'fbmsg') return 'messenger';
  if (t.includes('facebook') || t === 'fb') return 'facebook';
  if (t.includes('tiktok') || t === 'tt') return 'tiktok';
  if (t.includes('youtube') || t === 'yt') return 'youtube';
  if (t.includes('linkedin') || t === 'in') return 'linkedin';
  if (t === 'x' || t.includes('twitter') || t === 'tweet') return 'x';
  if (t.includes('telegram') || t === 'tg') return 'telegram';
  if (t.includes('threads')) return 'threads';
  if (t.includes('pinterest') || t === 'pin') return 'pinterest';
  if (t.includes('snapchat') || t === 'snap') return 'snapchat';
  if (
    t.includes('maps') ||
    t.includes('gmaps') ||
    t === 'googlemaps' ||
    t === 'googlemap' ||
    t.includes('ubicacion') ||
    t.includes('ubicación')
  ) {
    return 'maps';
  }
  if (t.includes('tripadvisor') || t === 'ta') return 'tripadvisor';
  if (t.includes('spotify')) return 'spotify';
  if (t.includes('twitch')) return 'twitch';
  if (t.includes('discord')) return 'discord';
  if (t.includes('behance')) return 'behance';
  if (t.includes('vimeo')) return 'vimeo';
  if (t.includes('soundcloud')) return 'soundcloud';
  if (t.includes('github') || t === 'gh') return 'github';
  if (t.includes('medium')) return 'medium';
  if (t.includes('reddit')) return 'reddit';
  if (t === 'google' || t.includes('googlebusiness') || t.includes('gmb') || t.includes('mybusiness')) {
    return 'google';
  }
  if (t.includes('kwai') || t.includes('kuaishou')) return 'kwai';
  return 'custom';
}

function waHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

type Link = { key: CanalKey; label: string; href: string; icon: string };

/** Canales con logos PNG; Web primero (o link del perfil si no hay sitio). */
export function CanalesShell() {
  const { payload } = usePerfil();
  const { contacto, slug } = payload.negocio;
  const profileUrl = `/@${slug}`;

  const byKey = new Map<CanalKey, Link>();

  const webHref = contacto.web?.trim() || profileUrl;
  byKey.set('web', {
    key: 'web',
    label: LABELS.web,
    href: webHref,
    icon: ICONS.web,
  });

  if (contacto.whatsapp?.trim()) {
    byKey.set('whatsapp', {
      key: 'whatsapp',
      label: LABELS.whatsapp,
      href: waHref(contacto.whatsapp),
      icon: ICONS.whatsapp,
    });
  }

  const customLinks: Link[] = [];

  for (const r of contacto.redes ?? []) {
    if (!r.activa || !r.url?.trim()) continue;
    const key = normalizeCanalTipo(r.tipo);
    if (key === 'web') {
      // Web siempre primero; si hay URL propia, reemplaza el fallback del perfil
      byKey.set('web', {
        key: 'web',
        label: LABELS.web,
        href: r.url.trim(),
        icon: ICONS.web,
      });
      continue;
    }
    if (key === 'custom') {
      const label =
        r.tipo.trim().slice(0, 1).toUpperCase() + r.tipo.trim().slice(1).toLowerCase();
      customLinks.push({
        key: 'custom',
        label: label || 'Link',
        href: r.url.trim(),
        icon: ICONS.web,
      });
      continue;
    }
    byKey.set(key, {
      key,
      label: LABELS[key],
      href: r.url.trim(),
      icon: ICONS[key],
    });
  }

  const links: Link[] = [];
  for (const k of ORDEN) {
    if (k === 'custom') {
      links.push(...customLinks);
      continue;
    }
    const item = byKey.get(k);
    if (item) links.push(item);
  }

  if (!links.length) return null;

  return (
    <section className="pv-modulo" id="canales">
      <div className="pv-panel">
        <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
          Canales y redes
        </h2>
        <div className="pv-canales">
          {links.map((l) => (
            <a
              key={`${l.key}-${l.href}`}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="pv-canales__tile"
              title={l.label}
              aria-label={l.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.icon}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                className="pv-canales__img"
              />
              <span className="pv-canales__label">{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
