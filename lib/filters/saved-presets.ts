import { Categoria } from '@/types';
import { BrowseFilterState } from './types';

const STORAGE_KEY = 'adis_saved_filter_presets';
const MAX_PRESETS = 8;

export interface SavedFilterPreset {
  id: string;
  name: string;
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  createdAt: string;
}

function readAll(): SavedFilterPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedFilterPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(presets: SavedFilterPreset[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)));
}

export function getSavedFilterPresets(categoria?: Categoria | 'todos'): SavedFilterPreset[] {
  const all = readAll();
  if (!categoria) return all;
  return all.filter((p) => p.categoria === categoria || p.categoria === 'todos');
}

export function saveFilterPreset(
  name: string,
  categoria: Categoria | 'todos',
  filters: BrowseFilterState,
): SavedFilterPreset {
  const preset: SavedFilterPreset = {
    id: `preset_${Date.now()}`,
    name: name.trim().slice(0, 40) || 'Mi filtro',
    categoria,
    filters: { ...filters, facets: { ...filters.facets } },
    createdAt: new Date().toISOString(),
  };
  const next = [preset, ...readAll().filter((p) => p.name !== preset.name)].slice(0, MAX_PRESETS);
  writeAll(next);
  return preset;
}

export function deleteSavedFilterPreset(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}
