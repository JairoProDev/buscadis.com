'use client';

import dynamic from 'next/dynamic';

const PublishStudioShell = dynamic(() => import('@/components/publish/PublishStudioShell'), {
  ssr: false,
});

export default function PublishSidebarFlow({
  onNotify,
}: {
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <PublishStudioShell variant="sidebar" onNotify={onNotify} />
    </div>
  );
}
