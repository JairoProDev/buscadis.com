'use client';

import type { ProfileBlock, ProfileBlockType } from '@/types/business';
import { cn } from '@/lib/utils';

const BLOCK_LABELS: Record<ProfileBlockType, string> = {
  hero: 'Hero',
  highlights: 'Destacados',
  catalog: 'Catálogo',
  deals: 'Deals',
  links: 'Enlaces',
  reviews: 'Reseñas',
  map: 'Mapa e info',
  cta: 'CTA WhatsApp',
  text: 'Texto',
  embed: 'Embed',
  timeline: 'Experiencia',
  portfolio: 'Proyectos',
  case_study: 'Casos de éxito',
  faq: 'FAQ',
  team: 'Equipo',
};

interface BlockInspectorProps {
  block: ProfileBlock | null;
  onUpdateConfig: (config: Record<string, unknown>) => void;
}

export default function BlockInspector({ block, onUpdateConfig }: BlockInspectorProps) {
  if (!block) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        Selecciona un bloque para editar su configuración
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-sm capitalize">{BLOCK_LABELS[block.type] || block.type}</h4>

      {block.type === 'catalog' && (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Vista por defecto</label>
          <select
            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
            value={(block.config.viewMode as string) || 'grid'}
            onChange={(e) => onUpdateConfig({ ...block.config, viewMode: e.target.value })}
          >
            <option value="grid">Cuadrícula</option>
            <option value="list">Lista</option>
            <option value="feed">Feed</option>
          </select>
        </div>
      )}

      {block.type === 'deals' && (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Máx. deals</label>
          <input
            type="number"
            min={1}
            max={20}
            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
            value={(block.config.maxItems as number) || 6}
            onChange={(e) =>
              onUpdateConfig({ ...block.config, maxItems: Number(e.target.value) })
            }
          />
        </div>
      )}

      {block.type === 'text' && (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Contenido</label>
          <textarea
            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm min-h-[120px]"
            value={(block.config.markdown as string) || ''}
            onChange={(e) => onUpdateConfig({ ...block.config, markdown: e.target.value })}
          />
        </div>
      )}

      {block.type === 'embed' && (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">URL (https)</label>
          <input
            type="url"
            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
            value={(block.config.url as string) || ''}
            onChange={(e) => onUpdateConfig({ ...block.config, url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}

      {!['catalog', 'deals', 'text', 'embed'].includes(block.type) && (
        <p className="text-xs text-slate-400">Sin opciones adicionales para este bloque.</p>
      )}
    </div>
  );
}

export { BLOCK_LABELS };
