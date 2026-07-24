import { supabase } from './supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Registra un nuevo usuario
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        full_name: `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Usuario'
      }
    }
  });

  return {
    user: authData.user,
    session: authData.session,
    error
  };
}

/**
 * Inicia sesión con email y contraseña
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  });

  return {
    user: authData.user,
    session: authData.session,
    error
  };
}

/**
 * Google One Tap / GIS: ID token en tu dominio (no redirige a *.supabase.co).
 */
export async function signInWithGoogleIdToken(idToken: string, nonce?: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce,
  });

  return { data, error };
}

/**
 * OAuth redirect legacy — evita en UI (muestra *.supabase.co sin custom domain de pago).
 * Conservado solo por compatibilidad interna.
 */
export async function signInWithOAuth(provider: 'google' | 'facebook' | 'github') {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    }
  });

  return { data, error };
}

/**
 * Inicia sesión con magic link (email sin contraseña)
 */
export async function signInWithMagicLink(email: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  return { data, error };
}

/**
 * Cierra sesión
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Obtiene la sesión actual
 */
export async function getSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Envía email para resetear contraseña
 */
export async function resetPassword(email: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });

  return { data, error };
}

/**
 * Actualiza la contraseña del usuario
 */
export async function updatePassword(newPassword: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  return { data, error };
}

/**
 * Escucha cambios en el estado de autenticación
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  if (!supabase) {
    return { data: { subscription: null }, error: new Error('Supabase no está configurado') };
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

