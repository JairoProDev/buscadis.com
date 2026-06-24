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
    add({ network: 'custom', url: website, label: 'Sitio web' });
  } else if (publicadis) {
    add({ network: 'custom', url: publicadis, label: 'Sitio web' });
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
  if (link.label?.trim()) return link.label.trim();
  return NETWORK_LABELS[link.network] || 'Enlace';
}

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
