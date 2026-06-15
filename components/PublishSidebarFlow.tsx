'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const UnifiedSearchComposer = dynamic(() => import('@/components/UnifiedSearchComposer'), {
  ssr: false,
});

const PublishChatWizard = dynamic(() => import('@/components/publish/PublishChatWizard'), {
  ssr: false,
});

export default function PublishSidebarFlow({
  onNotify,
}: {
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
}) {
  const [composerText, setComposerText] = useState('');
  const [chatSeed, setChatSeed] = useState<{ text: string; imageUrl?: string | null } | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--bg-secondary)]">
      <div
        className="shrink-0 px-3 pt-3 pb-2"
        style={{ background: 'var(--brand-mesh-soft)' }}
      >
        <div className="rounded-2xl bg-[var(--bg-primary)]/80 backdrop-blur-sm p-2 ring-1 ring-black/[0.04] shadow-sm">
          <UnifiedSearchComposer
            value={composerText}
            onChange={setComposerText}
            compact
            initialMode="publish"
            publishBehavior="chat"
            onPublishToChat={(payload) => setChatSeed(payload)}
            onNotify={onNotify}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 px-2 pb-2">
        <PublishChatWizard
          compact
          initialText={composerText}
          externalSubmit={chatSeed}
          onExternalSubmitHandled={() => setChatSeed(null)}
          onNotify={onNotify}
          onPublished={() => setComposerText('')}
        />
      </div>
    </div>
  );
}
