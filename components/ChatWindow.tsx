'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useChat } from '@/hooks/useChat';
import { ChatOpenContext } from '@/contexts/UIContext';
import { formatTimeAgo } from '@/utils/date';
import { supabase } from '@/lib/supabase';
import { fetchListingPreviews } from '@/lib/chat/listing-preview';
import { useAuth } from '@/hooks/useAuth';
import { IconSend, IconUser } from '@/components/Icons';

interface ChatWindowProps {
  conversationId: string;
  onClose: () => void;
  onMinimize?: () => void;
  context?: ChatOpenContext | null;
}

function messageImageUrl(msg: {
  metadata?: Record<string, unknown> | null;
  content?: string;
}): string | null {
  const meta = msg.metadata;
  if (meta && typeof meta.imageUrl === 'string' && meta.imageUrl.startsWith('http')) {
    return meta.imageUrl;
  }
  // Legacy auto-replies sometimes append URL on a second line
  const lines = (msg.content || '').split('\n');
  const last = lines[lines.length - 1]?.trim();
  if (last && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(last)) return last;
  if (last && /^https?:\/\/.+/i.test(last) && /supabase\.co\/storage/i.test(last)) return last;
  return null;
}

function messageTextWithoutImageUrl(content: string, imageUrl: string | null): string {
  if (!imageUrl) return content;
  return content
    .split('\n')
    .filter((line) => line.trim() !== imageUrl && line.trim() !== '📷 Foto')
    .join('\n')
    .trim();
}

