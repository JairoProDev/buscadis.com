import React from 'react';
import { useConversations } from '@/hooks/useConversations';
import { IconSearch, IconUser, IconMessages } from '@/components/Icons';
import { formatTimeAgo } from '@/utils/date';
import Image from 'next/image';
import Link from 'next/link';

interface MessagesPopoverProps {
    onClose: () => void;
    onOpenConversation: (conversationId: string) => void;
}

export default function MessagesPopover({ onClose, onOpenConversation }: MessagesPopoverProps) {
    const { conversations, unreadCount, loading } = useConversations();

    if (loading && conversations.length === 0) {
        return (
        <div className="w-full animate-fade-in-down rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
            <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
            </div>
        </div>
    );
    }

    return (
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(var(--brand-yellow-rgb),0.18)]">
                        <IconMessages size={14} color="var(--brand-yellow)" />
                    </span>
                    Mensajes
                </h3>
                {unreadCount > 0 && (
                    <span className="rounded-full bg-[var(--brand-yellow)] px-2 py-0.5 text-[10px] font-bold text-[#1e293b]">
                        {unreadCount} nuevos
                    </span>
                )}
            </div>

            <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--bg-primary)] p-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar mensajes..."
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.2)]"
                    />
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                </div>
            </div>

            <div className="max-h-[400px] flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--brand-yellow-rgb),0.12)]">
                            <IconMessages size={24} color="var(--brand-yellow)" />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">No tienes conversaciones activas</p>
                        <Link
                            href="/"
                            className="mt-4 inline-block rounded-xl bg-[rgba(var(--brand-primary-rgb),0.1)] px-4 py-2 text-xs font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[rgba(var(--brand-primary-rgb),0.16)]"
                        >
                            Contactar a un vendedor
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-color)]">
                        {conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`cursor-pointer px-4 py-3 transition-colors hover:bg-[var(--hover-bg)] ${
                                    conversation.unread_count && conversation.unread_count > 0
                                        ? 'bg-[rgba(var(--brand-yellow-rgb),0.06)]'
                                        : ''
                                }`}
                                onClick={() => onOpenConversation(conversation.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                                        {conversation.other_user?.avatar_url ? (
                                            <Image
                                                src={conversation.other_user.avatar_url}
                                                alt=""
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center">
                                                <IconUser size={18} color="var(--text-tertiary)" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-0.5 flex items-baseline justify-between gap-2">
                                            <h4
                                                className={`truncate text-sm text-[var(--text-primary)] ${
                                                    conversation.unread_count ? 'font-bold' : 'font-medium'
                                                }`}
                                            >
                                                {conversation.other_user?.nombre ||
                                                    conversation.other_user?.email ||
                                                    'Usuario'}
                                            </h4>
                                            <span className="shrink-0 text-[10px] font-medium text-[var(--text-tertiary)]">
                                                {conversation.last_message_at
                                                    ? formatTimeAgo(conversation.last_message_at)
                                                    : ''}
                                            </span>
                                        </div>
                                        <p className="truncate text-xs text-[var(--text-secondary)]">
                                            {conversation.last_message || (
                                                <span className="italic opacity-70">Nueva conversación</span>
                                            )}
                                        </p>
                                    </div>
                                    {conversation.unread_count != null && conversation.unread_count > 0 && (
                                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-yellow)] px-1 text-[10px] font-bold text-[#1e293b]">
                                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] p-2">
                <Link
                    href="/perfil?tab=mensajes"
                    onClick={onClose}
                    className="block w-full rounded-lg py-2 text-center text-xs font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--hover-bg)]"
                >
                    Ver todos los mensajes
                </Link>
            </div>
        </div>
    );
}
