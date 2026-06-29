import type { BusinessProfile, CustomBlock, SocialLink } from '@/types/business';
import { normalizeSocialLinks } from '@/lib/business/normalize-profile';
import { getPublicadisSiteUrl, getBuscadisProfileUrl } from '@/lib/business/publicadis';
import { getWhatsappUrl } from '@/lib/business/public-utils';

const NETWORK_LABELS: Record<SocialLink['network'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  custom: 'Enlace',
};

const MESSAGING_PATTERNS = [
  'wa.me',
  'whatsapp.com',
  'api.whatsapp',
  't.me',
  'telegram.me',
  'telegram.org',
  'm.me',
  'messenger.com',
  'fb-messenger',
] as const;

const SOCIAL_URL_PATTERNS: { key: SocialBrandKey; patterns: string[] }[] = [
  { key: 'whatsapp', patterns: ['wa.me', 'whatsapp.com', 'api.whatsapp'] },
  { key: 'telegram', patterns: ['t.me', 'telegram.me', 'telegram.org'] },
  { key: 'messenger', patterns: ['m.me', 'messenger.com', 'fb-messenger'] },
  { key: 'instagram', patterns: ['instagram.com', 'instagr.am'] },
  { key: 'facebook', patterns: ['facebook.com', 'fb.com', 'fb.me'] },
  { key: 'tiktok', patterns: ['tiktok.com'] },
  { key: 'linkedin', patterns: ['linkedin.com'] },
  { key: 'youtube', patterns: ['youtube.com', 'youtu.be'] },
  { key: 'twitter', patterns: ['twitter.com', 'x.com'] },
  { key: 'pinterest', patterns: ['pinterest.com', 'pin.it'] },
  { key: 'threads', patterns: ['threads.net'] },
  { key: 'spotify', patterns: ['spotify.com', 'open.spotify.com'] },
];

