import type { BusinessProfile } from '@/types/business';

export type ProfileHubId = 'identity' | 'appearance' | 'content' | 'trust';

export type ProfileMilestoneId = 'share_ready' | 'competitive' | 'reference';

export interface ProfileFieldStatus {
  id: string;
  label: string;
  hub: ProfileHubId;
  complete: boolean;
  weight: number;
}

export interface ProfileProgressResult {
  score: number;
  hubScores: Record<ProfileHubId, number>;
  fields: ProfileFieldStatus[];
  missing: string[];
  milestone: ProfileMilestoneId | null;
  milestoneLabel: string | null;
}

const HUB_WEIGHTS: Record<ProfileHubId, number> = {
  identity: 20,
  appearance: 20,
  content: 30,
  trust: 25,
};

const MILESTONES: { id: ProfileMilestoneId; min: number; label: string }[] = [
  { id: 'reference', min: 95, label: 'Perfil referente' },
  { id: 'competitive', min: 80, label: 'Perfil competitivo' },
  { id: 'share_ready', min: 60, label: 'Listo para compartir' },
];

function field(
  id: string,
  label: string,
  hub: ProfileHubId,
  complete: boolean,
  weight: number
): ProfileFieldStatus {
  return { id, label, hub, complete, weight };
}

export function getProfileFieldStatuses(
  profile: Partial<BusinessProfile>,
  productCount = 0,
  dealCount = 0
): ProfileFieldStatus[] {
  const hashtags = profile.profile_hashtags?.filter((t) => t.trim()) ?? [];
  const socialCount = profile.social_links?.filter((l) => l.url?.trim()).length ?? 0;
  const highlights = profile.story_highlights?.filter((h) => h.title?.trim()) ?? [];
  const metricsKeys = profile.metrics_config?.keys?.length ?? 0;
  const deepBlocks =
    profile.profile_blocks?.filter(
      (b) => ['timeline', 'portfolio', 'case_study', 'faq', 'team', 'text'].includes(b.type) && b.visible
    ).length ?? 0;

  return [
    field('name', 'Nombre', 'identity', Boolean(profile.name?.trim()), 3),
    field('slug', 'Usuario URL', 'identity', Boolean(profile.slug?.trim()), 3),
    field('tagline', 'Eslogan', 'identity', Boolean(profile.tagline?.trim()), 2),
    field('description', 'Descripción', 'identity', (profile.description?.length ?? 0) > 20, 4),
    field('hashtags', 'Etiquetas', 'identity', hashtags.length >= 2, 2),
    field('location', 'Ubicación', 'identity', Boolean(profile.contact_address?.trim()), 3),
    field('logo', 'Logo', 'appearance', Boolean(profile.logo_url), 4),
    field('banner', 'Portada', 'appearance', Boolean(profile.banner_url || profile.banner_config?.imageUrl), 4),
    field('banner_cta', 'CTA portada', 'appearance', Boolean(profile.banner_config?.cta?.label), 2),
    field('background', 'Fondo', 'appearance', Boolean(profile.profile_layout?.background?.value), 2),
    field('theme_color', 'Color primario', 'appearance', Boolean(profile.theme_color), 2),
    field('theme_accent', 'Color secundario', 'appearance', Boolean(profile.theme_accent_color), 2),
    field('metrics', 'Métricas', 'content', metricsKeys >= 1, 3),
    field('highlights', 'Destacados', 'content', highlights.length >= 1, 3),
    field('catalog', 'Catálogo', 'content', productCount >= 1, 5),
    field('sections', 'Secciones', 'content', (profile.profile_blocks?.length ?? 0) >= 3, 2),
    field('deep_blocks', 'Info profunda', 'content', deepBlocks >= 1, 3),
    field('social', 'Redes', 'trust', socialCount >= 1, 4),
    field('whatsapp', 'WhatsApp', 'trust', Boolean(profile.contact_whatsapp?.trim()), 5),
    field('hours', 'Horarios', 'trust', Boolean(profile.business_hours && Object.keys(profile.business_hours).length > 0), 3),
    field('seo', 'SEO', 'trust', Boolean(profile.meta_title?.trim()), 2),
    field('qr', 'QR', 'trust', Boolean(profile.slug), 2),
  ];
}

export function computeProfileProgress(
  profile: Partial<BusinessProfile>,
  productCount = 0,
  dealCount = 0
): ProfileProgressResult {
  const fields = getProfileFieldStatuses(profile, productCount, dealCount);

  const hubTotals: Record<ProfileHubId, { done: number; total: number }> = {
    identity: { done: 0, total: 0 },
    appearance: { done: 0, total: 0 },
    content: { done: 0, total: 0 },
    trust: { done: 0, total: 0 },
  };

  for (const f of fields) {
    hubTotals[f.hub].total += f.weight;
    if (f.complete) hubTotals[f.hub].done += f.weight;
  }

  const hubScores = Object.fromEntries(
    (Object.keys(hubTotals) as ProfileHubId[]).map((hub) => [
      hub,
      hubTotals[hub].total
        ? Math.round((hubTotals[hub].done / hubTotals[hub].total) * 100)
        : 0,
    ])
  ) as Record<ProfileHubId, number>;

  let score = 0;
  for (const hub of Object.keys(HUB_WEIGHTS) as ProfileHubId[]) {
    score += (hubScores[hub] / 100) * HUB_WEIGHTS[hub];
  }
  score = Math.round(score);

  const missing = fields.filter((f) => !f.complete).map((f) => f.label).slice(0, 4);
  const milestone = MILESTONES.find((m) => score >= m.min) ?? null;

  return {
    score,
    hubScores,
    fields,
    missing,
    milestone: milestone?.id ?? null,
    milestoneLabel: milestone?.label ?? null,
  };
}

export function isFieldComplete(fieldId: string, fields: ProfileFieldStatus[]): boolean {
  return fields.find((f) => f.id === fieldId)?.complete ?? false;
}
