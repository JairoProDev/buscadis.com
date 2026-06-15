'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useUI } from '@/contexts/UIContext';
import { ProfileDashboardStats } from '@/lib/profile/server';
import {
  computeProfileCompletion,
  parseSocialFromMetadata,
  ProfileTask,
} from '@/lib/profile-completion';
import { buildModeDisplay, resolveUserMode } from '@/lib/user-modes';
import ProfileTabs, { ProfileTabId } from './ProfileTabs';
import ProfileOverviewTab from './ProfileOverviewTab';
import ProfileFavoritesTab from './ProfileFavoritesTab';
import ProfileHistoryTab from './ProfileHistoryTab';
import ProfileMessagesTab from './ProfileMessagesTab';
import ProfileHiddenTab from './ProfileHiddenTab';
import ProfileSettingsTab from './ProfileSettingsTab';
import ProfilePublisherTab from './ProfilePublisherTab';
import ProfileBusinessesTab from './ProfileBusinessesTab';
import ProfileCompletionCard from './ProfileCompletionCard';
import ProfileHubSkeleton from './ProfileHubSkeleton';
import ModeIndicator from './ModeIndicator';
import {
  IconVerified,
  IconHeart,
  IconMessages,
  IconMegaphone,
} from '@/components/Icons';

interface ProfileHubShellProps {
  initialTab?: ProfileTabId;
  highlightId?: string | null;
  focusSection?: string | null;
}

export default function ProfileHubShell({
  initialTab = 'inicio',
  highlightId,
  focusSection,
}: ProfileHubShellProps) {
  const router = useRouter();
  const { user, signOut, session, loading: authLoading } = useAuth();
  const { profile, isAnunciante, isVerificado } = useUser();
  const { openAuthModal } = useUI();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<ProfileTabId>(initialTab);
  const [settingsFocus, setSettingsFocus] = useState<string | null>(focusSection ?? null);
  const [stats, setStats] = useState<ProfileDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (focusSection) setSettingsFocus(focusSection);
  }, [focusSection]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;
    if (!user) {
      openAuthModal();
      router.push('/');
    }
  }, [user, authLoading, mounted, openAuthModal, router]);

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
    if (!mounted) return;
    if (highlightId) setTab('publicar');
    else setTab(initialTab);
  }, [highlightId, initialTab, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url.pathname + url.search);
  }, [tab, mounted]);

  const handleCompletionTask = useCallback(
    (task: ProfileTask) => {
      setTab('ajustes');
      setSettingsFocus(task.section);
      if (!mounted) return;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'ajustes');
      url.searchParams.set('section', task.section);
      window.history.replaceState(null, '', url.pathname + url.search);
    },
    [mounted]
  );

  if (!mounted || authLoading) {
    return <ProfileHubSkeleton />;
  }

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

  const mode = resolveUserMode(false, showPublisher);
  const modeDisplay = buildModeDisplay(mode);

  const social = parseSocialFromMetadata(user.user_metadata);
  const completion = computeProfileCompletion(profile, social, !!user.email_confirmed_at);

  const statItems = [
    {
      label: 'Guardados',
      value: stats?.favoritesCount ?? 0,
      icon: <IconHeart size={14} color="#ef4444" />,
      iconBg: 'bg-red-500/10',
      onClick: () => setTab('guardados'),
    },
    {
      label: 'Mensajes',
      value: stats?.unreadMessages ?? 0,
      icon: <IconMessages size={14} color="var(--brand-yellow)" />,
      iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.15)]',
      onClick: () => setTab('mensajes'),
    },
    {
      label: 'Publicaciones',
      value: stats?.adsCount ?? 0,
      icon: <IconMegaphone size={14} color="var(--brand-blue)" />,
      iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
      onClick: () => showPublisher && setTab('publicar'),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm">
        <div className="h-24 bg-gradient-to-br from-[var(--brand-blue)] via-[#3b82f6] to-[rgba(var(--brand-primary-rgb),0.6)]" />
        <div className="relative px-5 pb-5">
          <div className="-mt-12 mb-4 flex items-end justify-between gap-3">
            <div className="relative">
              <div className="h-[88px] w-[88px] overflow-hidden rounded-full bg-[var(--bg-tertiary)] shadow-lg ring-[3px] ring-[var(--bg-primary)]">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--brand-blue)]">
                    {iniciales}
                  </span>
                )}
              </div>
              {isVerificado && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-primary)] shadow">
                  <IconVerified size={14} />
                </span>
              )}
            </div>
            <div className="flex gap-2 pb-1">
              <Link
                href="/publicar"
                className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Publicar
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
              >
                Salir
              </button>
            </div>
          </div>

          <h1 className="text-xl font-bold text-[var(--text-primary)]">{nombre}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
          <div className="mt-2">
            <ModeIndicator display={modeDisplay} size="md" />
          </div>

          {completion.percent < 100 && (
            <div className="mt-4">
              <ProfileCompletionCard
                completion={completion}
                onTaskClick={handleCompletionTask}
                compact
              />
            </div>
          )}

          {!loadingStats && stats && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {statItems.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={s.onClick}
                  className="rounded-xl bg-[var(--bg-secondary)] px-3 py-2.5 text-center transition-colors hover:bg-[var(--hover-bg)]"
                >
                  <span
                    className={`mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg ${s.iconBg}`}
                  >
                    {s.icon}
                  </span>
                  <p className="text-lg font-bold leading-none text-[var(--text-primary)]">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                    {s.label}
                  </p>
                </button>
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
        {tab === 'inicio' && (
          <ProfileOverviewTab
            stats={stats}
            onNavigate={setTab}
            completion={completion}
            onCompletionTask={handleCompletionTask}
          />
        )}
        {tab === 'guardados' && <ProfileFavoritesTab />}
        {tab === 'historial' && <ProfileHistoryTab token={session?.access_token} />}
        {tab === 'mensajes' && <ProfileMessagesTab />}
        {tab === 'ocultos' && <ProfileHiddenTab />}
        {tab === 'publicar' && showPublisher && (
          <ProfilePublisherTab token={session?.access_token} highlightId={highlightId} />
        )}
        {tab === 'negocios' && showBusinesses && <ProfileBusinessesTab />}
        {tab === 'ajustes' && <ProfileSettingsTab focusSection={settingsFocus} />}
      </div>
    </div>
  );
}
