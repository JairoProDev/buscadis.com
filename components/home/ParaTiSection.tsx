'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Adiso, Categoria } from '@/types';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { isEligibleForMarketplaceFeed } from '@/lib/feed/eligibility';
import { compareRecientesFeed } from '@/lib/feed/ranking';
import AdisoCard from '@/components/AdisoCard';
import { marketplaceStandardGridClass } from '@/components/GrillaAdisos';

interface ParaTiSectionProps {
  onAbrirAdiso: (adiso: Adiso) => void;
  withPanel?: boolean;
  /** Categoría activa en el feed; las recomendaciones se limitan a esta categoría. */
  categoria?: Categoria | 'todos';
}

export default function ParaTiSection({
  onAbrirAdiso,
  withPanel = false,
  categoria = 'todos',
}: ParaTiSectionProps) {
  const { user, session } = useAuth();
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !session?.access_token) {
      setAdisos([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (categoria && categoria !== 'todos') {
      params.set('categoria', categoria);
    }
    const query = params.toString();
    fetch(`/api/recommendations${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(async (data: { adisoIds?: string[] }) => {
        const ids = data.adisoIds || [];
        const loaded = await Promise.all(
          ids.slice(0, 8).map((id) => getAdisoByIdFromSupabase(id).catch(() => null)),
        );
        const eligible = (loaded.filter(Boolean) as Adiso[])
          .filter(
            (a) => categoria === 'todos' || a.categoria === categoria,
          )
          .filter(isEligibleForMarketplaceFeed)
          .sort((a, b) => compareRecientesFeed(a, b))
          .slice(0, 4);
        setAdisos(eligible);
      })
      .catch(() => setAdisos([]))
      .finally(() => setLoading(false));
  }, [user?.id, session?.access_token, categoria]);

  if (!user || loading || adisos.length === 0) return null;

  return (
    <section className="mb-4 px-1" aria-labelledby="para-ti-heading">
      <h2
        id="para-ti-heading"
        className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
      >
        Recomendado para ti
      </h2>
      <div className={marketplaceStandardGridClass(withPanel)}>
        {adisos.map((adiso) => (
          <AdisoCard
            key={adiso.id}
            adiso={adiso}
            onClick={() => onAbrirAdiso(adiso)}
            vista="grid"
          />
        ))}
      </div>
    </section>
  );
}
