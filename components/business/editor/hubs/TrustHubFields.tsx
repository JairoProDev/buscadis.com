'use client';

import type { BusinessProfile, BusinessHours, SocialLink } from '@/types/business';
import FieldLabel from '@/components/business/editor/FieldLabel';
import BusinessShareTools from '@/components/business/public/BusinessShareTools';
import ProfileAnalyticsWidget from '@/components/business/editor/ProfileAnalyticsWidget';
import { canUseProQr } from '@/lib/business/subscription';
import { isFieldComplete, type ProfileFieldStatus } from '@/lib/business/profile-progress';
import {
  IconPhone, IconMapMarkerAlt, IconEnvelope, IconInstagram, IconFacebook, IconTiktok, IconGlobe,
} from '@/components/Icons';

const SOCIAL_NETWORKS: { n: SocialLink['network']; icon: typeof IconInstagram; ph: string }[] = [
  { n: 'instagram', icon: IconInstagram, ph: '@usuario' },
  { n: 'facebook', icon: IconFacebook, ph: 'facebook.com/pag' },
  { n: 'tiktok', icon: IconTiktok, ph: '@tiktoker' },
  { n: 'linkedin', icon: IconGlobe, ph: 'linkedin.com/company/...' },
  { n: 'twitter', icon: IconGlobe, ph: '@usuario' },
  { n: 'custom', icon: IconGlobe, ph: 'https://...' },
];

interface TrustHubFieldsProps {
  profile: Partial<BusinessProfile>;
  setProfile: (p: Partial<BusinessProfile>) => void;
  fields: ProfileFieldStatus[];
}

export default function TrustHubFields({ profile, setProfile, fields }: TrustHubFieldsProps) {
  const done = (id: string) => isFieldComplete(id, fields);
  const links = profile.social_links || [];

  const updateSocial = (network: SocialLink['network'], url: string) => {
    const others = links.filter((l) => l.network !== network);
    if (url.trim()) {
      setProfile({ ...profile, social_links: [...others, { network, url: url.trim() }] });
    } else {
      setProfile({ ...profile, social_links: others });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel number={1} label="Redes sociales" complete={done('social')} />
        <div className="space-y-2">
          {SOCIAL_NETWORKS.map((s) => {
            const Icon = s.icon;
            const link = links.find((l) => l.network === s.n);
            return (
              <div key={s.n} className="flex items-center gap-2">
                <Icon size={18} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={link?.url || ''}
                  onChange={(e) => updateSocial(s.n, e.target.value)}
                  placeholder={s.ph}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <FieldLabel number={2} label="Contacto" complete={done('whatsapp')} />
        {[
          { label: 'WhatsApp', icon: IconPhone, field: 'contact_whatsapp' as const, ph: '51987654321' },
          { label: 'Teléfono', icon: IconPhone, field: 'contact_phone' as const, ph: 'Opcional' },
          { label: 'Email', icon: IconEnvelope, field: 'contact_email' as const, ph: 'hola@negocio.com' },
        ].map((f) => (
          <div key={f.field}>
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1 mb-1">
              <f.icon size={12} /> {f.label}
            </label>
            <input
              type="text"
              value={(profile as any)[f.field] || ''}
              onChange={(e) => {
                const v = e.target.value;
                if (f.field === 'contact_whatsapp') {
                  setProfile({ ...profile, contact_whatsapp: v, contact_phone: v });
                } else {
                  setProfile({ ...profile, [f.field]: v });
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              placeholder={f.ph}
            />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={profile.show_contact_form !== false}
            onChange={(e) => setProfile({ ...profile, show_contact_form: e.target.checked })}
          />
          Mostrar formulario de contacto
        </label>
      </div>

      <div>
        <FieldLabel number={3} label="Horarios" complete={done('hours')} />
        <div className="space-y-1">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, idx) => {
            const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const key = keys[idx] as keyof BusinessHours;
            const schedule = profile.business_hours?.[key];
            const isOpen = !!schedule && !schedule.closed;
            return (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700 w-20">{day}</span>
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => {
                    const h = profile.business_hours || {};
                    setProfile({
                      ...profile,
                      business_hours: {
                        ...h,
                        [key]: { open: '09:00', close: '18:00', closed: !e.target.checked },
                      },
                    });
                  }}
                />
                {isOpen && schedule ? (
                  <div className="flex gap-1 items-center">
                    <input
                      type="time"
                      value={schedule.open}
                      onChange={(e) => {
                        const h = profile.business_hours || {};
                        setProfile({
                          ...profile,
                          business_hours: { ...h, [key]: { ...schedule, open: e.target.value } },
                        });
                      }}
                      className="text-xs w-16"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={schedule.close}
                      onChange={(e) => {
                        const h = profile.business_hours || {};
                        setProfile({
                          ...profile,
                          business_hours: { ...h, [key]: { ...schedule, close: e.target.value } },
                        });
                      }}
                      className="text-xs w-16"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {profile.slug && (
        <div>
          <FieldLabel number={4} label="QR y compartir" complete={done('qr')} />
          <BusinessShareTools
            slug={profile.slug}
            businessName={profile.name || 'Mi negocio'}
            isPro={canUseProQr(profile)}
            themeColor={profile.theme_color}
            embedded
            onShare={async () => {
              const url = typeof window !== 'undefined' ? window.location.href : '';
              if (navigator.share) {
                try {
                  await navigator.share({ title: profile.name || '', url });
                } catch { /* */ }
              } else {
                await navigator.clipboard.writeText(url);
              }
            }}
          />
        </div>
      )}

      <div>
        <FieldLabel number={5} label="SEO y anuncios" complete={done('seo')} />
        <div className="space-y-2">
          <input
            type="text"
            value={profile.meta_title || ''}
            onChange={(e) => setProfile({ ...profile, meta_title: e.target.value })}
            placeholder="Título SEO"
            className="w-full px-3 py-2 rounded-lg border text-sm"
          />
          <textarea
            value={profile.meta_description || ''}
            onChange={(e) => setProfile({ ...profile, meta_description: e.target.value })}
            placeholder="Descripción SEO"
            className="w-full px-3 py-2 rounded-lg border text-sm min-h-[60px]"
          />
          <input
            type="text"
            value={profile.announcement_text || ''}
            onChange={(e) =>
              setProfile({ ...profile, announcement_text: e.target.value, announcement_active: true })
            }
            placeholder="Mensaje destacado (barra)"
            className="w-full px-3 py-2 rounded-lg border text-sm"
          />
          <input
            type="url"
            value={profile.og_image_url || ''}
            onChange={(e) => setProfile({ ...profile, og_image_url: e.target.value })}
            placeholder="Imagen OG (compartir en redes)"
            className="w-full px-3 py-2 rounded-lg border text-sm"
          />
        </div>
      </div>

      <div>
        <FieldLabel number={6} label="Analítica" complete />
        <ProfileAnalyticsWidget businessProfileId={profile.id} />
      </div>
    </div>
  );
}
