'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { getProfile } from '@/lib/user';
import { onAuthStateChange, getCurrentUser, getSession } from '@/lib/auth';
import { cacheGet, cacheSet, cacheRemove, CacheKeys, CACHE_TTL } from '@/lib/offline-cache';
import {
  isBuscadisNativeApp,
  linkPushTokenToSession,
  unlinkPushTokenFromSession,
} from '@/lib/mobile-app-bridge';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicialización síncrona desde caché para evitar flashing
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = cacheGet<User>(CacheKeys.authSession(), true);
    return cached ?? null;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window === 'undefined') return null;
    // Intentar leer perfil del caché usando el user id cacheado
    const cachedUser = cacheGet<User>(CacheKeys.authSession(), true);
    if (cachedUser?.id) {
      return cacheGet<Profile>(CacheKeys.userProfile(cachedUser.id), true) ?? null;
    }
    return null;
  });
  // loading es false si ya tenemos datos del caché
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const cached = cacheGet<User>(CacheKeys.authSession(), true);
    return !cached; // Si tenemos caché, no hay loading inicial
  });

  const loadProfile = async (userId: string) => {
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      if (profileData) {
        cacheSet(CacheKeys.userProfile(userId), profileData, CACHE_TTL.USER_PROFILE);
      }
    } catch (error: any) {
      // Si la tabla no existe aún (PGRST205), no es un error crítico
      if (error?.code !== 'PGRST205') {
        console.error('Error al cargar perfil:', error);
      }
      // En caso de error, intentar usar caché stale
      const staleProfile = cacheGet<Profile>(CacheKeys.userProfile(userId), true);
      if (staleProfile) {
        setProfile(staleProfile);
      } else {
        setProfile(null);
      }
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Cargar sesión inicial desde Supabase
    getSession().then((sessionData) => {
      setSession(sessionData);

      if (sessionData?.user) {
        const sessionUser = sessionData.user;
        setUser(sessionUser);
        // Persistir en caché
        cacheSet(CacheKeys.authSession(), sessionUser, CACHE_TTL.AUTH_SESSION);

        // Si el perfil ya estaba en el estado (desde caché), no bloquear con loading
        setLoading(false);

        // Cargar perfil actualizado en background
        loadProfile(sessionUser.id);
        if (isBuscadisNativeApp()) {
          void linkPushTokenToSession(sessionUser.id);
        }
      } else {
        // Sin sesión activa: limpiar caché de auth
        cacheRemove(CacheKeys.authSession());
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }).catch(() => {
      // Error de conexión: usar lo que tenemos del caché
      setLoading(false);
    });

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = onAuthStateChange((event, sessionData) => {
      setSession(sessionData);

      if (sessionData?.user) {
        const sessionUser = sessionData.user;
        setUser(sessionUser);
        cacheSet(CacheKeys.authSession(), sessionUser, CACHE_TTL.AUTH_SESSION);
        loadProfile(sessionUser.id);
        if (isBuscadisNativeApp()) {
          void linkPushTokenToSession(sessionUser.id);
        }
      } else {
        // Logout: limpiar caché
        if (user?.id) cacheRemove(CacheKeys.userProfile(user.id));
        cacheRemove(CacheKeys.authSession());
        setUser(null);
        setProfile(null);
        if (isBuscadisNativeApp()) {
          void unlinkPushTokenFromSession();
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    if (!supabase) return;

    // Limpiar caché antes de cerrar sesión
    if (user?.id) cacheRemove(CacheKeys.userProfile(user.id));
    cacheRemove(CacheKeys.authSession());

    const { signOut: signOutFn } = await import('@/lib/auth');
    await signOutFn();
    if (isBuscadisNativeApp()) {
      await unlinkPushTokenFromSession();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
