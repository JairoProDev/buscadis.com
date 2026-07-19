'use client';

import { useState } from 'react';
import type { BannerConfig, BusinessProfile } from '@/types/business';
import { IconCheck } from '@/components/Icons';

interface CtaEditorProps {
  profile: Partial<BusinessProfile>;
  onPatch: (patch: Partial<BusinessProfile>) => void;
  onClose: () => void;
}

type CtaAction = NonNullable<BannerConfig['cta']>['action'];

const ACTIONS: { value: CtaAction; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'link', label: 'Enlace externo' },
  { value: 'contact', label: 'Contacto' },
  { value: 'cart', label: 'Carrito' },
];

export default function CtaEditor({ profile, onPatch, onClose }: CtaEditorProps) {
  const existing = profile.banner_config?.cta;
  const [label, setLabel] = useState(existing?.label || 'Contactar');
  const [action, setAction] = useState<CtaAction>(existing?.action || 'whatsapp');
  const [href, setHref] = useState(existing?.href || '');

  const handleSave = () => {
    const baseConfig: BannerConfig = profile.banner_config
      ? { ...profile.banner_config }
      : { mode: 'image' };
    onPatch({
      banner_config: {
        ...baseConfig,
        cta: {
          label: label.trim() || 'Contactar',
          action,
          href: action === 'link' ? href.trim() : existing?.href,
        },
      },
    });
    onClose();
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Texto del botón</label>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Contactar"
        className="w-full px-3 py-2.5 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors mb-4"
        style={{ borderColor: 'var(--border-color)' }}
        autoFocus
      />

      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Acción</label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ACTIONS.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => setAction(a.value)}
            className={
              'py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ' +
              (action === a.value
                ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]'
                : 'border-slate-200 text-slate-500 hover:border-slate-300')
            }
          >
            {a.label}
          </button>
        ))}
      </div>

      {action === 'link' && (
        <>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL del enlace</label>
          <input
            type="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors mb-4"
            style={{ borderColor: 'var(--border-color)' }}
          />
        </>
      )}

      {action === 'whatsapp' && !profile.contact_whatsapp && (
        <p className="text-xs text-amber-600 mb-4">
          Agrega tu número de WhatsApp en enlaces para que este botón funcione.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          style={{ backgroundColor: 'var(--brand-blue)' }}
        >
          <IconCheck size={18} />
          Guardar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 rounded-xl font-medium hover:bg-slate-100 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
