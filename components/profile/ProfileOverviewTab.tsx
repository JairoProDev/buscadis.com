'use client';

import { ProfileDashboardStats } from '@/lib/profile/server';
import {
  IconHeart,
  IconMessages,
  IconEye,
  IconMegaphone,
  IconSparkles,
  IconChevronRight,
} from '@/components/Icons';
import { ProfileTabId } from './ProfileTabs';

interface ProfileOverviewTabProps {
  stats: ProfileDashboardStats | null;
  onNavigate: (tab: ProfileTabId) => void;
}

const ICON_BOX = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl';

export default function ProfileOverviewTab({ stats, onNavigate }: ProfileOverviewTabProps) {
  const cards = [
    {
      title: 'Guardados',
      desc: 'Avisos que marcaste con corazón',
      count: stats?.favoritesCount ?? 0,
      tab: 'guardados' as ProfileTabId,
      icon: <IconHeart size={20} color="#ef4444" />,
      iconBg: 'bg-red-500/10',
    },
    {
      title: 'Mensajes',
      desc: 'Chats con vendedores y anunciantes',
      count: stats?.unreadMessages ?? 0,
      tab: 'mensajes' as ProfileTabId,
      icon: <IconMessages size={20} color="var(--brand-yellow)" />,
      iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.15)]',
    },
    {
      title: 'Historial',
      desc: 'Lo que viste recientemente',
      tab: 'historial' as ProfileTabId,
      icon: <IconEye size={20} color="var(--brand-blue)" />,
      iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
    },
  ];

  const publisherCards =
    stats?.isAnunciante || (stats?.adsCount ?? 0) > 0
      ? [
          {
            title: 'Mis publicaciones',
            desc: `${stats?.adsCount ?? 0} avisos · ${stats?.storiesCount ?? 0} historias`,
            tab: 'publicar' as ProfileTabId,
            icon: <IconMegaphone size={20} color="var(--brand-yellow)" />,
            iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.15)]',
            href: undefined as string | undefined,
          },
        ]
      : [
          {
            title: 'Publica tu primer aviso',
            desc: 'Llega a miles de personas en tu ciudad',
            href: '/publicar',
            icon: <IconSparkles size={20} color="var(--brand-blue)" />,
            iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
            tab: undefined as ProfileTabId | undefined,
          },
        ];

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        Tu espacio para guardar, contactar y publicar en Buscadis.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={() => onNavigate(c.tab)}
            className="group flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 text-left transition-all hover:border-[var(--brand-blue)]/35 hover:shadow-sm"
          >
            <span className={`${ICON_BOX} ${c.iconBg}`}>{c.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--text-primary)]">{c.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.desc}</p>
              {c.count != null && c.count > 0 && (
                <p className="mt-1 text-sm font-bold text-[var(--brand-blue)]">{c.count}</p>
              )}
            </div>
            <IconChevronRight
              size={14}
              className="shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100"
            />
          </button>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Para vendedores</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {publisherCards.map((c) =>
            c.href ? (
              <a
                key={c.title}
                href={c.href}
                className="group flex items-center gap-3 rounded-2xl border border-dashed border-[var(--brand-blue)]/35 bg-[rgba(var(--brand-primary-rgb),0.05)] p-4 transition-all hover:border-[var(--brand-blue)]/50"
              >
                <span className={`${ICON_BOX} ${c.iconBg}`}>{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">{c.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{c.desc}</p>
                </div>
                <IconChevronRight size={14} className="shrink-0 text-[var(--brand-blue)]" />
              </a>
            ) : (
              <button
                key={c.title}
                type="button"
                onClick={() => c.tab && onNavigate(c.tab)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 text-left transition-all hover:border-[var(--brand-blue)]/35"
              >
                <span className={`${ICON_BOX} ${c.iconBg}`}>{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">{c.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{c.desc}</p>
                </div>
                <IconChevronRight
                  size={14}
                  className="shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100"
                />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
