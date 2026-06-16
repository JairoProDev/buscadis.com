'use client';

import { DealLiveSession } from '@/types';
import DealLiveBadge from './DealLiveBadge';

interface DealLiveRailProps {
  sessions: DealLiveSession[];
  onJoin: (session: DealLiveSession) => void;
}

export default function DealLiveRail({ sessions, onJoin }: DealLiveRailProps) {
  if (!sessions.length) return null;

  return (
    <div className="absolute top-14 left-0 right-0 z-30 flex gap-2 overflow-x-auto px-4 py-2">
      {sessions.map((s) => (
        <DealLiveBadge key={s.id} title={s.title} onClick={() => onJoin(s)} />
      ))}
    </div>
  );
}
