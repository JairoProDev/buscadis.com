'use client';

import type { BusinessProfile, LocationDisplayLevel } from '@/types/business';
import FieldLabel from '@/components/business/editor/FieldLabel';
import { isFieldComplete, type ProfileFieldStatus } from '@/lib/business/profile-progress';

const HASHTAG_SUGGESTIONS = ['negocios', 'peru', 'ofertas', 'whatsapp', 'local', 'servicios'];

interface IdentityHubFieldsProps {
  profile: Partial<BusinessProfile>;
  setProfile: (p: Partial<BusinessProfile>) => void;
  fields: ProfileFieldStatus[];
}

export default function IdentityHubFields({ profile, setProfile, fields }: IdentityHubFieldsProps) {
  const done = (id: string) => isFieldComplete(id, fields);
  const hashtags = profile.profile_hashtags ?? [];

  const addHashtag = (tag: string) => {
    const clean = tag.replace(/^#/, '').trim().toLowerCase();
    if (!clean || hashtags.includes(clean)) return;
    setProfile({ ...profile, profile_hashtags: [...hashtags, clean] });
  };

  const removeHashtag = (tag: string) => {
    setProfile({ ...profile, profile_hashtags: hashtags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-5">
      <label className="block">
        <FieldLabel number={1} label="Nombre" complete={done('name')} />
        <input
          type="text"
          value={profile.name || ''}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-800"
          placeholder="Ej. Cafetería Aroma"
        />
      </label>

      <label className="block">
        <FieldLabel number={2} label="Usuario (URL)" complete={done('slug')} />
        <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 overflow-hidden">
          <span className="pl-3 pr-0 text-slate-400 text-xs font-mono shrink-0 select-none">buscadis.com/@</span>
          <input
            type="text"
            value={profile.slug || ''}
            onChange={(e) =>
              setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
            }
            className="flex-1 py-3 pr-4 bg-transparent outline-none text-slate-900 font-bold text-sm"
            placeholder="tu-marca"
          />
        </div>
      </label>

      <label className="block">
        <FieldLabel number={3} label="Eslogan" complete={done('tagline')} />
        <input
          type="text"
          value={profile.tagline || ''}
          onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 outline-none text-sm"
          placeholder="Ej. Marketplace LATAM"
        />
      </label>

      <label className="block">
        <FieldLabel number={4} label="Descripción" complete={done('description')} />
        <textarea
          value={profile.description || ''}
          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 outline-none h-28 resize-none text-sm"
          placeholder="Describe tu negocio..."
        />
      </label>

      <div>
        <FieldLabel number={5} label="Etiquetas" complete={done('hashtags')} />
        <div className="flex flex-wrap gap-1.5 mb-2">
          {hashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeHashtag(tag)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--brand-blue,#53acc5)]/10 text-[var(--brand-blue,#53acc5)] hover:bg-red-50 hover:text-red-600"
            >
              #{tag} ×
            </button>
          ))}
        </div>
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2"
          placeholder="Escribe y Enter para agregar"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addHashtag((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <div className="flex flex-wrap gap-1">
          {HASHTAG_SUGGESTIONS.filter((s) => !hashtags.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addHashtag(s)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              +{s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-100">
        <FieldLabel number={6} label="Ubicación" complete={done('location')} />
        <input
          type="text"
          value={profile.contact_address || ''}
          onChange={(e) => setProfile({ ...profile, contact_address: e.target.value })}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
          placeholder="Dirección o referencia"
        />
        <input
          type="url"
          value={profile.contact_maps_url || ''}
          onChange={(e) => setProfile({ ...profile, contact_maps_url: e.target.value })}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
          placeholder="Enlace Google Maps (opcional)"
        />
        <select
          value={profile.location_display_level || 'city'}
          onChange={(e) =>
            setProfile({
              ...profile,
              location_display_level: e.target.value as LocationDisplayLevel,
            })
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
        >
          <option value="city">Mostrar ciudad</option>
          <option value="district">Mostrar distrito</option>
          <option value="region">Mostrar región</option>
          <option value="country">Mostrar país</option>
          <option value="address">Mostrar dirección completa</option>
        </select>
      </div>
    </div>
  );
}
