'use client';

import { ProfileDashboardStats } from '@/lib/profile/server';
import { ProfileTabId } from './ProfileTabs';

interface ProfileOverviewTabProps {
  stats: ProfileDashboardStats | null;
  onNavigate: (tab: ProfileTabId) => void;
}

export default function ProfileOverviewTab({ stats, onNavigate }: ProfileOverviewTabProps) {
  const cards = [
    {
      title: 'Guardados',
      desc: 'Avisos que marcaste con corazón',
      count: stats?.favoritesCount ?? 0,
      tab: 'guardados' as ProfileTabId,
      emoji: '♥',
    },
    {
      title: 'Mensajes',
      desc: 'Chats con vendedores y anunciantes',
      count: stats?.unreadMessages ?? 0,
      tab: 'mensajes' as ProfileTabId,
      emoji: '💬',
    },
    {
      title: 'Historial',
      desc: 'Lo que viste recientemente',
      tab: 'historial' as ProfileTabId,
      emoji: '👁',
    },
  ];

  const publisherCards =
    stats?.isAnunciante || (stats?.adsCount ?? 0) > 0
      ? [
          {
            title: 'Mis publicaciones',
            desc: `${stats?.adsCount ?? 0} avisos · ${stats?.storiesCount ?? 0} historias`,
            tab: 'publicar' as ProfileTabId,
            emoji: '📢',
          },
        ]
      : [
          {
            title: 'Publica tu primer aviso',
            desc: 'Llega a miles de personas en tu ciudad',
            href: '/publicar',
            emoji: '🚀',
          },
        ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Tu espacio para guardar, contactar y publicar en Buscadis.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={() => onNavigate(c.tab)}
            className="flex items-start gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 text-left transition-colors hover:border-[var(--brand-blue)]/40"
          >
            <span className="text-2xl">{c.emoji}</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{c.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.desc}</p>
              {c.count != null && c.count > 0 && (
                <p className="mt-1 text-sm font-bold text-[var(--brand-blue)]">{c.count}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <h2 className="pt-2 text-sm font-semibold text-[var(--text-primary)]">Para vendedores</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {publisherCards.map((c) =>
          'href' in c ? (
            <a
              key={c.title}
              href={c.href}
              className="flex items-start gap-3 rounded-2xl border border-dashed border-[var(--brand-blue)]/40 bg-[rgba(var(--brand-primary-rgb),0.06)] p-4"
            >
              <span className="text-2xl">{c.emoji}</span>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{c.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{c.desc}</p>
              </div>
            </a>
          ) : (
            <button
              key={c.title}
              type="button"
              onClick={() => onNavigate(c.tab!)}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 text-left"
            >
              <span className="text-2xl">{c.emoji}</span>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{c.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{c.desc}</p>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
}
