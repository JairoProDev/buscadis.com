import { supabaseAdmin } from '@/lib/supabase-admin';
import type { User } from '@supabase/supabase-js';

export type GoogleProfileSnapshot = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  hd?: string;
  synced_at: string;
};

function splitName(full?: string | null): { nombre: string; apellido: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombre: '', apellido: '' };
  if (parts.length === 1) return { nombre: parts[0], apellido: '' };
  return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
}

/**
 * Upsert provisional profile fields from Google Auth user_metadata / identities.
 * DNI onboarding overwrites official nombre/apellido later.
 */
export async function syncGoogleProfileFromUser(user: User): Promise<{ ok: boolean; error?: string }> {
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const picture =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    undefined;
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    undefined;
  const given =
    (typeof meta.given_name === 'string' && meta.given_name) ||
    (typeof meta.nombre === 'string' && meta.nombre) ||
    undefined;
  const family =
    (typeof meta.family_name === 'string' && meta.family_name) ||
    (typeof meta.apellido === 'string' && meta.apellido) ||
    undefined;
  const locale = typeof meta.locale === 'string' ? meta.locale : undefined;
  const hd = typeof meta.hd === 'string' ? meta.hd : undefined;

  const { nombre: fromFull, apellido: fromFullAp } = splitName(fullName);
  const nombre = given || fromFull || 'Usuario';
  const apellido = family || fromFullAp || '';

  const snapshot: GoogleProfileSnapshot = {
    sub: user.id,
    email: user.email,
    email_verified: Boolean(user.email_confirmed_at),
    name: fullName,
    given_name: given || undefined,
    family_name: family || undefined,
    picture,
    locale,
    hd,
    synced_at: new Date().toISOString(),
  };

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id, nombre, apellido, avatar_url, dni_verified_at, google_profile')
    .eq('id', user.id)
    .maybeSingle();

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    locale: locale || null,
    google_profile: snapshot,
    updated_at: now,
  };

  // Don't overwrite official DNI names
  if (!existing?.dni_verified_at) {
    updates.nombre = existing?.nombre?.trim() ? existing.nombre : nombre;
    updates.apellido = existing?.apellido?.trim() ? existing.apellido : apellido;
  }

  // Avatar: set if empty
  if (picture && !existing?.avatar_url) {
    updates.avatar_url = picture;
  }

  if (!existing) {
    updates.rol = 'usuario';
    updates.es_verificado = false;
  }

  const { error } = await supabaseAdmin.from('profiles').upsert(updates, { onConflict: 'id' });
  if (error) {
    console.error('syncGoogleProfileFromUser', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