function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    const path = u.pathname.replace(/\/$/, '').toLowerCase();
    return `${host}${path}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

function urlMatches(url: string, patterns: string[]): boolean {
  const lower = url.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function isMessagingUrl(url: string): boolean {
  return urlMatches(url, [...MESSAGING_PATTERNS]);
}

function getPrimaryWebsiteUrl(profile: Partial<BusinessProfile>): string | null {
  const links = profile.social_links;
  if (links && typeof links === 'object' && !Array.isArray(links)) {
    const obj = links as Record<string, unknown>;
    const direct = obj.website ?? obj.website_url;
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
  }
  if (Array.isArray(links)) {
    const site = links.find(
      (l) =>
        l.url?.trim() &&
        !isMessagingUrl(l.url) &&
        !urlMatches(l.url, ['instagram.com', 'facebook.com', 'tiktok.com', 'linkedin.com', 'twitter.com', 'x.com']) &&
        (l.label?.toLowerCase().includes('sitio') ||
          l.label?.toLowerCase().includes('website') ||
          l.label?.toLowerCase().includes('página web') ||
          (l.network === 'custom' && !l.url.includes('publicadis.com') && !l.url.includes('buscadis.com')))
    );
    if (site?.url) return site.url.trim();
  }
  return null;
}

function isDuplicateActionBarLink(url: string, profile: Partial<BusinessProfile>): boolean {
  const publicadis = getPublicadisSiteUrl(profile);
  const buscadis = getBuscadisProfileUrl(profile);
  const website = getPrimaryWebsiteUrl(profile);
  const normalized = normalizeUrlKey(url);
  if (publicadis && normalized === normalizeUrlKey(publicadis)) return true;
  if (buscadis && normalized === normalizeUrlKey(buscadis)) return true;
  if (website && normalized === normalizeUrlKey(website)) return true;
  return false;
}

/** Redes visibles en hero (excluye sitio web ya en action bar) */
export function getHeroSocialLinks(profile: Partial<BusinessProfile>): SocialLink[] {
  const links = normalizeSocialLinks(profile.social_links);
  return links.filter((link) => {
    if (!link.url?.trim()) return false;
    if (isDuplicateActionBarLink(link.url, profile)) return false;
    const label = (link.label || '').toLowerCase();
    if (label.includes('buscadis')) return false;
    if (label.includes('sitio web') || label.includes('website') || label.includes('página web')) {
      return false;
    }
    if (label.includes('publicadis') && link.url.includes('publicadis.com')) return false;
    return true;
  });
}

function buildWhatsappLink(profile: Partial<BusinessProfile>): SocialLink | null {
  const phone = profile.contact_whatsapp?.trim();
  if (!phone) return null;
  const url = getWhatsappUrl(phone, profile.name || 'Negocio');
  return { network: 'custom', url, label: 'WhatsApp' };
}

/** Strip del wireframe: web, WhatsApp, luego redes (sin duplicados). */
export function getWireframeSocialLinks(profile: Partial<BusinessProfile>): SocialLink[] {
  const links: SocialLink[] = [];
  const seen = new Set<string>();

  const add = (link: SocialLink) => {
    const key = normalizeUrlKey(link.url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    links.push(link);
  };

  const website = getPrimaryWebsiteUrl(profile);
  const publicadis = getPublicadisSiteUrl(profile);

  if (website) {
    add({ network: 'custom', url: website, label: 'Página Web' });
  } else if (publicadis) {
    add({ network: 'custom', url: publicadis, label: 'Página Web' });
  }

  const whatsapp = buildWhatsappLink(profile);
  if (whatsapp) add(whatsapp);

  for (const link of getHeroSocialLinks(profile)) {
    const key = normalizeUrlKey(link.url);
    if (seen.has(key)) continue;
    if (link.url?.includes('publicadis.com') && publicadis) continue;
    if (link.url?.includes('buscadis.com')) continue;
    add(link);
  }

  return links;
}

export type SocialBrandKey =
  | 'website'
  | 'whatsapp'
  | 'telegram'
  | 'messenger'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'pinterest'
  | 'threads'
  | 'spotify'
  | 'custom';

const BRAND_LABELS: Record<SocialBrandKey, string> = {
  website: 'Página Web',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  messenger: 'Messenger',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  twitter: 'X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  threads: 'Threads',
  spotify: 'Spotify',
  custom: 'Enlace',
};

function isWebsiteLink(link: SocialLink): boolean {
  const brand = detectBrandFromUrl(link.url);
  if (brand && brand !== 'website') return false;
  const label = (link.label || '').toLowerCase();
  if (label.includes('sitio') || label.includes('website') || label.includes('página web')) {
    return true;
  }
  return (
    link.network === 'custom' &&
    !isMessagingUrl(link.url) &&
    !SOCIAL_URL_PATTERNS.some(({ key, patterns }) => key !== 'website' && urlMatches(link.url, patterns))
  );
}

function detectBrandFromUrl(url: string): SocialBrandKey | null {
  const lower = url.toLowerCase();
  for (const { key, patterns } of SOCIAL_URL_PATTERNS) {
    if (urlMatches(lower, patterns)) return key;
  }
  return null;
}

export function getSocialBrandKey(link: SocialLink): SocialBrandKey {
  if (link.network && link.network !== 'custom' && link.network in NETWORK_LABELS) {
    const fromNetwork = link.network as Exclude<SocialLink['network'], 'custom'>;
    if (fromNetwork === 'twitter') return 'twitter';
    return fromNetwork as SocialBrandKey;
  }

  const fromUrl = detectBrandFromUrl(link.url);
  if (fromUrl) return fromUrl;

  const label = (link.label || '').toLowerCase();
  if (label.includes('whatsapp')) return 'whatsapp';
  if (label.includes('telegram')) return 'telegram';
  if (label.includes('messenger')) return 'messenger';

  if (isWebsiteLink(link)) return 'website';
  return 'custom';
}

export function socialLinkLabel(link: SocialLink): string {
  const brand = getSocialBrandKey(link);
  const custom = link.label?.trim();

  if (custom) {
    const lower = custom.toLowerCase();
    if (lower === 'sitio web' || lower === 'website' || lower.includes('página web')) {
      return 'Página Web';
    }
    if (lower.includes('whatsapp')) return 'WhatsApp';
    if (lower.includes('telegram')) return 'Telegram';
    if (lower.includes('messenger')) return 'Messenger';
    if (brand !== 'custom' && BRAND_LABELS[brand]) return BRAND_LABELS[brand];
    return custom;
  }

  return BRAND_LABELS[brand] || NETWORK_LABELS[link.network] || 'Enlace';
}

export type SocialBrandColors = {
  bg: string;
  text: string;
  border: string;
};

/** Colores de marca — aplicar con style inline (no dependen del purge de Tailwind). */
export const SOCIAL_BRAND_COLORS: Record<SocialBrandKey, SocialBrandColors> = {
  website: { bg: '#ffffff', text: '#334155', border: '#334155' },
  whatsapp: { bg: '#ffffff', text: '#25D366', border: '#25D366' },
  telegram: { bg: '#ffffff', text: '#229ED9', border: '#229ED9' },
  messenger: { bg: '#ffffff', text: '#0084FF', border: '#0084FF' },
  instagram: { bg: '#ffffff', text: '#E1306C', border: '#E1306C' },
  facebook: { bg: '#ffffff', text: '#1877F2', border: '#1877F2' },
  tiktok: { bg: '#ffffff', text: '#010101', border: '#010101' },
  twitter: { bg: '#ffffff', text: '#0F1419', border: '#0F1419' },
  linkedin: { bg: '#ffffff', text: '#0A66C2', border: '#0A66C2' },
  youtube: { bg: '#ffffff', text: '#FF0000', border: '#FF0000' },
  pinterest: { bg: '#ffffff', text: '#BD081C', border: '#BD081C' },
  threads: { bg: '#ffffff', text: '#101010', border: '#101010' },
  spotify: { bg: '#ffffff', text: '#1DB954', border: '#1DB954' },
  custom: { bg: 'var(--brand-color)', text: '#ffffff', border: 'var(--brand-color)' },
};

export function socialLinksToCustomBlocks(links: SocialLink[]): CustomBlock[] {
  return links.map((link, index) => ({
    id: `social-derived-${index}`,
    type: 'link' as const,
    label: socialLinkLabel(link),
    content: link.url,
    style: 'default' as const,
  }));
}

/** Bloques linktree: custom_blocks o derivados de social_links */
export function resolveLinktreeBlocks(profile: Partial<BusinessProfile>): CustomBlock[] {
  const custom = profile.custom_blocks?.filter((b) => b.content || b.type === 'text') ?? [];
  if (custom.length > 0) return custom;
  return socialLinksToCustomBlocks(getHeroSocialLinks(profile));
}

export function profileIsOrphan(profile: Partial<BusinessProfile>): boolean {
  return !profile.user_id;
}
