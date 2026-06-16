'use client';

import { useState } from 'react';
import type { BusinessProfile, ProfileBlock, ProfileThemePreset } from '@/types/business';
import { DEFAULT_PROFILE_BLOCKS, PROFILE_THEME_PRESETS } from '@/lib/business/profile-blocks';
import { cn } from '@/lib/utils';

type BuilderMode = 'form' | 'chat' | 'visual';

interface ProfileBuilderModesProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
}

export default function ProfileBuilderModes({ profile, onUpdate }: ProfileBuilderModesProps) {
  const [mode, setMode] = useState<BuilderMode>('form');
  const blocks = profile.profile_blocks?.length ? profile.profile_blocks : DEFAULT_PROFILE_BLOCKS;

  const setTheme = (preset: ProfileThemePreset) => {
    const theme = PROFILE_THEME_PRESETS[preset];
    onUpdate({
      theme_color: theme.color,
      theme_mode: theme.mode,
    });
  };

  const toggleBlock = (id: string) => {
    const next = blocks.map((b) =>
      b.id === id ? { ...b, visible: !b.visible } : b
    );
    onUpdate({ profile_blocks: next });
  };

  const reorderBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    onUpdate({ profile_blocks: next });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex gap-2">
        {(['form', 'chat', 'visual'] as BuilderMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-bold capitalize',
              mode === m ? 'bg-[var(--brand-color)] text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {m === 'form' ? 'Formulario' : m === 'chat' ? 'Chat IA' : 'Visual'}
          </button>
        ))}
      </div>

      {mode === 'visual' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase">Bloques del perfil</p>
          {blocks.map((block: ProfileBlock) => (
            <div
              key={block.id}
              className="flex items-center gap-2 rounded-xl border border-slate-100 p-2 text-sm"
            >
              <button type="button" onClick={() => reorderBlock(block.id, -1)} className="px-2 text-slate-400">↑</button>
              <button type="button" onClick={() => reorderBlock(block.id, 1)} className="px-2 text-slate-400">↓</button>
              <span className="flex-1 font-medium capitalize">{block.type}</span>
              <button
                type="button"
                onClick={() => toggleBlock(block.id)}
                className={cn(
                  'text-xs font-bold px-2 py-1 rounded-lg',
                  block.visible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                )}
              >
                {block.visible ? 'Visible' : 'Oculto'}
              </button>
            </div>
          ))}
        </div>
      )}

      {mode === 'chat' && (
        <p className="text-sm text-slate-500">
          Usa el asistente IA del panel para editar con lenguaje natural. Los cambios se reflejan en la vista previa.
        </p>
      )}

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tema curado</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PROFILE_THEME_PRESETS) as ProfileThemePreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className="flex items-center gap-2 rounded-xl border border-slate-100 p-2 text-left text-sm font-medium hover:border-slate-300"
            >
              <span
                className="w-6 h-6 rounded-full border border-white shadow"
                style={{ background: PROFILE_THEME_PRESETS[key].color }}
              />
              {PROFILE_THEME_PRESETS[key].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
