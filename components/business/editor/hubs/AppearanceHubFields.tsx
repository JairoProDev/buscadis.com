'use client';

import { useState } from 'react';
import type { BusinessProfile, BannerConfig, ProfileLayoutSchema } from '@/types/business';
import { uploadBusinessImage } from '@/lib/business';
import FieldLabel from '@/components/business/editor/FieldLabel';
import ProfileLayoutStyleEditor from '@/components/business/builder/ProfileLayoutStyleEditor';
import { isFieldComplete, type ProfileFieldStatus } from '@/lib/business/profile-progress';
import { IconStore, IconBox, IconEdit } from '@/components/Icons';
import { cn } from '@/lib/utils';

const BRAND_COLORS = ['#53acc5', '#ffc24a', '#3c6997', '#16a34a', '#dc2626', '#9333ea', '#0f172a'];

interface AppearanceHubFieldsProps {
  profile: Partial<BusinessProfile>;
  setProfile: (p: Partial<BusinessProfile>) => void;
  fields: ProfileFieldStatus[];
}

export default function AppearanceHubFields({
  profile,
  setProfile,
  fields,
}: AppearanceHubFieldsProps) {
  const done = (id: string) => isFieldComplete(id, fields);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [previews, setPreviews] = useState<{ logo?: string; banner?: string }>({});

  const bannerConfig = profile.banner_config || { mode: 'image' as const };
  const layout = profile.profile_layout as ProfileLayoutSchema | undefined;
  const bg = layout?.background;

  const handleUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!profile.id) return;
    setUploading(type);
    setPreviews((p) => ({ ...p, [type]: URL.createObjectURL(file) }));
    try {
      const url = await uploadBusinessImage(file, profile.id, type);
      if (!url) return;
      if (type === 'logo') {
        setProfile({ ...profile, logo_url: url });
      } else {
        setProfile({
          ...profile,
          banner_url: url,
          banner_config: {
            ...bannerConfig,
            mode: 'image',
            imageUrl: url,
            fadeBottom: bannerConfig.fadeBottom ?? false,
          },
        });
      }
      setPreviews((p) => ({ ...p, [type]: undefined }));
    } finally {
      setUploading(null);
    }
  };

  const patchBanner = (patch: Partial<BannerConfig>) => {
    setProfile({ ...profile, banner_config: { ...bannerConfig, ...patch } });
  };

  const patchBackground = (type: 'color' | 'gradient' | 'image', value: string) => {
    setProfile({
      ...profile,
      profile_layout: {
        ...(layout || { structureTemplateId: 'social_wireframe_v1', styleSkinId: 'buscadis_default', slots: [] }),
        background: { type, value },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel number={1} label="Logo" complete={done('logo')} />
          <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center cursor-pointer overflow-hidden">
            {uploading === 'logo' ? (
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <img
                src={previews.logo || profile.logo_url || ''}
                alt=""
                className={cn('w-full h-full object-cover', !profile.logo_url && !previews.logo && 'hidden')}
              />
            )}
            {!profile.logo_url && !previews.logo && uploading !== 'logo' && (
              <IconStore size={24} className="text-slate-300" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')}
            />
          </label>
        </div>
        <div>
          <FieldLabel number={2} label="Portada" complete={done('banner')} />
          <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center cursor-pointer overflow-hidden">
            {uploading === 'banner' ? (
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            ) : (
              <img
                src={previews.banner || profile.banner_url || bannerConfig.imageUrl || ''}
                alt=""
                className={cn(
                  'w-full h-full object-cover',
                  !profile.banner_url && !previews.banner && !bannerConfig.imageUrl && 'hidden'
                )}
              />
            )}
            {!profile.banner_url && !previews.banner && !bannerConfig.imageUrl && uploading !== 'banner' && (
              <IconBox size={24} className="text-slate-300" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner')}
            />
          </label>
        </div>
      </div>

      <div>
        <FieldLabel number={3} label="CTA en portada" complete={done('banner_cta')} />
        <input
          type="text"
          value={bannerConfig.cta?.label || ''}
          onChange={(e) =>
            patchBanner({
              cta: {
                label: e.target.value,
                action: bannerConfig.cta?.action || 'whatsapp',
                href: bannerConfig.cta?.href,
              },
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2"
          placeholder="Ej. Contactar"
        />
        <select
          value={bannerConfig.cta?.action || 'whatsapp'}
          onChange={(e) =>
            patchBanner({
              cta: {
                label: bannerConfig.cta?.label || 'Contactar',
                action: e.target.value as 'whatsapp' | 'link' | 'cart' | 'contact',
                href: bannerConfig.cta?.href,
              },
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="link">Enlace externo</option>
          <option value="contact">Contacto</option>
          <option value="cart">Carrito</option>
        </select>
        {bannerConfig.cta?.action === 'link' && (
          <input
            type="url"
            value={bannerConfig.cta?.href || ''}
            onChange={(e) =>
              patchBanner({
                cta: { ...bannerConfig.cta!, label: bannerConfig.cta?.label || '', href: e.target.value },
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mt-2"
            placeholder="https://..."
          />
        )}
      </div>

      <div>
        <FieldLabel number={4} label="Fondo del perfil" complete={done('background')} />
        <div className="flex gap-1 mb-2">
          {(['color', 'gradient', 'image'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                patchBackground(
                  t,
                  t === 'color'
                    ? '#f8fafc'
                    : t === 'gradient'
                      ? 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'
                      : ''
                )
              }
              className={cn(
                'flex-1 py-1.5 text-xs font-bold rounded-lg border',
                bg?.type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200'
              )}
            >
              {t === 'color' ? 'Color' : t === 'gradient' ? 'Degradado' : 'Imagen'}
            </button>
          ))}
        </div>
        {bg?.type === 'color' && (
          <input
            type="color"
            value={bg.value?.startsWith('#') ? bg.value : '#f8fafc'}
            onChange={(e) => patchBackground('color', e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        )}
        {bg?.type === 'gradient' && (
          <select
            value={bg.value}
            onChange={(e) => patchBackground('gradient', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
          >
            <option value="linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)">Gris suave</option>
            <option value="linear-gradient(135deg, #53acc5 0%, #ffc24a 100%)">Buscadis</option>
            <option value="linear-gradient(180deg, #0f172a 0%, #1e293b 100%)">Oscuro</option>
          </select>
        )}
        {bg?.type === 'image' && (
          <input
            type="url"
            value={bg.value || ''}
            onChange={(e) => patchBackground('image', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            placeholder="URL de imagen de fondo"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel number={5} label="Color primario" complete={done('theme_color')} />
          <div className="flex flex-wrap gap-2">
            {BRAND_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setProfile({ ...profile, theme_color: c })}
                className={cn(
                  'w-8 h-8 rounded-full border-2',
                  profile.theme_color === c ? 'border-slate-800 scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer">
              <IconEdit size={12} className="text-slate-400" />
              <input
                type="color"
                className="sr-only"
                value={profile.theme_color || '#53acc5'}
                onChange={(e) => setProfile({ ...profile, theme_color: e.target.value })}
              />
            </label>
          </div>
        </div>
        <div>
          <FieldLabel number={6} label="Color secundario" complete={done('theme_accent')} />
          <div className="flex flex-wrap gap-2">
            {['#ffc24a', '#f97316', '#ec4899', '#10b981'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setProfile({ ...profile, theme_accent_color: c })}
                className={cn(
                  'w-8 h-8 rounded-full border-2',
                  profile.theme_accent_color === c ? 'border-slate-800 scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer">
              <IconEdit size={12} className="text-slate-400" />
              <input
                type="color"
                className="sr-only"
                value={profile.theme_accent_color || '#ffc24a'}
                onChange={(e) => setProfile({ ...profile, theme_accent_color: e.target.value })}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <FieldLabel number={7} label="Estructura y slots" complete={done('sections')} />
        <ProfileLayoutStyleEditor profile={profile} onUpdate={(patch) => setProfile({ ...profile, ...patch })} />
      </div>
    </div>
  );
}
