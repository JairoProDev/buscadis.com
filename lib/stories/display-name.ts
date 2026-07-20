import type { Story, StoryGroup } from '@/types';

const PLATFORM_NAMES = new Set([
  'buscadis',
  'buscadis publicadis',
  'buscadis publicidad',
  'buscadis publicad',
]);

const GENERIC_NAMES = new Set([
  'usuario',
  'anunciante',
  'user',
  ...PLATFORM_NAMES,
]);

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function isPlatformPublisherName(name: string | undefined | null): boolean {
  if (!name?.trim()) return false;
  return PLATFORM_NAMES.has(name.trim().toLowerCase());
}

function isGenericPublisherName(name: string | undefined | null): boolean {
  if (!name?.trim()) return true;
  return GENERIC_NAMES.has(name.trim().toLowerCase());
}

/** Extrae nombre de empresa/marca desde título de aviso o caption de historia */
export function extractPublisherFromCaption(caption: string | undefined | null): string | null {
  if (!caption?.trim()) return null;
  const text = normalizeName(caption);

  const paraMatch = text.match(/^(.+?)\s+para\s+([^|–—\-]+?)(?:\s*[|–—\-]|$)/i);
  if (paraMatch?.[2]) {
    const org = normalizeName(paraMatch[2]);
    if (org.length >= 3 && org.length <= 48) return org;
  }

  const contratandoMatch = text.match(/^(.+?)\s+est[aá]\s+contratando/i);
  if (contratandoMatch?.[1]) {
    const org = normalizeName(contratandoMatch[1]);
    if (org.length >= 3 && org.length <= 48) return org;
  }

  const pipeParts = text.split(/\s*[|–—]\s*/);
  if (pipeParts.length >= 2) {
    const tail = normalizeName(pipeParts[pipeParts.length - 1]);
    if (tail.length >= 3 && tail.length <= 40 && !/^\d/.test(tail)) return tail;
  }

  return null;
}

/**
 * Nombre visible en el rail de historias.
 * - Cuenta plataforma Buscadis → "Verificado"
 * - Nombre de perfil/negocio real → ese nombre
 * - Nunca "Anunciante" genérico
 */
export function resolveStoryPublisherName(group: StoryGroup): string {
  const profileName = group.vendedor?.nombre?.trim();

  if (isPlatformPublisherName(profileName)) {
    return 'Verificado';
  }

  if (profileName && !isGenericPublisherName(profileName)) {
    return profileName;
  }

  for (const story of group.stories) {
    const fromCaption = extractPublisherFromCaption(story.caption);
    if (fromCaption && !isGenericPublisherName(fromCaption)) return fromCaption;
  }

  if (isPlatformPublisherName(profileName) || !profileName) {
    return 'Verificado';
  }

  return profileName;
}

export function resolveStoryPublisherNameFromStory(story: Story): string {
  const profileName = story.vendedor?.nombre?.trim();
  if (isPlatformPublisherName(profileName)) return 'Verificado';
  if (profileName && !isGenericPublisherName(profileName)) return profileName;
  const fromCaption = extractPublisherFromCaption(story.caption);
  if (fromCaption && !isGenericPublisherName(fromCaption)) return fromCaption;
  return profileName && !isGenericPublisherName(profileName) ? profileName : 'Verificado';
}

/** Texto corto de tiempo restante para FOMO en el rail (ej. "2h 15m", "42m"). */
export function formatStoryTimeRemaining(visibleUntil: string | undefined | null): string | null {
  if (!visibleUntil) return null;
  const ms = new Date(visibleUntil).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return 'Expira ya';
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
  }
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
