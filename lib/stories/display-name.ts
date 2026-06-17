import type { Story, StoryGroup } from '@/types';

const GENERIC_NAMES = new Set([
  'usuario',
  'anunciante',
  'user',
  'buscadis publicadis',
  'buscadis',
]);

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
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

export function resolveStoryPublisherName(group: StoryGroup): string {
  const profileName = group.vendedor?.nombre?.trim();
  if (profileName && !isGenericPublisherName(profileName)) {
    return profileName;
  }

  for (const story of group.stories) {
    const fromCaption = extractPublisherFromCaption(story.caption);
    if (fromCaption) return fromCaption;
  }

  if (profileName) return profileName;
  return 'Anunciante';
}

export function resolveStoryPublisherNameFromStory(story: Story): string {
  const profileName = story.vendedor?.nombre?.trim();
  if (profileName && !isGenericPublisherName(profileName)) return profileName;
  const fromCaption = extractPublisherFromCaption(story.caption);
  if (fromCaption) return fromCaption;
  return profileName || 'Anunciante';
}
