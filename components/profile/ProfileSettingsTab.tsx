'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { updateProfile } from '@/lib/user';
import LocationPrompt from '@/components/LocationPrompt';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import VerificationBadge from '@/components/VerificationBadge';

export default function ProfileSettingsTab() {
  const { user, refreshProfile } = useAuth();
  const { profile } = useUser();
  const [editando, setEditando] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    bio: '',
    website: '',
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
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateProfile(user.id, form);
      await refreshProfile();
      setEditando(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">Datos personales</h2>
          {!editando ? (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm font-medium text-[var(--brand-blue)]"
            >
              Editar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          )}
        </div>

        {editando ? (
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
              placeholder="Apellido"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
              placeholder="Teléfono / WhatsApp"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
            <textarea
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm resize-none"
              rows={3}
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
        ) : (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-secondary)]">Nombre</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {form.nombre} {form.apellido}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Teléfono</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {form.telefono || '—'}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <VerificationBadge esVerificado={!!profile?.es_verificado} />
            </div>
          </dl>
        )}

        <button
          type="button"
          onClick={() => setShowLocation(true)}
          className="mt-4 w-full rounded-xl border border-[var(--border-color)] py-2.5 text-sm font-medium text-[var(--text-primary)]"
        >
          📍 Actualizar ubicación
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5">
        <h2 className="mb-3 font-semibold text-[var(--text-primary)]">Preferencias</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />
          <LanguageSelector />
        </div>
      </div>

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
