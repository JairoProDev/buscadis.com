'use client';

import dynamic from 'next/dynamic';
import type { Adiso } from '@/types';

const PublishStudioShell = dynamic(() => import('@/components/publish/PublishStudioShell'), {
  ssr: false,
});

export default function PublishSidebarFlow({
  onNotify,
  onPublished,
}: {
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onPublished?: (adiso: Adiso) => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <PublishStudioShell
        variant="sidebar"
        onNotify={onNotify}
        onPublished={onPublished}
      />
    </div>
  );
}
