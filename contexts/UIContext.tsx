'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const ChatWindow = dynamic(() => import('@/components/ChatWindow'), { ssr: false });

interface UIContextType {
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    activeChatId: string | null;
    chatContext: ChatOpenContext | null;
    openChat: (conversationId: string, context?: ChatOpenContext) => void;
    closeChat: () => void;
}

export interface ChatOpenContext {
    matchScore?: number;
    adisoTitle?: string;
    initialMessage?: string;
    adisoId?: string;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatContext, setChatContext] = useState<ChatOpenContext | null>(null);

    const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

    const openChat = useCallback((id: string, context?: ChatOpenContext) => {
        setActiveChatId(id);
        setChatContext(context || null);
    }, []);
    const closeChat = useCallback(() => {
        setActiveChatId(null);
        setChatContext(null);
    }, []);

    return (
        <UIContext.Provider value={{
            isAuthModalOpen, openAuthModal, closeAuthModal,
            activeChatId, chatContext, openChat, closeChat
        }}>
            {children}
            <AuthModal abierto={isAuthModalOpen} onCerrar={closeAuthModal} />
            {activeChatId && (
                <ChatWindow
                    conversationId={activeChatId}
                    onClose={closeChat}
                    matchScore={chatContext?.matchScore}
                    adisoTitle={chatContext?.adisoTitle}
                    initialMessage={chatContext?.initialMessage}
                />
            )}
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
