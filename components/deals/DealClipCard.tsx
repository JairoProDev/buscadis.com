'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DealClip } from '@/types';
import DealClipOverlay from './DealClipOverlay';
import DealActionRail from './DealActionRail';
import DealCommentsSheet from './DealCommentsSheet';
import { interactDealClip, followCreator, getDealShareUrl } from '@/lib/deals/client';
import { useAuth } from '@/hooks/useAuth';
import { getAdisoById } from '@/lib/storage';
import { getWhatsAppUrl } from '@/lib/utils';
import { Adiso } from '@/types';
import ModalAdiso from '@/components/ModalAdiso';

const MUTE_KEY = 'deals_mute';

interface DealClipCardProps {
  clip: DealClip;
  isActive: boolean;
  onUpdate: (patch: Partial<DealClip>) => void;
  onNotInterested?: () => void;
}

export default function DealClipCard({
  clip,
  isActive,
  onUpdate,
  onNotInterested,
}: DealClipCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { session } = useAuth();
  const token = session?.access_token;
  const [muted, setMuted] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [adisoOpen, setAdisoOpen] = useState<Adiso | null>(null);
  const [likeBurst, setLikeBurst] = useState(false);
  const lastTap = useRef(0);
  const viewSent = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMuted(localStorage.getItem(MUTE_KEY) !== 'false');
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || clip.media_type !== 'video') return;

    if (isActive) {
      v.play().catch(() => {});
      if (!viewSent.current) {
        viewSent.current = true;
        interactDealClip(clip.id, 'view', { token, watchTimeMs: 0 }).catch(() => {});
      }
    } else {
      v.pause();
    }
  }, [isActive, clip.id, clip.media_type, token]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, next ? 'true' : 'false');
    if (videoRef.current) videoRef.current.muted = next;
  };

  const handleLike = useCallback(async () => {
    if (!token) return;
    try {
      const res = await interactDealClip(clip.id, 'like', { token });
      onUpdate({
        liked: res.liked,
        like_count: clip.like_count + (res.liked ? 1 : -1),
      });
    } catch {
      // ignore
    }
  }, [clip.id, clip.like_count, onUpdate, token]);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setLikeBurst(true);
      setTimeout(() => setLikeBurst(false), 800);
      if (!clip.liked) handleLike();
    }
    lastTap.current = now;
  };

  const handleSave = async () => {
    if (!token) return;
    try {
      const res = await interactDealClip(clip.id, 'save', { token });
      onUpdate({
        saved: res.saved,
        save_count: clip.save_count + (res.saved ? 1 : -1),
      });
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    const url = getDealShareUrl(clip.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: clip.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      await interactDealClip(clip.id, 'share', { token });
      onUpdate({ share_count: clip.share_count + 1 });
    } catch {
      // ignore
    }
  };

  const openAdiso = async () => {
    if (!clip.adiso_id) return;
    await interactDealClip(clip.id, 'cta_click', { token });
    onUpdate({ cta_click_count: clip.cta_click_count + 1 });
    const adiso = await getAdisoById(clip.adiso_id);
    if (adiso) setAdisoOpen(adiso);
  };

  const handleWhatsApp = async () => {
    if (!clip.adiso_id) return;
    const adiso = await getAdisoById(clip.adiso_id);
    if (!adiso?.contacto) return;
    await interactDealClip(clip.id, 'whatsapp_click', { token });
    window.open(getWhatsAppUrl(adiso.contacto, clip.title, adiso.categoria, adiso.id), '_blank');
  };

  const handleFollow = async () => {
    if (!token) return;
    try {
      const res = await followCreator(clip.author_user_id, token);
      onUpdate({ following: res.following });
    } catch {
      // ignore
    }
  };

  const handleMore = async () => {
    const action = window.prompt('Escribe: reportar o no-interesa');
    if (action === 'reportar') {
      await interactDealClip(clip.id, 'report', { token, reason: 'user_report' });
    } else if (action === 'no-interesa') {
      await interactDealClip(clip.id, 'not_interested', { token });
      onNotInterested?.();
    }
  };

  return (
    <div
      className="relative h-full w-full snap-start snap-always overflow-hidden bg-black"
      onClick={handleDoubleTap}
    >
      {clip.media_type === 'video' ? (
        <video
          ref={videoRef}
          src={clip.media_url}
          poster={clip.poster_url}
          className="h-full w-full object-cover"
          loop
          playsInline
          muted={muted}
        />
      ) : (
        <div className="deal-ken-burns h-full w-full">
          <img
            src={clip.media_url}
            alt={clip.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <DealClipOverlay
        clip={clip}
        expanded={expanded}
        onToggleExpand={() => setExpanded((e) => !e)}
        onCta={openAdiso}
        onFollow={token ? handleFollow : undefined}
      />

      <DealActionRail
        clip={clip}
        muted={muted}
        onLike={handleLike}
        onSave={handleSave}
        onShare={handleShare}
        onWhatsApp={clip.adiso_id ? handleWhatsApp : undefined}
        onComments={() => setShowComments(true)}
        onMore={handleMore}
        onToggleMute={toggleMute}
        commentCount={commentCount}
      />

      <AnimatePresence>
        {likeBurst && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <IconHeartBurst />
          </motion.div>
        )}
      </AnimatePresence>

      <DealCommentsSheet
        open={showComments}
        clipId={clip.id}
        onClose={() => setShowComments(false)}
        onCountChange={setCommentCount}
      />

      {adisoOpen && (
        <ModalAdiso
          adiso={adisoOpen}
          onCerrar={() => setAdisoOpen(null)}
          onAnterior={() => {}}
          onSiguiente={() => {}}
          puedeAnterior={false}
          puedeSiguiente={false}
        />
      )}

      <style jsx>{`
        .deal-ken-burns img {
          animation: kenburns 12s ease-in-out infinite alternate;
        }
        @keyframes kenburns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.12);
          }
        }
      `}</style>
    </div>
  );
}

function IconHeartBurst() {
  return (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="#ef4444">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
