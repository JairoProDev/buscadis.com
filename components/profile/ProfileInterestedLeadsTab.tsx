'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface LeadRow {
  userId: string;
  matchScore: number;
  reasons: string[];
  lastActiveAt?: string;
  adisoId?: string;
  adisoTitle?: string;
}

export default function ProfileInterestedLeadsTab() {
  const { session, user } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token || !user?.id) return;
    fetch('/api/advertiser/interested-leads', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data: { leads?: LeadRow[] }) => setLeads(data.leads || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [session?.access_token, user?.id]);

  if (loading) {
    return <p className="text-sm text-[var(--text-secondary)] p-4">Cargando interesados…</p>;
  }

  if (leads.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--text-secondary)] text-sm">
        Cuando publiques un adiso, aquí verás las personas interesadas en tu oferta con match score y
        acciones para contactarlas.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-2">
      {leads.map((lead) => (
        <div
          key={`${lead.userId}-${lead.adisoId}`}
          className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-secondary)]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm m-0">
                Interesado · {Math.round(lead.matchScore * 100)}% match
              </p>
              {lead.adisoTitle && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1 m-0">{lead.adisoTitle}</p>
              )}
              <ul className="mt-2 text-xs text-[var(--text-secondary)] list-disc pl-4">
                {lead.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            {lead.adisoId && (
              <Link
                href={`/perfil?tab=mensajes`}
                className="shrink-0 text-xs font-bold text-[var(--brand-blue)]"
              >
                Contactar
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
