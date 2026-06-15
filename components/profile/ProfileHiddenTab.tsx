'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdisosOcultos } from '@/lib/interactions';
import { Adiso } from '@/types';
import GrillaAdisos from '@/components/GrillaAdisos';
import ProfileEmptyState from './ProfileEmptyState';
import { IconEyeOff } from '@/components/Icons';

export default function ProfileHiddenTab() {
  const { user } = useAuth();
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getAdisosOcultos(user.id)
      .then(setAdisos)
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="skeleton-shimmer h-48 rounded-2xl" />;

  if (adisos.length === 0) {
    return (
      <ProfileEmptyState
        icon={<IconEyeOff size={24} color="var(--text-secondary)" />}
        title="No tienes avisos ocultos"
        description="Cuando ocultes un anuncio que no te interesa, aparecerá aquí para restaurarlo."
        actionLabel="Ir al inicio"
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
