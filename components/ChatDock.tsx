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
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => onToggleMinimize(chat.id)}
              className="fixed z-[2100] flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
              style={{ bottom: 16 + offset, right: 16 }}
            >
              <span className="max-w-[140px] truncate">
                {chat.context?.adisoTitle ? `Chat · ${chat.context.adisoTitle}` : 'Chat'}
              </span>
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
              matchScore={chat.context?.matchScore}
              adisoTitle={chat.context?.adisoTitle}
              initialMessage={undefined}
            />
          </div>
        );
      })}
    </>
  );
}
