import type { BusinessProfile, CustomBlock, ProfileBlock, SocialLink } from '@/types/business';
import { normalizeProfileBlocks } from '@/lib/business/blocks/normalize';

const SOCIAL_NETWORKS = new Set<SocialLink['network']>([
  'facebook',
  'instagram',
  'tiktok',
  'twitter',
  'linkedin',
  'custom',
]);

function isSocialLink(value: unknown): value is SocialLink {
  if (!value || typeof value !== 'object') return false;
  const link = value as SocialLink;
  return typeof link.url === 'string' && SOCIAL_NETWORKS.has(link.network);
}

/** Coerce legacy object-shaped social_links into SocialLink[]. */
export function normalizeSocialLinks(raw: unknown): SocialLink[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.filter(isSocialLink);
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const links: SocialLink[] = [];

    const publicadis = obj.publicadis_site ?? obj.publicadis_url ?? obj.website;
    if (typeof publicadis === 'string' && publicadis.length > 0) {
      links.push({
        network: 'custom',
        url: publicadis,
        label: 'Sitio web Publicadis',
      });
    }

    for (const [key, val] of Object.entries(obj)) {
      if (key === 'publicadis_site' || key === 'publicadis_url' || key === 'website' || key === 'site_tier') {
        continue;
      }
      if (typeof val !== 'string' || !val.startsWith('http')) continue;

      const network = SOCIAL_NETWORKS.has(key as SocialLink['network'])
        ? (key as SocialLink['network'])
        : 'custom';
      links.push({
        network,
        url: val,
        label: network === 'custom' ? key : undefined,
      });
    }

    return links;
  }

  return [];
}

export function normalizeCustomBlocks(raw: unknown): CustomBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((block): block is CustomBlock => {
    if (!block || typeof block !== 'object') return false;
    const b = block as CustomBlock;
    return typeof b.id === 'string' && typeof b.type === 'string';
  });
}

export function normalizeBusinessProfile<T extends Partial<BusinessProfile>>(profile: T): T {
  return {
    ...profile,
    social_links: normalizeSocialLinks(profile.social_links),
    custom_blocks: normalizeCustomBlocks(profile.custom_blocks),
    profile_blocks: normalizeProfileBlocks(profile.profile_blocks, profile.template_id),
    business_hours:
      profile.business_hours && typeof profile.business_hours === 'object' && !Array.isArray(profile.business_hours)
        ? profile.business_hours
        : {},
  };
}
