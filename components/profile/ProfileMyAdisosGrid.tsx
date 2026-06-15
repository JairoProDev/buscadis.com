'use client';

import { useEffect, useState } from 'react';
import { Adiso } from '@/types';
import GrillaAdisos from '@/components/GrillaAdisos';
import ProfileEmptyState from './ProfileEmptyState';

interface ProfileMyAdisosGridProps {
  token?: string;
  highlightId?: string | null;
}

export default function ProfileMyAdisosGrid({ token, highlightId }: ProfileMyAdisosGridProps) {
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/adisos/mine', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setAdisos(d.adisos || []))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`adiso-${highlightId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, adisos]);

  if (loading) return <div className="skeleton-shimmer h-48 rounded-2xl" />;

  if (adisos.length === 0) {
    return (
      <ProfileEmptyState
        icon="📢"
        title="Aún no has publicado"
        description="Publica tu primer aviso y llega a miles de personas en tu ciudad."
        actionLabel="Publicar ahora"
        actionHref="/publicar"
      />
    );
  }

  return (
    <div className="space-y-3">
      {adisos.map((adiso) => (
        <div
          key={adiso.id}
          id={`adiso-${adiso.id}`}
          className={
            highlightId === adiso.id
              ? 'rounded-2xl ring-2 ring-[var(--brand-blue)] ring-offset-2'
              : ''
          }
        >
          <GrillaAdisos
            adisos={[adiso]}
            onAbrirAdiso={(a) => {
              window.location.href = `/?adiso=${a.id}`;
            }}
          />
        </div>
      ))}
    </div>
  );
}
