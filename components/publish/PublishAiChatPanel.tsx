'use client';

import { IconAdis, IconChevronDown, IconChevronUp } from '@/components/Icons';
import type { PublishChatMessage } from '@/lib/publish/publish-draft-types';

interface PublishAiChatPanelProps {
  messages: PublishChatMessage[];
  minimized: boolean;
  analyzing?: boolean;
  onExpand: () => void;
  onMinimize: () => void;
}

export default function PublishAiChatPanel({
  messages,
  minimized,
  analyzing,
  onExpand,
  onMinimize,
}: PublishAiChatPanelProps) {
  if (messages.length === 0 && !analyzing) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="mx-2 mb-1 flex w-[calc(100%-1rem)] items-center justify-between rounded-full bg-[var(--bg-secondary)] px-3 py-2 text-left ring-1 ring-[var(--border-color)]"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
          <IconAdis size={14} color="var(--brand-blue)" />
          Chat con ADIS
          <span className="font-normal text-[var(--text-tertiary)]">({messages.length})</span>
        </span>
        <IconChevronUp size={14} className="text-[var(--text-tertiary)]" />
      </button>
    );
  }

  return (
    <div
      className="mx-2 mb-1 flex h-[min(50vh,420px)] flex-col overflow-hidden rounded-2xl bg-[var(--bg-primary)] ring-1 ring-[var(--border-color)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
          <IconAdis size={15} color="var(--brand-blue)" />
          ADIS
        </span>
        <button
          type="button"
          onClick={onMinimize}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] hover:bg-[var(--hover-bg)]"
          aria-label="Minimizar chat"
        >
          Minimizar
          <IconChevronDown size={12} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((msg) => (
          <p
            key={msg.id}
            className={`m-0 max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
              msg.role === 'user'
                ? 'ml-auto bg-[var(--brand-blue)] text-white'
                : 'mr-auto bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            }`}
          >
            {msg.content}
          </p>
        ))}
        {analyzing && (
          <p className="m-0 mr-auto max-w-[92%] rounded-2xl bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-secondary)] animate-pulse">
            ADIS está pensando…
          </p>
        )}
      </div>
    </div>
  );
}
