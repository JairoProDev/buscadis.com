'use client';

import { useState } from 'react';
import type { BusinessProfile } from '@/types/business';
import {
  STRUCTURE_TEMPLATES,
  STYLE_SKINS,
  buildDefaultLayout,
  mergeProfileLayout,
} from '@buscadis/profile-engine';
import { cn } from '@/lib/utils';

interface ProfileLayoutStyleEditorProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
}

export default function ProfileLayoutStyleEditor({
  profile,
  onUpdate,
}: ProfileLayoutStyleEditorProps) {
  const [panel, setPanel] = useState<'structure' | 'style'>('structure');
  const layout = mergeProfileLayout(profile.profile_layout as never);
  const styleId = profile.profile_style?.skinId || layout.styleSkinId;

  const applyStructure = (templateId: string) => {
    const next = buildDefaultLayout(templateId);
    onUpdate({
      profile_layout: {
        ...next,
        styleSkinId: styleId,
      },
    });
  };

  const applySkin = (skinId: string) => {
    const skin = STYLE_SKINS.find((s) => s.id === skinId) ?? STYLE_SKINS[0];
    const preset = ['executive', 'minimal', 'organic', 'nocturno', 'cyberpunk'].includes(skinId)
      ? ((skinId === 'cyberpunk' ? 'nocturno' : skinId) as BusinessProfile['theme_preset'])
      : profile.theme_preset;
    onUpdate({
      profile_style: { skinId, overrides: profile.profile_style?.overrides },
      profile_layout: {
        ...layout,
        styleSkinId: skinId,
      },
      theme_color: skin.color,
      ...(preset ? { theme_preset: preset } : {}),
    });
  };

  const toggleSlot = (component: string) => {
    const slots = layout.slots.map((s) =>
      s.component === component ? { ...s, visible: !s.visible } : s
    );
    onUpdate({ profile_layout: { ...layout, slots } });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
        {(['structure', 'style'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setPanel(tab)}
            className={cn(
              'flex-1 py-1.5 text-xs font-bold rounded-md transition-colors',
              panel === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
            )}
          >
            {tab === 'structure' ? 'Estructura' : 'Estilo'}
          </button>
        ))}
      </div>

      {panel === 'structure' && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Plantilla wireframe</p>
          {STRUCTURE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyStructure(t.id)}
              className={cn(
                'w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors',
                layout.structureTemplateId === t.id
                  ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <span className="font-bold text-slate-800 block">{t.label}</span>
              <span className="text-slate-500">{t.description}</span>
            </button>
          ))}
          <p className="text-[10px] font-bold text-slate-500 uppercase pt-2">Componentes</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {layout.slots.map((slot) => (
              <label
                key={slot.id}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-50"
              >
                <span className="text-slate-700">{slot.component.replace('profile_', '')}</span>
                <input
                  type="checkbox"
                  checked={slot.visible}
                  onChange={() => toggleSlot(slot.component)}
                  className="rounded"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {panel === 'style' && (
        <div className="grid grid-cols-2 gap-2">
          {STYLE_SKINS.filter((skin) => skin.id !== 'cyberpunk').map((skin) => (
            <button
              key={skin.id}
              type="button"
              onClick={() => applySkin(skin.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-semibold',
                styleId === skin.id || (styleId === 'cyberpunk' && skin.id === 'nocturno')
                  ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5'
                  : 'border-slate-200'
              )}
            >
              <span
                className="w-5 h-5 rounded-full border border-white shadow shrink-0"
                style={{ background: skin.color }}
              />
              {skin.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
