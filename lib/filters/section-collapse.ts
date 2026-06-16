const COLLAPSE_STORAGE_KEY = 'adis_filter_sections_collapsed_v2';

export function readFilterSectionsCollapsed(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_STORAGE_KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function writeFilterSectionCollapsed(sectionId: string, collapsed: boolean) {
  if (typeof window === 'undefined') return;
  const stored = readFilterSectionsCollapsed();
  stored[sectionId] = collapsed;
  localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(stored));
}
