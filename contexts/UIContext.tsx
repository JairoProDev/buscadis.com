'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const ChatDock = dynamic(() => import('@/components/ChatDock'), { ssr: false });

export interface ChatOpenContext {
  matchScore?: number;
  adisoTitle?: string;
  initialMessage?: string;
  adisoId?: string;
}

interface DockedChat {
  id: string;
  minimized: boolean;
  context: ChatOpenContext | null;
}

interface UIContextType {
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  activeChatId: string | null;
  chatContext: ChatOpenContext | null;
  openChat: (conversationId: string, context?: ChatOpenContext) => void;
  closeChat: () => void;
  chatDock: DockedChat[];
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [chatDock, setChatDock] = useState<DockedChat[]>([]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const openChat = useCallback((id: string, context?: ChatOpenContext) => {
    setChatDock((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) =>
          c.id === id ? { ...c, minimized: false, context: context || c.context } : c
        );
      }
      const next = [...prev, { id, minimized: false, context: context || null }];
      return next.slice(-3);
    });
  }, []);

  const closeChat = useCallback((id?: string) => {
    if (id) {
      setChatDock((prev) => prev.filter((c) => c.id !== id));
    } else {
      setChatDock([]);
    }
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setChatDock((prev) =>
      prev.map((c) => (c.id === id ? { ...c, minimized: !c.minimized } : c))
    );
  }, []);

  const active = chatDock.find((c) => !c.minimized) || chatDock[chatDock.length - 1];

  return (
    <UIContext.Provider
      value={{
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        activeChatId: active?.id ?? null,
        chatContext: active?.context ?? null,
        openChat,
        closeChat: () => closeChat(),
        chatDock,
      }}
    >
      {children}
      <AuthModal abierto={isAuthModalOpen} onCerrar={closeAuthModal} />
      <ChatDock
        chats={chatDock}
        onClose={closeChat}
        onToggleMinimize={toggleMinimize}
      />
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
