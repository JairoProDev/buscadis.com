'use client';

import { DealFeedTab } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

const TABS: { id: DealFeedTab; labelKey: string }[] = [
  { id: 'for_you', labelKey: 'deals.tabForYou' },
  { id: 'nearby', labelKey: 'deals.tabNearby' },
  { id: 'following', labelKey: 'deals.tabFollowing' },
];

interface DealsTopTabsProps {
  active: DealFeedTab;
  onChange: (tab: DealFeedTab) => void;
  liveCount?: number;
}

export default function DealsTopTabs({ active, onChange, liveCount = 0 }: DealsTopTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center gap-1 px-4 pt-3 pb-2"
      style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            active === tab.id
              ? 'bg-white text-black'
              : 'bg-black/30 text-white backdrop-blur-sm'
          }`}
        >
          {t(tab.labelKey)}
        </button>
      ))}
      {liveCount > 0 && (
        <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          {liveCount} LIVE
        </span>
      )}
    </div>
  );
}
