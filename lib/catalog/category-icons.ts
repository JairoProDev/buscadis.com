/** Iconos visuales para categorías de catálogo (fallback cuando no hay foto de producto). */
const CATEGORY_ICONS: Record<string, string> = {
  'tuberías y accesorios': '🔩',
  tuberías: '🔩',
  'pinturas y accesorios': '🎨',
  'accesorios eléctricos': '⚡',
  iluminación: '💡',
  'ferretería varios': '🔧',
  'plásticos, mallas y arpilleras': '🌿',
  'mangueras y riego': '💧',
  grifería: '🚿',
  productos: '📦',
  otros: '🏷️',
};

function normalizeCategoryKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Emoji o null si no hay mapeo (el UI puede usar inicial). */
export function getCategoryIconEmoji(category: string | null | undefined): string | null {
  if (!category?.trim()) return CATEGORY_ICONS.otros;
  const key = normalizeCategoryKey(category);
  return CATEGORY_ICONS[key] ?? null;
}

/** Data URL SVG con emoji centrado — usable como src de img en squircle. */
export function getCategoryIconDataUrl(category: string | null | undefined): string | null {
  const emoji = getCategoryIconEmoji(category);
  if (!emoji) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="#f1f5f9"/><text x="48" y="58" font-size="42" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
