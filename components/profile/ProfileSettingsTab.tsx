'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import {
  updateProfile,
  uploadProfileAvatar,
  updateUserSocialLinks,
  UserSocialLinks,
} from '@/lib/user';
import {
  computeProfileCompletion,
  parseSocialFromMetadata,
  ProfileTask,
} from '@/lib/profile-completion';
import LocationPrompt from '@/components/LocationPrompt';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import VerificationBadge from '@/components/VerificationBadge';
import ProfileCompletionCard from './ProfileCompletionCard';
import {
  IconCamera,
  IconUser,
  IconPhone,
  IconGlobe,
  IconLocation,
  IconInstagram,
  IconFacebook,
  IconTiktok,
  IconCheck,
} from '@/components/Icons';

function SettingsSection({
  id,
  title,
  description,
  done,
  children,
  sectionRef,
}: {
  id: string;
  title: string;
  description?: string;
  done?: boolean;
  children: React.ReactNode;
  sectionRef?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section
      id={id}
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{description}</p>
          )}
        </div>
        {done && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <IconCheck size={12} color="#22c55e" />
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const inputClass =
  'w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.15)]';

export default function ProfileSettingsTab({
  focusSection,
}: {
  focusSection?: string | null;
}) {
  const { user, refreshProfile } = useAuth();
  const { profile } = useUser();

  const photoRef = useRef<HTMLElement>(null);
  const personalRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const bioRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLElement>(null);
  const socialRef = useRef<HTMLElement>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLElement | null>> = {
    photo: photoRef,
    personal: personalRef,
    contact: contactRef,
    bio: bioRef,
    location: locationRef,
    social: socialRef,
  };

  const [showLocation, setShowLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    bio: '',
    website: '',
  });

  const [social, setSocial] = useState<UserSocialLinks>({
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        telefono: profile.telefono || '',
        bio: profile.bio || '',
        website: profile.website || '',
      });
    }
    if (user?.user_metadata) {
      const parsed = parseSocialFromMetadata(user.user_metadata);
      setSocial(parsed);
    }
  }, [profile, user?.user_metadata]);

  useEffect(() => {
    if (!focusSection) return;
    const ref = sectionRefs[focusSection];
    const timer = window.setTimeout(() => {
      ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => window.clearTimeout(timer);
    // sectionRefs es estable por diseño
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSection]);

  const completion = computeProfileCompletion(
    profile,
    social,
    !!user?.email_confirmed_at
  );

  const flashSaved = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleSaveProfile = async (extra?: Partial<typeof form>) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = { ...form, ...extra };
      await updateProfile(user.id, payload);
      await refreshProfile();
      flashSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocial = async (updates?: Partial<UserSocialLinks>) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const next = { ...social, ...updates };
      await updateUserSocialLinks(next);
      setSocial(next);
      if (updates?.whatsapp && !form.telefono) {
        await updateProfile(user.id, { telefono: updates.whatsapp });
        setForm((f) => ({ ...f, telefono: updates.whatsapp || f.telefono }));
      }
      await refreshProfile();
      flashSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarUploading(true);
    try {
      const url = await uploadProfileAvatar(file, user.id);
      if (url) {
        await updateProfile(user.id, { avatar_url: url });
        await refreshProfile();
        flashSaved();
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleTaskClick = (task: ProfileTask) => {
    const ref = sectionRefs[task.section];
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const iniciales = `${form.nombre?.[0] || ''}${form.apellido?.[0] || ''}`.toUpperCase() || '?';

  const taskDone = (id: string) => completion.tasks.find((t) => t.id === id)?.done;

  return (
    <div className="space-y-4">
      {savedFlash && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-600">
          <IconCheck size={14} color="#22c55e" />
          Cambios guardados
        </div>
      )}

      <ProfileCompletionCard completion={completion} onTaskClick={handleTaskClick} />

      <SettingsSection
        id="section-photo"
        title="Foto de perfil"
        description="Una foto real genera más confianza al contactar"
        done={taskDone('avatar')}
        sectionRef={photoRef}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-bold text-[var(--brand-blue)]">
                {iniciales}
              </span>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              <IconCamera size={14} color="white" />
              {profile?.avatar_url ? 'Cambiar foto' : 'Subir foto'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </label>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">JPG o PNG, máx. 5 MB</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        id="section-personal"
        title="Datos personales"
        description="Cómo te verán otros en Buscadis"
        done={taskDone('name')}
        sectionRef={personalRef}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Nombre
            </label>
            <input
              className={inputClass}
              placeholder="Tu nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              onBlur={() => handleSaveProfile()}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Apellido
            </label>
            <input
              className={inputClass}
              placeholder="Tu apellido"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              onBlur={() => handleSaveProfile()}
            />
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <IconUser size={12} color="var(--text-tertiary)" />
          {user?.email}
        </p>
      </SettingsSection>

      <SettingsSection
        id="section-contact"
        title="Contacto"
        description="Tu WhatsApp para que te escriban al instante"
        done={taskDone('phone')}
        sectionRef={contactRef}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            WhatsApp / teléfono
          </label>
          <div className="relative">
            <IconPhone
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            />
            <input
              className={`${inputClass} pl-9`}
              placeholder="+51 999 999 999"
              value={social.whatsapp || form.telefono}
              onChange={(e) => {
                const v = e.target.value;
                setSocial({ ...social, whatsapp: v });
                setForm({ ...form, telefono: v });
              }}
              onBlur={() => {
                handleSaveProfile({ telefono: social.whatsapp || form.telefono });
                handleSaveSocial({ whatsapp: social.whatsapp });
              }}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        id="section-bio"
        title="Sobre ti"
        description="Una línea que te represente"
        done={taskDone('bio')}
        sectionRef={bioRef}
      >
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="Ej: Vendo artesanía en Cusco, envíos a todo el Perú"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          onBlur={() => handleSaveProfile()}
        />
        <p className="mt-1.5 text-right text-[10px] text-[var(--text-tertiary)]">
          {form.bio.length}/120 · mín. 10 para completar
        </p>
      </SettingsSection>

      <SettingsSection
        id="section-location"
        title="Ubicación"
        description="Para ver ofertas cerca de ti"
        done={taskDone('location')}
        sectionRef={locationRef}
      >
        <p className="mb-3 text-sm text-[var(--text-primary)]">
          {profile?.ubicacion || 'Aún no has definido tu ubicación'}
        </p>
        <button
          type="button"
          onClick={() => setShowLocation(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
        >
          <IconLocation size={14} color="var(--brand-blue)" />
          Actualizar ubicación
        </button>
      </SettingsSection>

      <SettingsSection
        id="section-social"
        title="Redes y web"
        description="Conecta tus cuentas para más credibilidad"
        done={taskDone('social') && taskDone('website')}
        sectionRef={socialRef}
      >
        <div className="space-y-3">
          {[
            { key: 'instagram' as const, label: 'Instagram', Icon: IconInstagram, placeholder: '@tu_usuario' },
            { key: 'facebook' as const, label: 'Facebook', Icon: IconFacebook, placeholder: 'facebook.com/tu-pagina' },
            { key: 'tiktok' as const, label: 'TikTok', Icon: IconTiktok, placeholder: '@tu_usuario' },
          ].map(({ key, label, Icon, placeholder }) => (
            <div key={key}>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                <Icon size={12} />
                {label}
              </label>
              <input
                className={inputClass}
                placeholder={placeholder}
                value={social[key] || ''}
                onChange={(e) => setSocial({ ...social, [key]: e.target.value })}
                onBlur={() => handleSaveSocial()}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <IconGlobe size={12} />
              Sitio web
            </label>
            <input
              className={inputClass}
              placeholder="https://tu-sitio.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              onBlur={() => handleSaveProfile()}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        id="section-verify"
        title="Verificación"
        description="Más visibilidad y confianza al publicar"
        done={taskDone('verified')}
      >
        <div className="flex flex-wrap items-center gap-3">
          <VerificationBadge esVerificado={!!profile?.es_verificado} />
          {!profile?.es_verificado && (
            <p className="text-sm text-[var(--text-secondary)]">
              Verifica tu identidad para destacar como anunciante confiable.
            </p>
          )}
        </div>
      </SettingsSection>

      <SettingsSection id="section-prefs" title="Preferencias">
        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />
          <LanguageSelector />
        </div>
      </SettingsSection>

      {saving && (
        <p className="text-center text-xs text-[var(--text-tertiary)]">Guardando…</p>
      )}

      {showLocation && (
        <LocationPrompt
          abierto={showLocation}
          onCerrar={() => setShowLocation(false)}
          onAceptar={() => {
            setShowLocation(false);
            refreshProfile();
          }}
        />
      )}
    </div>
  );
}
