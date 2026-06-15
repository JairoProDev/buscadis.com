'use client';

import type { ComponentType } from 'react';
import {
  IconHome,
  IconHeart,
  IconClock,
  IconMessages,
  IconEyeOff,
  IconMegaphone,
  IconStore,
  IconSettings,
} from '@/components/Icons';

export type ProfileTabId =
  | 'inicio'
  | 'guardados'
  | 'historial'
  | 'mensajes'
  | 'ocultos'
  | 'publicar'
  | 'negocios'
  | 'ajustes';

type TabIcon = ComponentType<{ size?: number; color?: string; className?: string }>;

export const PROFILE_TABS: {
  id: ProfileTabId;
  label: string;
  Icon: TabIcon;
  publisherOnly?: boolean;
  businessOnly?: boolean;
}[] = [
  { id: 'inicio', label: 'Inicio', Icon: IconHome },
  { id: 'guardados', label: 'Guardados', Icon: IconHeart },
  { id: 'historial', label: 'Historial', Icon: IconClock },
  { id: 'mensajes', label: 'Mensajes', Icon: IconMessages },
  { id: 'ocultos', label: 'Ocultos', Icon: IconEyeOff },
  { id: 'publicar', label: 'Publicar', Icon: IconMegaphone, publisherOnly: true },
  { id: 'negocios', label: 'Negocios', Icon: IconStore, businessOnly: true },
  { id: 'ajustes', label: 'Ajustes', Icon: IconSettings },
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
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar">
      {visible.map((tab) => {
        const selected = active === tab.id;
        const badge = badges?.[tab.id];
        const TabIcon = tab.Icon;
        const iconColor = selected ? 'white' : 'var(--text-secondary)';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
              selected
                ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            <TabIcon size={14} color={iconColor} className="shrink-0" />
            <span className="whitespace-nowrap">{tab.label}</span>
            {badge != null && badge > 0 && (
              <span
                className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
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
