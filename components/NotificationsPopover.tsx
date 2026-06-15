import React from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { IconBell, IconHeart, IconMessages, IconCheck, IconMegaphone } from '@/components/Icons';
import { NotificationType } from '@/types';
import { formatTimeAgo } from '@/utils/date';

interface NotificationsPopoverProps {
    onClose: () => void;
}

export default function NotificationsPopover({ onClose }: NotificationsPopoverProps) {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'like':
                return <IconHeart size={14} color="#ef4444" />;
            case 'message':
                return <IconMessages size={14} color="var(--brand-yellow)" />;
            case 'ad_approved':
                return <IconCheck size={14} color="#22c55e" />;
            case 'ad_rejected':
                return <IconBell size={14} color="#ef4444" />;
            case 'system':
            default:
                return <IconMegaphone size={14} color="var(--brand-yellow)" />;
        }
    };

    const getIconBg = (type: NotificationType) => {
        switch (type) {
            case 'like':
                return 'bg-red-500/10';
            case 'message':
                return 'bg-[rgba(var(--brand-yellow-rgb),0.15)]';
            case 'ad_approved':
                return 'bg-emerald-500/10';
            default:
                return 'bg-[rgba(var(--brand-primary-rgb),0.1)]';
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
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
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(var(--brand-primary-rgb),0.12)]">
                        <IconBell size={14} color="var(--brand-blue)" />
                    </span>
                    Notificaciones
                </h3>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={() => markAllAsRead()}
                        className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
                    >
                        Marcar todo leído
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.1)]">
                            <IconBell size={24} color="var(--brand-blue)" />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">No tienes notificaciones nuevas</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-color)]">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`cursor-pointer px-4 py-3 transition-colors hover:bg-[var(--hover-bg)] ${
                                    !notification.read ? 'bg-[rgba(var(--brand-primary-rgb),0.06)]' : ''
                                }`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex gap-3">
                                    <div
                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getIconBg(notification.type)}`}
                                    >
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-sm text-[var(--text-primary)] ${
                                                !notification.read ? 'font-semibold' : 'font-medium'
                                            }`}
                                        >
                                            {notification.title}
                                        </p>
                                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
                                            {notification.message}
                                        </p>
                                        <p className="mt-1.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                                            {formatTimeAgo(notification.created_at)}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-blue)]" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] p-2">
                <Link
                    href="/perfil?tab=inicio"
                    onClick={onClose}
                    className="block w-full rounded-lg py-2 text-center text-xs font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--hover-bg)]"
                >
                    Ver todas las notificaciones
                </Link>
            </div>
        </div>
    );
}
