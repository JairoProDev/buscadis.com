'use client';

import { useEffect, useState } from 'react';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { getAdisoById } from '@/lib/storage';
import { Adiso } from '@/types';
import GrillaAdisos from '@/components/GrillaAdisos';
import ProfileEmptyState from './ProfileEmptyState';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileFavoritesTab() {
  const { favoritosIds, loadFavorites, isLoaded } = useFavoritos();
  const { user } = useAuth();
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const ids = Array.from(favoritosIds);
      if (ids.length === 0) {
        setAdisos([]);
        setLoading(false);
        return;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          if (user && supabase) {
            const { data } = await supabase.from('adisos').select('*').eq('id', id).maybeSingle();
            if (data) {
              const { dbToAdiso } = await import('@/lib/supabase');
              return dbToAdiso(data);
            }
          }
          return getAdisoById(id);
        })
      );
      setAdisos(results.filter((a): a is Adiso => a !== null));
      setLoading(false);
    };

    if (isLoaded || !user) load();
  }, [favoritosIds, isLoaded, user]);

  if (loading) {
    return <div className="skeleton-shimmer h-48 rounded-2xl" />;
  }

  if (adisos.length === 0) {
    return (
      <ProfileEmptyState
        icon="♥"
        title="Sin guardados aún"
        description="Marca con corazón los avisos que te interesen para encontrarlos aquí."
        actionLabel="Explorar ofertas"
        actionHref="/"
      />
    );
  }

  return (
    <GrillaAdisos
      adisos={adisos}
      onAbrirAdiso={(adiso) => {
        window.location.href = `/?adiso=${adiso.id}`;
      }}
    />
  );
}
