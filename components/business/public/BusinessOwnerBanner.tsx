'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BusinessProfile } from '@/types/business';
import { profileIsOrphan } from '@/lib/business/social-display';
import { IconEdit, IconMegaphone } from '@/components/Icons';
import { getBusinessProfilePath } from '@/lib/seo/business-metadata';
import { cn } from '@/lib/utils';

interface BusinessOwnerBannerProps {
  profile: Partial<BusinessProfile>;
  canEdit?: boolean;
  isEditor?: boolean;
  isLoggedIn?: boolean;
  userEmail?: string | null;
  onOpenEditor?: () => void;
  className?: string;
}

export default function BusinessOwnerBanner({
  profile,
  canEdit = false,
  isEditor = false,
  isLoggedIn = false,
  userEmail,
  onOpenEditor,
  className,
}: BusinessOwnerBannerProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const orphan = profileIsOrphan(profile);
  const pendingEmail = profile.pending_owner_email?.trim().toLowerCase();
  const slug = profile.slug || '';

  if (isEditor) return null;

  if (canEdit) {
    return (
      <div
        className={cn(
          'max-w-6xl mx-auto px-4 md:px-8 md:pl-[calc(220px+2rem)] print:hidden',
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 dark:bg-emerald-950/30 dark:border-emerald-800/50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 m-0">
            Administras este negocio en Buscadis
          </p>
          <button
            type="button"
            onClick={onOpenEditor}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <IconEdit size={16} />
            Editar página
          </button>
        </div>
      </div>
    );
  }

  if (!orphan) return null;

  const loginHref = `/login?returnTo=${encodeURIComponent(getBusinessProfilePath(slug))}`;

  const handleClaim = async () => {
    if (!slug || claiming) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch('/api/business/claim-orphan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        if (data.error === 'not_authenticated') {
          router.push(loginHref);
          return;
        }
        if (data.error === 'reserved_for_other_email') {
          setClaimError('Este perfil está reservado para otro correo.');
          return;
        }
        setClaimError('No se pudo reclamar. Intenta iniciar sesión primero.');
        return;
      }
      router.refresh();
      onOpenEditor?.();
    } catch {
      setClaimError('Error de conexión. Intenta de nuevo.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      className={cn(
        'max-w-6xl mx-auto px-4 md:px-8 md:pl-[calc(220px+2rem)] print:hidden',
        className
      )}
    >
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/95 px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <IconMegaphone size={16} className="text-[var(--brand-color)] shrink-0" />
              ¿Administras {profile.name || 'este negocio'}?
            </p>
            <p className="m-0 mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
              {pendingEmail && !isLoggedIn
                ? `Reservado para ${pendingEmail}. Inicia sesión con ese correo para administrarlo.`
                : pendingEmail && isLoggedIn && userEmail?.toLowerCase() !== pendingEmail
                  ? `Este perfil está reservado para ${pendingEmail}.`
                  : 'Reclámalo para editar catálogo, redes y diseño — como tu Linktree profesional.'}
            </p>
            {claimError && (
              <p className="m-0 mt-1 text-xs font-medium text-red-600">{claimError}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {!isLoggedIn ? (
              <Link
                href={loginHref}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-color)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 transition-all"
              >
                Entrar
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming || Boolean(pendingEmail && userEmail?.toLowerCase() !== pendingEmail)}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-color)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {claiming ? 'Reclamando…' : 'Reclamar perfil'}
              </button>
            )}
            {!isLoggedIn && (
              <span className="inline-flex items-center text-[10px] text-[var(--text-tertiary)] px-1">
                Solo si aún no tiene administrador
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
