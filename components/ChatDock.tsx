'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ChatOpenContext } from '@/contexts/UIContext';

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), { ssr: false });

export interface DockedChat {
  id: string;
  minimized: boolean;
  context: ChatOpenContext | null;
}

interface ChatDockProps {
  chats: DockedChat[];
  onClose: (id: string) => void;
  onToggleMinimize: (id: string) => void;
}

export default function ChatDock({ chats, onClose, onToggleMinimize }: ChatDockProps) {
  if (!chats.length) return null;

  return (
    <>
      {chats.map((chat, index) => {
        const offset = index * 12;
        if (chat.minimized) {
          const label =
            chat.context?.otherUser?.nombre ||
            chat.context?.adisoTitle ||
            'Chat';
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => onToggleMinimize(chat.id)}
              className="fixed z-[2100] flex max-w-[220px] items-center gap-2 rounded-full bg-[var(--brand-blue)] px-3 py-2 text-sm font-semibold text-white shadow-lg hover:brightness-105"
              style={{ bottom: 16 + offset, right: 16 }}
            >
              {chat.context?.otherUser?.avatar_url ? (
                <img
                  src={chat.context.otherUser.avatar_url}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="truncate">{label}</span>
            </button>
          );
        }

        return (
          <div
            key={chat.id}
            className="fixed z-[2100]"
            style={{ bottom: 0, right: 16 + index * 24 }}
          >
            <ChatWindow
              conversationId={chat.id}
              onClose={() => onClose(chat.id)}
              onMinimize={() => onToggleMinimize(chat.id)}
              context={chat.context}
            />
          </div>
        );
      })}
    </>
  );
}
