'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listBusinessProfilesForUser } from '@/lib/business';
import { BusinessWithRole } from '@/lib/business-access';
import ProfileEmptyState from './ProfileEmptyState';
import { IconStore } from '@/components/Icons';
import Link from 'next/link';

export default function ProfileBusinessesTab() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    listBusinessProfilesForUser(user.id)
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="skeleton-shimmer h-48 rounded-2xl" />;

  if (businesses.length === 0) {
    return (
      <ProfileEmptyState
        icon={<IconStore size={24} color="var(--brand-yellow)" />}
        title="Sin negocios aún"
        description="Crea tu página de negocio con catálogo, horarios y contacto."
        actionLabel="Crear negocio"
        actionHref="/mi-negocio?new=1"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link
          href="/mi-negocio?new=1"
          className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
        >
          + Nuevo negocio
        </Link>
      </div>
      {businesses.map(({ profile: p, role }) => (
        <div
          key={p.id}
          className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4"
        >
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-tertiary)]">
            {p.logo_url ? (
              <img src={p.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">🏪</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {p.name || p.slug}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {role} · {p.is_published ? 'Publicado' : 'Borrador'}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-1">
            <Link
              href={`/mi-negocio?business=${p.id}`}
              className="rounded-lg bg-[var(--brand-blue)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Editar
            </Link>
            {p.slug && (
              <Link
                href={`/${p.slug}`}
                className="text-center text-xs text-[var(--text-secondary)] hover:underline"
              >
                Ver página
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
