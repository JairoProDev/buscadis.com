'use client';

import { useConversations } from '@/hooks/useConversations';
import { useUI } from '@/contexts/UIContext';
import ProfileEmptyState from './ProfileEmptyState';
import { IconMessages } from '@/components/Icons';

export default function ProfileMessagesTab() {
  const { conversations, loading } = useConversations();
  const { openChat } = useUI();

  if (loading) return <div className="skeleton-shimmer h-48 rounded-2xl" />;

  if (conversations.length === 0) {
    return (
      <ProfileEmptyState
        icon={<IconMessages size={24} color="var(--brand-yellow)" />}
        title="Sin conversaciones"
        description="Contacta a un vendedor desde un aviso o una historia para iniciar un chat aquí."
        actionLabel="Explorar avisos"
        actionHref="/"
      />
    );
  }

  return (
    <>
      <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
        {conversations.map((conv) => {
          const name =
            conv.other_user?.nombre || conv.other_user?.email?.split('@')[0] || 'Usuario';
          const unread = conv.unread_count || 0;
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => openChat(conv.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--hover-bg)]"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-blue)]/15 text-sm font-bold text-[var(--brand-blue)]">
                {conv.other_user?.avatar_url ? (
                  <img
                    src={conv.other_user.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-[var(--text-primary)]">{name}</p>
                  {conv.last_message_at && (
                    <span className="flex-shrink-0 text-[10px] text-[var(--text-secondary)]">
                      {new Date(conv.last_message_at).toLocaleDateString('es-PE', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-[var(--text-secondary)]">
                  {conv.last_message || 'Sin mensajes'}
                </p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand-blue)] px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
