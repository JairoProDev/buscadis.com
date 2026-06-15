'use client';

export type ProfileTabId =
  | 'inicio'
  | 'guardados'
  | 'historial'
  | 'mensajes'
  | 'ocultos'
  | 'publicar'
  | 'negocios'
  | 'ajustes';

export const PROFILE_TABS: { id: ProfileTabId; label: string; publisherOnly?: boolean; businessOnly?: boolean }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'guardados', label: 'Guardados' },
  { id: 'historial', label: 'Historial' },
  { id: 'mensajes', label: 'Mensajes' },
  { id: 'ocultos', label: 'Ocultos' },
  { id: 'publicar', label: 'Publicar', publisherOnly: true },
  { id: 'negocios', label: 'Negocios', businessOnly: true },
  { id: 'ajustes', label: 'Ajustes' },
];

interface ProfileTabsProps {
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
  showPublisher: boolean;
  showBusinesses: boolean;
  badges?: Partial<Record<ProfileTabId, number>>;
}

export default function ProfileTabs({
  active,
  onChange,
  showPublisher,
  showBusinesses,
  badges,
}: ProfileTabsProps) {
  const visible = PROFILE_TABS.filter((t) => {
    if (t.publisherOnly && !showPublisher) return false;
    if (t.businessOnly && !showBusinesses) return false;
    return true;
  });

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {visible.map((tab) => {
        const selected = active === tab.id;
        const badge = badges?.[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected
                ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            {tab.label}
            {badge != null && badge > 0 && (
              <span
                className={`ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  selected ? 'bg-white/25 text-white' : 'bg-[var(--brand-blue)] text-white'
                }`}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
