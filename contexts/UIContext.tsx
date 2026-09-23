'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { markAuthPromptDismissed } from '@/lib/auth-session-prompt';
import { promptGoogleSignIn } from '@/lib/auth/google-sign-in-prompt';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const ChatDock = dynamic(() => import('@/components/ChatDock'), { ssr: false });
const AuthSessionPrompt = dynamic(() => import('@/components/auth/AuthSessionPrompt'), {
  ssr: false,
});

export interface ChatOpenContext {
  matchScore?: number;
  adisoTitle?: string;
  initialMessage?: string;
  adisoId?: string;
  adisoImageUrl?: string;
  adisoPriceLabel?: string;
  otherUser?: {
    id: string;
    nombre?: string;
    avatar_url?: string;
  };
}

interface DockedChat {
  id: string;
  minimized: boolean;
  context: ChatOpenContext | null;
}

interface UIContextType {
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: (options?: { dismissed?: boolean }) => void;
  activeChatId: string | null;
  chatContext: ChatOpenContext | null;
  openChat: (conversationId: string, context?: ChatOpenContext) => void;
  closeChat: () => void;
  chatDock: DockedChat[];
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [chatDock, setChatDock] = useState<DockedChat[]>([]);

  const openAuthModal = useCallback(async (mode?: 'login' | 'signup') => {
    const shown = await promptGoogleSignIn();
    if (shown) return;
    if (mode) setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback((options?: { dismissed?: boolean }) => {
    setIsAuthModalOpen(false);
    if (options?.dismissed) markAuthPromptDismissed();
  }, []);

  const openChat = useCallback((id: string, context?: ChatOpenContext) => {
    setChatDock((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) =>
          c.id === id
            ? {
                ...c,
                minimized: false,
                context: context ? { ...c.context, ...context } : c.context,
              }
            : c
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
        authModalMode,
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
      <AuthSessionPrompt />
      <AuthModal
        abierto={isAuthModalOpen}
        onCerrar={closeAuthModal}
        modoInicial={authModalMode}
      />
      <ChatDock
        chats={chatDock}
        onClose={closeChat}
        onToggleMinimize={toggleMinimize}
      />
      <GlobalToastHost />
    </UIContext.Provider>
  );
}

function GlobalToastHost() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
