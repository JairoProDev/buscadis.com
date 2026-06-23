import { useAuth } from './useAuth';
import { Profile, UserPreferences } from '@/types';
import { getUserPreferences } from '@/lib/user';
import { isPlatformAdminUser } from '@/lib/platform-admin';
import { useState, useEffect } from 'react';

/**
 * Hook para obtener datos del usuario actual
 */
export function useUser() {
  const { user, profile, loading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  useEffect(() => {
    if (user?.id && !loading) {
      setLoadingPreferences(true);
      getUserPreferences(user.id)
        .then(setPreferences)
        .catch((error: any) => {
          // Si la tabla no existe aún (PGRST205), no es un error crítico
          if (error?.code !== 'PGRST205') {
            console.error('Error al cargar preferencias:', error);
          }
          setPreferences(null);
        })
        .finally(() => setLoadingPreferences(false));
    } else {
      setPreferences(null);
    }
  }, [user?.id, loading]);

  return {
    user,
    profile: profile as Profile | null,
    preferences,
    loading: loading || loadingPreferences,
    isAuthenticated: !!user,
    isAnunciante: profile?.rol === 'anunciante' || profile?.rol === 'admin',
    isAdmin: profile?.rol === 'admin',
    isPlatformAdmin: isPlatformAdminUser(user?.email, profile),
    isVerificado: profile?.es_verificado || false
  };
}

