'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  IconExplore,
  IconMegaphone,
  IconStore,
  IconMotorcycle,
  IconInfluencer,
  IconChevronRight,
} from '@/components/Icons';
import type { CapabilityKey, CapabilityStatus, UserCapabilityRow } from '@/lib/auth/capability-types';

const CARDS: Array<{
  key: CapabilityKey | 'base';
  title: string;
  subtitle: string;
  href?: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}> = [
  {
    key: 'base',
    title: 'Explorar',
    subtitle: 'Buscar ofertas y oportunidades',
    href: '/',
    Icon: IconExplore,
  },
  {
    key: 'publish',
    title: 'Publicar un adiso',
    subtitle: 'Aviso clasificado',
    href: '/publicar',
    Icon: IconMegaphone,
  },
  {
    key: 'business',
    title: 'Mi negocio',
    subtitle: 'Catálogo y página de negocio',
    href: '/mi-negocio',
    Icon: IconStore,
  },
  {
    key: 'rider',
    title: 'Hacer delivery',
    subtitle: 'Llevar envíos y ganar con tu moto',
    href: '/delivery/llevar/registro',
    Icon: IconMotorcycle,
  },
  {
    key: 'influencer',
    title: 'Ser influencer',
    subtitle: 'Referidos, UGC y afiliados',
    href: '/perfil/creator',
    Icon: IconInfluencer,
  },
];

function statusLabel(status?: CapabilityStatus | 'always'): string {
  if (status === 'always') return 'Activo';
  if (status === 'active') return 'Activo';
  if (status === 'pending') return 'En revisión';
  if (status === 'suspended') return 'Suspendido';
  if (status === 'inactive') return 'Interés';
  return 'Activar';
}

export default function ProfileCapabilitiesSpaces() {
  const { session } = useAuth();
  const router = useRouter();
  const [caps, setCaps] = useState<UserCapabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/capabilities/activate', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (res.ok) setCaps(json.capabilities || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  const byKey = (key: CapabilityKey) => caps.find((c) => c.capability === key);

  const activate = async (key: CapabilityKey) => {
    if (!session?.access_token) return;
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/capabilities/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ capability: key }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo activar');
        if (json.needs_kyc && json.next) {
          router.push(json.next);
        }
        return;
      }
      setCaps(json.capabilities || []);
      if (json.next) router.push(json.next);
    } catch {
      setError('Error de red');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">Tus espacios</h2>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        Puedes combinar varios: usuario, publicar, negocio, rider e influencer.
      </p>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CARDS.map(({ key, title, subtitle, href, Icon }) => {
          const row = key === 'base' ? undefined : byKey(key);
          const status = key === 'base' ? 'always' : row?.status;
          const isActive = key === 'base' || status === 'active' || status === 'pending';
          return (
            <button
              key={key}
              type="button"
              disabled={busy === key || loading}
              onClick={() => {
                if (key === 'base') {
                  router.push(href || '/');
                  return;
                }
                if (isActive && href) {
                  router.push(href);
                  return;
                }
                void activate(key);
              }}
              className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-3 text-left transition-colors hover:bg-[var(--hover-bg)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(var(--brand-primary-rgb),0.12)] text-[var(--brand-blue)]">
                <Icon size={28} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{title}</span>
                <span className="block text-[11px] text-[var(--text-secondary)]">{subtitle}</span>
                <span className="mt-1 inline-block rounded-full bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                  {busy === key ? '…' : statusLabel(status)}
                </span>
              </span>
              <IconChevronRight size={16} color="var(--text-secondary)" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
