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
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 px-3 pt-2 pb-2 border-b border-black/[0.04]">
        <UnifiedSearchComposer
          value={composerText}
          onChange={setComposerText}
          compact
          flat
          initialMode="publish"
          publishBehavior="chat"
          onPublishToChat={(payload) => setChatSeed(payload)}
          onNotify={onNotify}
        />
      </div>
      <div className="flex-1 min-h-0 px-2 py-2">
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
