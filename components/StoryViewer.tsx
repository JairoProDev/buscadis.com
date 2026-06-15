'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { trackViewHistory } from '@/lib/profile/view-history-client';
import { useUI } from '@/contexts/UIContext';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { StoryGroup, STORY_TIERS, Adiso } from '@/types';
import {
  registerStoryView,
  markStorySeen,
  recordStoryInteraction,
} from '@/lib/stories';
import { getAdisoById } from '@/lib/storage';
import { getWhatsAppUrl } from '@/lib/utils';
import {
  IconClose,
  IconSend,
  IconShareAlt,
  IconWhatsApp,
  IconHeart,
  IconHeartOutline,
  IconExternalLink,
  IconChatbot,
  IconChevronDown,
} from '@/components/Icons';

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;
const QUICK_REACTIONS = ['❤️', '🔥', '👏', '😮'] as const;
const BOTTOM_CHROME_PX = 132;

function formatStoryAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  return `${Math.floor(hrs / 24)} d`;
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface RailActionProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

function RailAction({ label, onClick, disabled, active, children }: RailActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 disabled:opacity-40 transition-transform active:scale-90"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md ${
          active ? 'bg-red-500/90 text-white' : 'bg-black/45 text-white'
        }`}
      >
        {children}
      </span>
      <span className="max-w-[52px] truncate text-[10px] font-medium text-white drop-shadow-md">
        {label}
      </span>
    </button>
  );
}

export default function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const { user, session } = useAuth();
  const { openAuthModal, openChat } = useUI();
  const { isFavorite, toggleFavorite } = useFavoritos();

  const [pos, setPos] = useState({ g: initialGroupIndex, s: 0 });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [linkedAdiso, setLinkedAdiso] = useState<Adiso | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const replyRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const group = groups[pos.g];
  const story = group?.stories[pos.s];
  const creatorName = group?.vendedor?.nombre || 'Usuario';
  const storyIndex = pos.s + 1;
  const storyTotal = group?.stories.length ?? 0;
  const hasAdiso = Boolean(story?.adiso_id || story?.cta_url);
  const hasWhatsApp = Boolean(linkedAdiso?.contacto);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const goNext = useCallback(() => {
    const grp = groups[pos.g];
    if (pos.s + 1 < grp.stories.length) {
      setPos({ g: pos.g, s: pos.s + 1 });
    } else if (pos.g + 1 < groups.length) {
      setPos({ g: pos.g + 1, s: 0 });
    } else {
      onClose();
    }
  }, [groups, onClose, pos.g, pos.s]);

  const goPrev = useCallback(() => {
    if (pos.s > 0) {
      setPos({ g: pos.g, s: pos.s - 1 });
    } else if (pos.g > 0) {
      setPos({ g: pos.g - 1, s: groups[pos.g - 1].stories.length - 1 });
    }
  }, [groups, pos.g, pos.s]);

  useEffect(() => {
    if (!story) return;
    markStorySeen(story.id);
    if (user?.id) registerStoryView(story.id, user.id);
    recordStoryInteraction(story.id, 'view', session?.access_token);
    trackViewHistory({ storyId: story.id, source: 'story' }, session?.access_token);
    if (story.adiso_id) {
      trackViewHistory({ adisoId: story.adiso_id, source: 'story' }, session?.access_token);
    }
    setSheetOpen(false);
    setReplyText('');
    setFavorited(story.adiso_id ? isFavorite(story.adiso_id) : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, user?.id]);

  useEffect(() => {
    if (!story?.adiso_id) {
      setLinkedAdiso(null);
      return;
    }
    getAdisoById(story.adiso_id).then(setLinkedAdiso);
  }, [story?.adiso_id]);

  useEffect(() => {
    if (!story || story.media_type === 'video' || paused || sheetOpen) return;

    setProgress(0);
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) goNext();
      else rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [goNext, paused, pos.g, pos.s, sheetOpen, story]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  useEffect(() => {
    if (story?.media_type === 'video' && videoRef.current) {
      if (paused || sheetOpen) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [paused, sheetOpen, story]);

  const requireAuth = () => {
    if (!user) {
      openAuthModal();
      return false;
    }
    return true;
  };

  const sendMessage = async (text: string, openChatAfter: boolean) => {
    if (!requireAuth() || !story || !text.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          recipientId: story.user_id,
          storyId: story.id,
          initialMessage: text.trim(),
        }),
      });
      const data = (await res.json()) as { conversationId?: string };
      if (data.conversationId) {
        await recordStoryInteraction(story.id, 'chat_open', session?.access_token);
        if (openChatAfter) openChat(data.conversationId);
        else showToast('Mensaje enviado');
      }
    } finally {
      setSending(false);
    }
  };

  const handleReplySubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = replyText.trim();
    if (!text) return;
    void sendMessage(text, true);
    setReplyText('');
  };

  const handleQuickReaction = (emoji: string) => {
    void sendMessage(emoji, false);
  };

  const triggerHeartBurst = () => {
    setHeartBurst(true);
    window.setTimeout(() => setHeartBurst(false), 900);
  };

  const handleFavorite = async () => {
    if (!requireAuth() || !story) return;
    triggerHeartBurst();
    if (story.adiso_id) {
      const nowFav = await toggleFavorite(story.adiso_id);
      setFavorited(nowFav);
    } else {
      const result = await recordStoryInteraction(story.id, 'favorite', session?.access_token, {
        toggleFavorite: true,
      });
      if (result && 'favorited' in result) setFavorited(Boolean(result.favorited));
    }
  };

  const handleWhatsApp = async () => {
    if (!linkedAdiso?.contacto || !story) return;
    await recordStoryInteraction(story.id, 'whatsapp_click', session?.access_token);
    window.open(
      getWhatsAppUrl(linkedAdiso.contacto, linkedAdiso.titulo, linkedAdiso.categoria, linkedAdiso.id),
      '_blank'
    );
  };

  const handleViewAdiso = async () => {
    if (!story) return;
    await recordStoryInteraction(story.id, 'cta_click', session?.access_token);
    const url = story.cta_url || (story.adiso_id ? `/?adiso=${story.adiso_id}` : null);
    if (url) window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (!story) return;
    await recordStoryInteraction(story.id, 'share', session?.access_token);
    const url = `${window.location.origin}/?story=${story.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: story.caption || `Historia de ${creatorName}`, url });
        return;
      } catch {
        // cancelled
      }
    }
    await navigator.clipboard.writeText(url);
    showToast('Enlace copiado');
  };

  const handleMediaTap = (side: 'left' | 'right') => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      void handleFavorite();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    window.setTimeout(() => {
      if (lastTapRef.current === now) {
        if (side === 'left') goPrev();
        else goNext();
      }
    }, 280);
  };

  if (!story || !group) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10002] bg-black flex items-center justify-center">
      <motion.div
        className="relative w-full h-full max-w-[480px] mx-auto select-none"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90) onClose();
          else if (info.offset.y < -70) setSheetOpen(true);
        }}
      >
        {/* Progreso por segmento (IG/WA) */}
        <div className="absolute top-0 left-0 right-0 z-30 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/35 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < pos.s ? '100%' : i === pos.s ? `${progress * 100}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-[max(1.25rem,env(safe-area-inset-top))] left-0 right-0 z-30 px-3 pt-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-black/35 py-1 pl-1 pr-3 backdrop-blur-md">
            <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white/20">
              {group.vendedor?.avatarUrl ? (
                <img src={group.vendedor.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {creatorName.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-white">{creatorName}</span>
                {story.promotion_tier !== 'gratis' && (
                  <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-[var(--brand-yellow)] text-black">
                    {STORY_TIERS[story.promotion_tier].nombre}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/75">
                <span>{formatStoryAge(story.created_at)}</span>
                <span aria-hidden>·</span>
                <span className="font-medium text-white/90">
                  {storyIndex}/{storyTotal}
                </span>
                {story.view_count > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{formatViewCount(story.view_count)} vistas</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
            aria-label="Compartir"
          >
            <IconShareAlt size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
            aria-label="Cerrar"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Media */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {story.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={story.media_url}
              className="h-full w-full object-contain"
              autoPlay
              playsInline
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              onEnded={goNext}
            />
          ) : (
            <img src={story.media_url} alt={story.caption || ''} className="h-full w-full object-contain" />
          )}
        </div>

        {/* Double-tap heart (IG) */}
        {heartBurst && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="story-heart-burst text-7xl">❤️</span>
          </div>
        )}

        {/* Zonas táctiles: no cubren controles inferiores ni rail derecho */}
        <div
          className="absolute left-0 right-14 z-10 flex"
          style={{ top: 72, bottom: BOTTOM_CHROME_PX }}
        >
          <button
            type="button"
            aria-label="Historia anterior"
            className="w-[38%] bg-transparent"
            onClick={() => handleMediaTap('left')}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          />
          <button
            type="button"
            aria-label="Siguiente historia"
            className="flex-1 bg-transparent"
            onClick={() => handleMediaTap('right')}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          />
        </div>

        {/* Caption (IG/TikTok — abajo a la izquierda) */}
        {(story.caption || hasAdiso) && (
          <div
            className="absolute left-3 z-25 max-w-[calc(100%-5rem)] pointer-events-none"
            style={{ bottom: BOTTOM_CHROME_PX + 8 }}
          >
            {story.caption && (
              <p className="text-sm font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-2 mb-1">
                {story.caption}
              </p>
            )}
            {hasAdiso && linkedAdiso && (
              <p className="text-xs text-white/80 drop-shadow-md line-clamp-1">
                {linkedAdiso.titulo}
              </p>
            )}
          </div>
        )}

        {/* Rail derecho (TikTok) */}
        <div
          className="absolute right-2 z-30 flex flex-col items-center gap-4"
          style={{ bottom: BOTTOM_CHROME_PX + 12 }}
        >
          {hasAdiso && (
            <RailAction label="Ver aviso" onClick={handleViewAdiso}>
              <IconExternalLink size={20} />
            </RailAction>
          )}
          {hasWhatsApp && (
            <RailAction label="WhatsApp" onClick={handleWhatsApp}>
              <IconWhatsApp size={22} />
            </RailAction>
          )}
          <RailAction label="Me gusta" onClick={() => void handleFavorite()} active={favorited}>
            {favorited ? <IconHeart size={20} /> : <IconHeartOutline size={20} />}
          </RailAction>
          <RailAction label="Compartir" onClick={() => void handleShare()}>
            <IconShareAlt size={18} />
          </RailAction>
        </div>

        {/* Swipe up pill (TikTok) — solo si hay aviso */}
        {hasAdiso && !sheetOpen && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="absolute left-1/2 z-25 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
            style={{ bottom: BOTTOM_CHROME_PX - 4 }}
          >
            Ver publicación
            <IconChevronDown size={12} className="rotate-180" />
          </button>
        )}

        {/* Barra inferior: reacciones + reply (IG/WA) */}
        <div
          className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent"
        >
          <div className="flex items-center gap-2 mb-2 pl-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReaction(emoji)}
                disabled={sending}
                className="text-xl leading-none transition-transform active:scale-125 disabled:opacity-50"
                aria-label={`Reaccionar ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleReplySubmit} className="flex items-center gap-2">
            <input
              ref={replyRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              placeholder={`Mensaje a ${creatorName.split(' ')[0]}…`}
              maxLength={500}
              className="min-w-0 flex-1 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/55 outline-none focus:border-white/50 focus:bg-white/20 backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white disabled:opacity-40 transition-opacity"
              aria-label="Enviar mensaje"
            >
              <IconSend size={16} />
            </button>
          </form>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm text-white backdrop-blur-md"
              style={{ bottom: BOTTOM_CHROME_PX + 24 }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sheet detalle aviso (swipe up) */}
        <AnimatePresence>
          {sheetOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/50"
                onClick={() => setSheetOpen(false)}
                aria-label="Cerrar detalle"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 80) setSheetOpen(false);
                }}
                className="absolute bottom-0 left-0 right-0 z-50 max-h-[72%] overflow-hidden rounded-t-2xl bg-[var(--bg-primary)] shadow-2xl"
              >
                <div className="mx-auto mt-2 mb-3 h-1 w-10 rounded-full bg-[var(--border-color)]" />

                <div className="overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[calc(72vh-2rem)]">
                  {linkedAdiso?.imagenUrl || linkedAdiso?.imagenesUrls?.[0] ? (
                    <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl bg-[var(--bg-tertiary)]">
                      <img
                        src={linkedAdiso.imagenesUrls?.[0] || linkedAdiso.imagenUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <h3 className="text-lg font-bold text-[var(--text-primary)] leading-snug">
                    {linkedAdiso?.titulo || story.caption || 'Publicación'}
                  </h3>

                  {linkedAdiso?.precio != null && (
                    <p className="mt-1 text-lg font-semibold text-[var(--brand-blue)]">
                      S/ {linkedAdiso.precio}
                    </p>
                  )}

                  {linkedAdiso?.descripcion && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-4">
                      {linkedAdiso.descripcion}
                    </p>
                  )}

                  <div className="mt-4 flex flex-col gap-2">
                    {hasAdiso && (
                      <button
                        type="button"
                        onClick={handleViewAdiso}
                        className="w-full rounded-xl bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white"
                      >
                        Ver aviso completo
                      </button>
                    )}
                    <div className={`grid gap-2 ${hasWhatsApp ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {hasWhatsApp && (
                        <button
                          type="button"
                          onClick={handleWhatsApp}
                          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white"
                        >
                          <IconWhatsApp size={18} />
                          WhatsApp
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          replyRef.current?.focus();
                          setSheetOpen(false);
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] py-3 text-sm font-semibold text-[var(--text-primary)]"
                      >
                        <IconChatbot size={18} />
                        Escribir mensaje
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
}
