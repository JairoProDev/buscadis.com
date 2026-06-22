import type { ProfileBlock, ProfileBlockType } from '@/types/business';
import { DEFAULT_PROFILE_BLOCKS } from '@/lib/business/profile-blocks';
import { getTemplateById } from '@/lib/business/templates/registry';

const BLOCK_TYPES: ProfileBlockType[] = [
  'hero', 'highlights', 'catalog', 'deals', 'links', 'reviews', 'map', 'cta', 'text', 'embed',
];

function isValidBlock(b: unknown): b is ProfileBlock {
  if (!b || typeof b !== 'object') return false;
  const block = b as ProfileBlock;
  return (
    typeof block.id === 'string' &&
    BLOCK_TYPES.includes(block.type) &&
    typeof block.visible === 'boolean' &&
    block.config !== null &&
    typeof block.config === 'object'
  );
}

/** Merge saved blocks with template defaults; ensure all required types exist */
export function normalizeProfileBlocks(
  blocks?: ProfileBlock[] | null,
  templateId?: string | null
): ProfileBlock[] {
  const template = getTemplateById(templateId || 'modern_tabs');
  const defaults = template?.defaultBlocks?.length
    ? template.defaultBlocks
    : DEFAULT_PROFILE_BLOCKS;

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return defaults.map((b) => ({ ...b, config: { ...b.config } }));
  }

  const valid = blocks.filter(isValidBlock);
  if (valid.length === 0) return defaults.map((b) => ({ ...b, config: { ...b.config } }));

  const byType = new Map<ProfileBlockType, ProfileBlock>();
  for (const b of valid) byType.set(b.type, b);

  const merged: ProfileBlock[] = [];
  const seen = new Set<string>();

  for (const def of defaults) {
    const saved = byType.get(def.type);
    if (saved) {
      merged.push({ ...def, ...saved, config: { ...def.config, ...saved.config } });
      seen.add(saved.id);
    } else {
      merged.push({ ...def, config: { ...def.config } });
    }
  }

  for (const b of valid) {
    if (!seen.has(b.id) && !merged.some((m) => m.type === b.type)) {
      merged.push(b);
    }
  }

  return merged;
}

export function getVisibleBlocks(blocks: ProfileBlock[]): ProfileBlock[] {
  return blocks.filter((b) => b.visible);
}

/** Map block type to tab id for tabs paradigm */
export function blockTypeToTabId(type: ProfileBlockType): string | null {
  const map: Partial<Record<ProfileBlockType, string>> = {
    catalog: 'catalogo',
    map: 'inicio',
    deals: 'feed',
    reviews: 'resenas',
    links: 'inicio',
    text: 'inicio',
  };
  return map[type] ?? null;
}

/** First visible tab for tabs paradigm default selection */
export function getDefaultTabId(blocks: ProfileBlock[]): string {
  const visible = getVisibleBlocks(blocks);
  const contentBlocks = visible.filter((b) => !['hero', 'highlights', 'cta'].includes(b.type));
  const tabs = Array.from(
    new Set(
      contentBlocks
        .map((b) => blockTypeToTabId(b.type))
        .filter((t): t is string => Boolean(t))
    )
  );
  return tabs[0] || 'catalogo';
}