export default function ChatWindow({
  conversationId,
  onClose,
  onMinimize,
  context,
}: ChatWindowProps) {
  const { messages, loading, sending, sendMessage, sendImage, user } = useChat(conversationId);
  const { user: authUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [resolved, setResolved] = useState<ChatOpenContext | null>(context || null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const prefilledRef = useRef(false);

  useEffect(() => {
    setResolved((prev) => ({ ...prev, ...context }));
  }, [context]);

  useEffect(() => {
    if (context?.initialMessage && !prefilledRef.current) {
      setInputValue(context.initialMessage);
      prefilledRef.current = true;
    }
  }, [context?.initialMessage]);

  // Fallback: load other user + listing if context incomplete
  useEffect(() => {
    if (!supabase || !authUser || !conversationId) return;
    const needsUser = !context?.otherUser?.nombre && !context?.otherUser?.avatar_url;
    const needsListing = !context?.adisoTitle && !context?.adisoImageUrl;
    if (!needsUser && !needsListing) return;

    let cancelled = false;
    (async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('participants, adiso_id')
        .eq('id', conversationId)
        .maybeSingle();
      if (!conv || cancelled) return;

      const otherId = (conv.participants as string[]).find((id) => id !== authUser.id);
      let otherUser = context?.otherUser;
      if (needsUser && otherId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, nombre, avatar_url')
          .eq('id', otherId)
          .maybeSingle();
        if (profile) {
          otherUser = {
            id: profile.id,
            nombre: profile.nombre || undefined,
            avatar_url: profile.avatar_url || undefined,
          };
        }
      }

      let listingFields: Partial<ChatOpenContext> = {};
      const adisoId = (conv.adiso_id as string) || context?.adisoId;
      if (needsListing && adisoId) {
        const map = await fetchListingPreviews(supabase, [adisoId]);
        const listing = map.get(adisoId);
        if (listing) {
          listingFields = {
            adisoId,
            adisoTitle: listing.title,
            adisoImageUrl: listing.imageUrl,
            adisoPriceLabel: listing.priceLabel,
          };
        }
      }

      if (!cancelled) {
        setResolved((prev) => ({
          ...prev,
          ...listingFields,
          otherUser: otherUser || prev?.otherUser,
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, authUser, context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFile) {
      const file = pendingFile;
      const caption = inputValue.trim();
      setPendingFile(null);
      setImagePreview(null);
      setInputValue('');
      await sendImage(file, caption || undefined);
      return;
    }
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  const onPickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setPendingFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const clearPendingImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setPendingFile(null);
  };

  const displayName =
    resolved?.otherUser?.nombre ||
    resolved?.adisoTitle ||
    'Chat';
  const subtitle = resolved?.adisoTitle && resolved?.otherUser?.nombre
    ? resolved.adisoTitle
    : 'Buscadis';
  const matchPct = resolved?.matchScore != null ? Math.round(resolved.matchScore * 100) : null;
  const listingHref = resolved?.adisoId ? `/?adiso=${resolved.adisoId}` : null;

  return (
    <div className="flex h-[min(520px,70vh)] w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-t-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[var(--popover-shadow)] animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-[var(--brand-blue)] px-3 py-2.5 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/25">
            {resolved?.otherUser?.avatar_url ? (
              <img
                src={resolved.otherUser.avatar_url}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <IconUser size={18} color="white" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold leading-tight">{displayName}</h4>
            <p className="truncate text-[11px] text-white/80">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {matchPct != null && matchPct >= 40 && (
            <span className="mr-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
              {matchPct}%
            </span>
          )}
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="rounded-full p-1.5 hover:bg-white/20"
              aria-label="Minimizar"
            >
              —
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/20"
            aria-label="Cerrar chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Listing strip */}
      {resolved?.adisoId && (resolved.adisoTitle || resolved.adisoImageUrl) && (
        <Link
          href={listingHref || '/'}
          className="flex items-center gap-2.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 transition-colors hover:bg-[var(--hover-bg)]"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
            {resolved.adisoImageUrl ? (
              <img
                src={resolved.adisoImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-tertiary)]">
                Aviso
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-semibold text-[var(--text-primary)]">
              {resolved.adisoTitle}
            </p>
            {resolved.adisoPriceLabel && (
              <p className="text-[11px] font-bold text-[var(--brand-blue)]">
                {resolved.adisoPriceLabel}
              </p>
            )}
          </div>
        </Link>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto bg-[var(--bg-secondary)] px-3 py-3"
        ref={scrollRef}
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center p-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            <p>Escribe para empezar la conversación</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messages.map((msg) => {
              const isMe = user?.id === msg.sender_id;
              const isAuto =
                msg.message_kind === 'system_seller' ||
                Boolean((msg.metadata as { auto?: boolean } | undefined)?.auto);
              const imgUrl = messageImageUrl(msg);
              const text = messageTextWithoutImageUrl(msg.content || '', imgUrl);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${
                    msg.pending ? 'opacity-80' : ''
                  } ${msg.failed ? 'opacity-60' : ''}`}
                >
                  {isAuto && !isMe && (
                    <span className="mb-0.5 px-1 text-[10px] font-medium text-[var(--text-tertiary)]">
                      Respuesta automática del aviso
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] overflow-hidden rounded-2xl text-sm shadow-sm ${
                      isMe
                        ? 'rounded-br-md bg-[var(--brand-blue)] text-white'
                        : 'rounded-bl-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]'
                    }`}
                  >
                    {imgUrl && (
                      <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={imgUrl}
                          alt=""
                          className="max-h-52 w-full object-cover"
                        />
                      </a>
                    )}
                    {text ? (
                      <p className={`whitespace-pre-wrap break-words px-3 py-2 ${imgUrl ? 'pt-1.5' : ''}`}>
                        {text}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={`mt-0.5 flex items-center gap-1 px-1 text-[10px] text-[var(--text-tertiary)] ${
                      isMe ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span>
                      {msg.failed
                        ? 'No se envió'
                        : msg.pending
                          ? 'Enviando…'
                          : formatTimeAgo(msg.created_at)}
                    </span>
                    {isMe && !msg.failed && !msg.pending && (
                      <span
                        className={msg.read ? 'text-[var(--brand-blue)]' : ''}
                        title={msg.read ? 'Leído' : 'Enviado'}
                      >
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      {imagePreview && (
        <div className="flex items-center gap-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2">
          <img src={imagePreview} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <button
            type="button"
            onClick={clearPendingImage}
            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Quitar foto
          </button>
        </div>
      )}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-1.5 border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickImage}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--brand-blue)] disabled:opacity-50"
          aria-label="Adjuntar foto"
          title="Adjuntar foto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={pendingFile ? 'Añade un texto…' : 'Escribe un mensaje…'}
          className="min-w-0 flex-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.25)]"
        />
        <button
          type="submit"
          disabled={sending || (!inputValue.trim() && !pendingFile)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white transition-opacity hover:brightness-105 disabled:opacity-40"
          aria-label="Enviar"
        >
          <IconSend size={14} />
        </button>
      </form>
    </div>
  );
}
