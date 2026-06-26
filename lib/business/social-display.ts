import type { BusinessProfile, CustomBlock, SocialLink } from '@/types/business';
import { normalizeSocialLinks } from '@/lib/business/normalize-profile';
import { getPublicadisSiteUrl, getBuscadisProfileUrl } from '@/lib/business/publicadis';

const NETWORK_LABELS: Record<SocialLink['network'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  custom: 'Enlace',
};

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
        (l.label?.toLowerCase().includes('sitio') ||
          l.label?.toLowerCase().includes('website') ||
          (l.network === 'custom' && !l.url.includes('publicadis.com')))
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
    if (label.includes('sitio web') || label.includes('website')) return false;
    return true;
  });
}

/** Strip del wireframe: sitio web primero, luego redes sociales (sin duplicados) */
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

  for (const link of getHeroSocialLinks(profile)) {
    const key = normalizeUrlKey(link.url);
    if (seen.has(key)) continue;
    if (link.url?.includes('publicadis.com') && publicadis) continue;
    add(link);
  }

  return links;
}

export function socialLinkLabel(link: SocialLink): string {
  if (link.label?.trim()) {
    const raw = link.label.trim();
    const lower = raw.toLowerCase();
    if (lower === 'sitio web' || lower === 'website' || lower.includes('página web')) {
      return 'Página Web';
    }
    return raw;
  }
  if (isWebsiteLink(link)) return 'Página Web';
  return NETWORK_LABELS[link.network] || 'Enlace';
}

function isWebsiteLink(link: SocialLink): boolean {
  const label = (link.label || '').toLowerCase();
  return (
    label.includes('sitio') ||
    label.includes('website') ||
    label.includes('página web') ||
    (link.network === 'custom' &&
      !link.url.includes('instagram') &&
      !link.url.includes('facebook') &&
      !link.url.includes('tiktok') &&
      !link.url.includes('linkedin') &&
      !link.url.includes('twitter') &&
      !link.url.includes('x.com'))
  );
}

export type SocialBrandKey =
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'custom';

export function getSocialBrandKey(link: SocialLink): SocialBrandKey {
  const url = link.url.toLowerCase();
  if (url.includes('instagram')) return 'instagram';
  if (url.includes('facebook') || url.includes('fb.com')) return 'facebook';
  if (url.includes('tiktok')) return 'tiktok';
  if (url.includes('linkedin')) return 'linkedin';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitter') || url.includes('x.com')) return 'twitter';
  if (isWebsiteLink(link)) return 'website';
  return 'custom';
}

/** Clases Tailwind estáticas (bg/text/border + hover invertido). */
export const SOCIAL_BRAND_BUTTON_CLASS: Record<
  SocialBrandKey,
  { base: string; hover: string }
> = {
  website: {
    base: 'bg-slate-800 text-white border-slate-800',
    hover: 'hover:bg-white hover:text-slate-800 hover:border-slate-800',
  },
  instagram: {
    base: 'bg-[#E1306C] text-white border-[#E1306C]',
    hover: 'hover:bg-white hover:text-[#E1306C] hover:border-[#E1306C]',
  },
  facebook: {
    base: 'bg-[#1877F2] text-white border-[#1877F2]',
    hover: 'hover:bg-white hover:text-[#1877F2] hover:border-[#1877F2]',
  },
  tiktok: {
    base: 'bg-[#010101] text-white border-[#010101]',
    hover: 'hover:bg-white hover:text-[#010101] hover:border-[#010101]',
  },
  twitter: {
    base: 'bg-[#0F1419] text-white border-[#0F1419]',
    hover: 'hover:bg-white hover:text-[#0F1419] hover:border-[#0F1419]',
  },
  linkedin: {
    base: 'bg-[#0A66C2] text-white border-[#0A66C2]',
    hover: 'hover:bg-white hover:text-[#0A66C2] hover:border-[#0A66C2]',
  },
  youtube: {
    base: 'bg-[#FF0000] text-white border-[#FF0000]',
    hover: 'hover:bg-white hover:text-[#FF0000] hover:border-[#FF0000]',
  },
  custom: {
    base: 'bg-[var(--brand-color)] text-white border-[var(--brand-color)]',
    hover: 'hover:bg-white hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]',
  },
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
