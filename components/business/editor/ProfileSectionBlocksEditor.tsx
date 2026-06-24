'use client';

import { nanoid } from 'nanoid';
import type { BusinessProfile, ProfileBlock, ProfileBlockType } from '@/types/business';
import { DEFAULT_PROFILE_BLOCKS } from '@/lib/business/profile-blocks';
import { IconPlus, IconTrash } from '@/components/Icons';

const SECTION_TEMPLATES: { type: ProfileBlockType; label: string; defaultTitle: string }[] = [
  { type: 'timeline', label: 'Experiencia', defaultTitle: 'Experiencia' },
  { type: 'timeline', label: 'Estudios', defaultTitle: 'Formación' },
  { type: 'portfolio', label: 'Proyectos', defaultTitle: 'Proyectos' },
  { type: 'case_study', label: 'Casos de éxito', defaultTitle: 'Casos de éxito' },
  { type: 'faq', label: 'Preguntas frecuentes', defaultTitle: 'FAQ' },
  { type: 'team', label: 'Equipo', defaultTitle: 'Nuestro equipo' },
  { type: 'text', label: 'Texto libre', defaultTitle: 'Información' },
  { type: 'embed', label: 'Embed / video', defaultTitle: 'Contenido' },
];

interface ProfileSectionBlocksEditorProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
}

const DEEP_TYPES: ProfileBlockType[] = [
  'timeline',
  'portfolio',
  'case_study',
  'faq',
  'team',
  'text',
  'embed',
];

export default function ProfileSectionBlocksEditor({
  profile,
  onUpdate,
}: ProfileSectionBlocksEditorProps) {
  const blocks = profile.profile_blocks ?? DEFAULT_PROFILE_BLOCKS;
  const deepBlocks = blocks.filter((b) => DEEP_TYPES.includes(b.type));

  const addFromTemplate = (type: ProfileBlockType, title: string) => {
    const block: ProfileBlock = {
      id: nanoid(8),
      type,
      visible: true,
      config: { title, items: [] },
    };
    onUpdate({ profile_blocks: [...blocks, block] });
  };

  const updateBlock = (id: string, patch: Partial<ProfileBlock>) => {
    onUpdate({
      profile_blocks: blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };

  const updateConfig = (id: string, configPatch: Record<string, unknown>) => {
    onUpdate({
      profile_blocks: blocks.map((b) =>
        b.id === id ? { ...b, config: { ...b.config, ...configPatch } } : b
      ),
    });
  };

  const removeBlock = (id: string) => {
    onUpdate({ profile_blocks: blocks.filter((b) => b.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {SECTION_TEMPLATES.map((t, i) => (
          <button
            key={`${t.type}-${t.label}-${i}`}
            type="button"
            onClick={() => addFromTemplate(t.type, t.defaultTitle)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
          >
            <IconPlus size={12} /> {t.label}
          </button>
        ))}
      </div>

      {deepBlocks.length === 0 && (
        <p className="text-xs text-slate-400">Añade secciones para estudios, proyectos, FAQ, etc.</p>
      )}

      {deepBlocks.map((b) => (
        <div key={b.id} className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
          <div className="flex items-center justify-between gap-2">
            <input
              className="flex-1 font-bold text-sm border border-slate-200 rounded-lg px-2 py-1"
              value={String(b.config.title || '')}
              onChange={(e) => updateConfig(b.id, { title: e.target.value })}
            />
            <button type="button" onClick={() => removeBlock(b.id)} className="text-red-400 p-1">
              <IconTrash size={14} />
            </button>
          </div>
          <textarea
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 min-h-[80px]"
            value={String(b.config.body || b.config.markdown || '')}
            onChange={(e) =>
              updateConfig(b.id, { body: e.target.value, markdown: e.target.value })
            }
            placeholder="Contenido (texto o lista, una línea por ítem)"
          />
          {b.type === 'embed' && (
            <input
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
              value={String(b.config.url || '')}
              onChange={(e) => updateConfig(b.id, { url: e.target.value })}
              placeholder="URL embed (YouTube, etc.)"
            />
          )}
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={b.visible}
              onChange={(e) => updateBlock(b.id, { visible: e.target.checked })}
            />
            Visible en el perfil
          </label>
        </div>
      ))}
    </div>
  );
}
