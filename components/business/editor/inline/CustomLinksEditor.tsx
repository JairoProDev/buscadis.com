'use client';

import { useState } from 'react';
import type { BusinessProfile, CustomBlock } from '@/types/business';
import { socialLinksToCustomBlocks, getHeroSocialLinks } from '@/lib/business/social-display';
import { IconCheck, IconTrash } from '@/components/Icons';

interface CustomLinksEditorProps {
  profile: Partial<BusinessProfile>;
  onPatch: (patch: Partial<BusinessProfile>) => void;
  onClose: () => void;
}

interface EditableLink {
  id: string;
  label: string;
  content: string;
}

function makeId() {
  return `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function CustomLinksEditor({ profile, onPatch, onClose }: CustomLinksEditorProps) {
  const existing = profile.custom_blocks || [];
  const nonLinkBlocks = existing.filter((b) => b.type !== 'link');
  const seed: EditableLink[] = (() => {
    const linkBlocks = existing.filter((b) => b.type === 'link');
    const source = linkBlocks.length > 0 ? linkBlocks : socialLinksToCustomBlocks(getHeroSocialLinks(profile));
    return source.map((b) => ({ id: b.id || makeId(), label: b.label || '', content: b.content || '' }));
  })();

  const [links, setLinks] = useState<EditableLink[]>(seed);

  const update = (id: string, patch: Partial<EditableLink>) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const remove = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const add = () => setLinks((prev) => [...prev, { id: makeId(), label: '', content: '' }]);

  const handleSave = () => {
    const linkBlocks: CustomBlock[] = links
      .filter((l) => l.content.trim())
      .map((l) => ({
        id: l.id,
        type: 'link' as const,
        label: l.label.trim() || l.content.trim(),
        content: l.content.trim(),
        style: 'default' as const,
      }));
    onPatch({ custom_blocks: [...nonLinkBlocks, ...linkBlocks] });
    onClose();
  };

  return (
    <div>
      <div className="space-y-3 mb-3">
        {links.length === 0 && (
          <p className="text-xs text-slate-400">Agrega botones de enlace para tus clientes.</p>
        )}
        {links.map((link) => (
          <div key={link.id} className="rounded-xl border-2 border-slate-100 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={link.label}
                onChange={(e) => update(link.id, { label: e.target.value })}
                placeholder="Título (ej. Pedidos por WhatsApp)"
                className="flex-1 min-w-0 px-3 py-2 border-2 border-slate-200 rounded-lg outline-none focus:border-[var(--brand-blue)] text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => remove(link.id)}
                className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-50"
                aria-label="Eliminar"
              >
                <IconTrash size={16} />
              </button>
            </div>
            <input
              type="url"
              value={link.content}
              onChange={(e) => update(link.id, { content: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg outline-none focus:border-[var(--brand-blue)] text-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full py-2.5 mb-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-colors"
      >
        + Agregar enlace
      </button>

      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        style={{ backgroundColor: 'var(--brand-blue)' }}
      >
        <IconCheck size={18} />
        Guardar enlaces
      </button>
    </div>
  );
}
