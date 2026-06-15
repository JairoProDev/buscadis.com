'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useUI } from '@/contexts/UIContext';
import { ProfileDashboardStats } from '@/lib/profile/server';
import ProfileTabs, { ProfileTabId } from './ProfileTabs';
import ProfileOverviewTab from './ProfileOverviewTab';
import ProfileFavoritesTab from './ProfileFavoritesTab';
import ProfileHistoryTab from './ProfileHistoryTab';
import ProfileMessagesTab from './ProfileMessagesTab';
import ProfileHiddenTab from './ProfileHiddenTab';
import ProfileSettingsTab from './ProfileSettingsTab';
import ProfilePublisherTab from './ProfilePublisherTab';
import ProfileBusinessesTab from './ProfileBusinessesTab';
import { IconVerified } from '@/components/Icons';

interface ProfileHubShellProps {
  initialTab?: ProfileTabId;
  highlightId?: string | null;
}

export default function ProfileHubShell({ initialTab = 'inicio', highlightId }: ProfileHubShellProps) {
  const router = useRouter();
  const { user, signOut, session } = useAuth();
  const { profile, isAnunciante, isVerificado } = useUser();
  const { openAuthModal } = useUI();

  const [tab, setTab] = useState<ProfileTabId>(initialTab);
  const [stats, setStats] = useState<ProfileDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) {
      openAuthModal();
      router.push('/');
    }
  }, [user, openAuthModal, router]);

  useEffect(() => {
    if (!session?.access_token) return;
    setLoadingStats(true);
    fetch('/api/profile/dashboard', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((d) => setStats(d.stats || null))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [session?.access_token]);

  useEffect(() => {
    if (highlightId) setTab('publicar');
  }, [highlightId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url.pathname + url.search);
  }, [tab]);

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-[var(--text-secondary)]">Inicia sesión para ver tu perfil</p>
      </div>
    );
  }

  const nombre =
    profile?.nombre && profile?.apellido
      ? `${profile.nombre} ${profile.apellido}`.trim()
      : profile?.nombre || user.email?.split('@')[0] || 'Usuario';

  const iniciales = nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const showPublisher = stats?.isAnunciante || isAnunciante || (stats?.adsCount ?? 0) > 0;
  const showBusinesses = (stats?.businessesCount ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm">
        <div className="h-20 bg-gradient-to-r from-[var(--brand-blue)] to-[#2563eb]" />
        <div className="relative px-5 pb-5">
          <div className="-mt-10 mb-3 flex items-end justify-between gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-[var(--bg-primary)] bg-[var(--bg-tertiary)] shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-bold text-[var(--brand-blue)]">
                  {iniciales}
                </span>
              )}
            </div>
            <div className="flex gap-2 pb-1">
              <Link
                href="/publicar"
                className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-xs font-semibold text-white"
              >
                Publicar
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-[var(--border-color)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]"
              >
                Salir
              </button>
            </div>
          </div>

          <h1 className="text-xl font-bold text-[var(--text-primary)]">{nombre}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {isVerificado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                <IconVerified size={12} /> Verificado
              </span>
            )}
            {showPublisher && (
              <span className="rounded-full bg-[var(--brand-yellow)]/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
                Anunciante
              </span>
            )}
          </div>

          {!loadingStats && stats && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Guardados', value: stats.favoritesCount },
                { label: 'Mensajes', value: stats.unreadMessages },
                { label: 'Publicaciones', value: stats.adsCount },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-[var(--bg-secondary)] px-3 py-2 text-center"
                >
                  <p className="text-lg font-bold text-[var(--text-primary)]">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProfileTabs
        active={tab}
        onChange={setTab}
        showPublisher={showPublisher}
        showBusinesses={showBusinesses}
        badges={{
          mensajes: stats?.unreadMessages,
          guardados: stats?.favoritesCount,
        }}
      />

      <div className="min-h-[320px]">
        {tab === 'inicio' && <ProfileOverviewTab stats={stats} onNavigate={setTab} />}
        {tab === 'guardados' && <ProfileFavoritesTab />}
        {tab === 'historial' && <ProfileHistoryTab token={session?.access_token} />}
        {tab === 'mensajes' && <ProfileMessagesTab />}
        {tab === 'ocultos' && <ProfileHiddenTab />}
        {tab === 'publicar' && showPublisher && (
          <ProfilePublisherTab token={session?.access_token} highlightId={highlightId} />
        )}
        {tab === 'negocios' && showBusinesses && <ProfileBusinessesTab />}
        {tab === 'ajustes' && <ProfileSettingsTab />}
      </div>
    </div>
  );
}
