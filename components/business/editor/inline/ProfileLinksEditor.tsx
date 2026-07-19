'use client';

import { useState } from 'react';
import type { BusinessProfile, SocialLink } from '@/types/business';
import { getSocialBrandKey, socialLinkLabel } from '@/lib/business/social-display';
import { getSocialIconByBrand } from '@/components/business/public/social-icons';
import { IconCheck, IconTrash, IconWhatsapp } from '@/components/Icons';

interface ProfileLinksEditorProps {
  profile: Partial<BusinessProfile>;
  onPatch: (patch: Partial<BusinessProfile>) => void;
  onClose: () => void;
}

const NETWORK_BY_BRAND: Record<string, SocialLink['network']> = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  twitter: 'twitter',
  linkedin: 'linkedin',
};

function toNetwork(url: string): SocialLink['network'] {
  const brand = getSocialBrandKey({ network: 'custom', url });
  return NETWORK_BY_BRAND[brand] || 'custom';
}

export default function ProfileLinksEditor({ profile, onPatch, onClose }: ProfileLinksEditorProps) {
  const [whatsapp, setWhatsapp] = useState(profile.contact_whatsapp || '');
  const [links, setLinks] = useState<SocialLink[]>(
    Array.isArray(profile.social_links) ? profile.social_links : []
  );

  const updateLink = (idx: number, patch: Partial<SocialLink>) => {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const removeLink = (idx: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addLink = () => {
    setLinks((prev) => [...prev, { network: 'custom', url: '', label: '' }]);
  };

  const handleSave = () => {
    const cleaned = links
      .filter((l) => l.url.trim())
      .map((l) => ({
        network: toNetwork(l.url),
        url: l.url.trim(),
        label: l.label?.trim() || undefined,
      }));
    onPatch({
      contact_whatsapp: whatsapp.trim().replace(/[^\d]/g, ''),
      social_links: cleaned,
    });
    onClose();
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
        <IconWhatsapp size={16} className="text-green-500" /> WhatsApp
      </label>
      <input
        type="tel"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        placeholder="51999999999"
        className="w-full px-3 py-2.5 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors mb-4"
        style={{ borderColor: 'var(--border-color)' }}
      />

      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        Enlaces y redes sociales
      </label>
      <div className="space-y-2 mb-3">
        {links.length === 0 && (
          <p className="text-xs text-slate-400">Aún no hay enlaces. Agrega tu web o tus redes.</p>
        )}
        {links.map((link, idx) => {
          const brand = link.url.trim() ? getSocialBrandKey(link) : 'custom';
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                {getSocialIconByBrand(brand, 16)}
              </span>
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(idx, { url: e.target.value })}
                placeholder="https://instagram.com/tu-negocio"
                className="flex-1 min-w-0 px-3 py-2 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors text-sm"
                style={{ borderColor: 'var(--border-color)' }}
              />
              <button
                type="button"
                onClick={() => removeLink(idx)}
                className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                aria-label="Eliminar enlace"
              >
                <IconTrash size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addLink}
        className="w-full py-2.5 mb-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-colors"
      >
        + Agregar enlace
      </button>

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
