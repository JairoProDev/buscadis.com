'use client';

import { useState } from 'react';
import type { BusinessProfile, BusinessHours, SocialLink } from '@/types/business';
import FieldLabel from '@/components/business/editor/FieldLabel';
import BusinessShareTools from '@/components/business/public/BusinessShareTools';
import ProfileAnalyticsWidget from '@/components/business/editor/ProfileAnalyticsWidget';
import { OwnerReviewsPanel } from '@/components/business/editor/OwnerReviewsPanel';
import { canUseProQr } from '@/lib/business/subscription';
import { isFieldComplete, type ProfileFieldStatus } from '@/lib/business/profile-progress';
import {
  isPerfilVivoEnabled,
  perfilVivoEnableSource,
  withPerfilVivoEnabled,
} from '@/lib/business/perfil-vivo-flag';
import { useAuth } from '@/hooks/useAuth';
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
  const { session } = useAuth();
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const pedirResena = async () => {
    if (!profile.slug || !session?.access_token) {
      setInviteMsg('Guarda el perfil e inicia sesión');
      return;
    }
    setInviteBusy(true);
    setInviteMsg(null);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(profile.slug)}/review-invite`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo crear el enlace');
      await navigator.clipboard.writeText(json.url);
      setInviteMsg('Enlace copiado. Pégalo en WhatsApp a tu cliente.');
      if (json.waShare) {
        window.open(json.waShare, '_blank');
      }
    } catch (e) {
      setInviteMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setInviteBusy(false);
    }
  };

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
            ownerWhatsapp={profile.contact_whatsapp}
            embedded
            onShare={async () => {
              const path = profile.slug ? `/@${profile.slug}` : '';
              const url =
                typeof window !== 'undefined'
                  ? `${window.location.origin}${path}`
                  : path;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: profile.name || 'Mi negocio',
                    text: `Mira el perfil de ${profile.name || 'mi negocio'} en Buscadis`,
                    url,
                  });
                } catch {
                  /* */
                }
              } else if (url) {
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
        <FieldLabel number={6} label="Perfil Vivo" complete={isPerfilVivoEnabled(profile)} />
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <p className="text-[15px] text-slate-700 leading-snug">
            Cuando lo activas, tus clientes ven el perfil nuevo en{' '}
            <span className="font-semibold">buscadis.com/@{profile.slug || 'tu-negocio'}</span>
            . El editor sigue igual.
          </p>
          {perfilVivoEnableSource(profile) === 'env' ? (
            <p className="text-[12px] font-semibold text-teal-800 bg-teal-50 rounded-lg px-2 py-1.5">
              Activo por cohort (env PERFIL_VIVO_ENABLED_SLUGS). El toggle local no lo apaga.
            </p>
          ) : null}
          <button
            type="button"
            disabled={perfilVivoEnableSource(profile) === 'env'}
            onClick={() => {
              const next = !isPerfilVivoEnabled(profile);
              setProfile(withPerfilVivoEnabled(profile, next));
            }}
            className={`w-full min-h-[48px] rounded-xl text-[15px] font-bold transition-colors disabled:opacity-60 ${
              isPerfilVivoEnabled(profile)
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {isPerfilVivoEnabled(profile)
              ? 'Perfil Vivo activo — tocar para desactivar'
              : 'Activar Perfil Vivo en mi enlace'}
          </button>
          {profile.slug && (
            <a
              href={`/v/${encodeURIComponent(profile.slug)}`}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-sm font-semibold text-teal-700 py-2"
            >
              Vista previa en /v/{profile.slug} ↗
            </a>
          )}
          <details className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <summary className="text-[13px] font-semibold text-slate-700 cursor-pointer min-h-[44px] flex items-center">
              Guion de venta (5 min en el mostrador)
            </summary>
            <ol className="mt-2 mb-1 pl-4 list-decimal text-[13px] text-slate-600 space-y-1.5 leading-snug">
              <li>Pregunta: «¿Cómo te contactan hoy tus clientes nuevos?»</li>
              <li>Muéstrale su perfil en el teléfono (vista previa /v).</li>
              <li>Señala el estado en vivo: abierto / responde rápido.</li>
              <li>Abre el panel: visitas y clics a WhatsApp.</li>
              <li>Compara con Instagram o web que nadie actualiza.</li>
              <li>Cierra imprimiendo el sticker QR y pégalo en el mostrador.</li>
            </ol>
          </details>
        </div>
      </div>

      <div>
        <FieldLabel number={7} label="Pedir reseñas" complete={false} />
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <p className="text-[15px] text-slate-700 leading-snug">
            Después de atender a un cliente, mándale este enlace. Califica en 5 segundos — una sola
            pregunta.
          </p>
          <button
            type="button"
            disabled={inviteBusy || !profile.slug}
            onClick={() => void pedirResena()}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[15px] font-bold"
          >
            {inviteBusy ? 'Creando…' : 'Copiar enlace y abrir WhatsApp'}
          </button>
          <a
            href="/resena/demo"
            target="_blank"
            rel="noreferrer"
            className="block text-center text-sm font-semibold text-slate-600 py-1"
          >
            Probar cómo se ve ↗
          </a>
          {inviteMsg && (
            <p className="text-sm font-semibold text-emerald-700">{inviteMsg}</p>
          )}
        </div>
      </div>

      {profile.slug ? (
        <div>
          <FieldLabel number={8} label="Responder reseñas" complete={false} />
          <OwnerReviewsPanel slug={profile.slug} />
        </div>
      ) : null}

      <div>
        <FieldLabel number={9} label="Analítica" complete />
        <ProfileAnalyticsWidget businessProfileId={profile.id} />
      </div>
    </div>
  );
}
