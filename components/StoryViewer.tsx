'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { StoryGroup, STORY_TIERS } from '@/types';
import { registerStoryView, markStorySeen } from '@/lib/stories';
import { IconClose } from '@/components/Icons';

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export default function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const { user } = useAuth();
  const [pos, setPos] = useState({ g: initialGroupIndex, s: 0 });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  const group = groups[pos.g];
  const story = group?.stories[pos.s];

  const goNext = () => {
    const grp = groups[pos.g];
    if (pos.s + 1 < grp.stories.length) {
      setPos({ g: pos.g, s: pos.s + 1 });
    } else if (pos.g + 1 < groups.length) {
      setPos({ g: pos.g + 1, s: 0 });
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (pos.s > 0) {
      setPos({ g: pos.g, s: pos.s - 1 });
    } else if (pos.g > 0) {
      setPos({ g: pos.g - 1, s: groups[pos.g - 1].stories.length - 1 });
    }
  };

  // Marca la historia como vista y registra la vista en el servidor
  useEffect(() => {
    if (!story) return;
    markStorySeen(story.id);
    if (user?.id) registerStoryView(story.id, user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, user?.id]);

  // Avance automático para imágenes
  useEffect(() => {
    if (!story || story.media_type === 'video' || paused) return;

    setProgress(0);
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) {
        goNext();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.g, pos.s, paused]);

  useEffect(() => {
    if (!story) setProgress(0);
  }, [story]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  useEffect(() => {
    if (story?.media_type === 'video' && videoRef.current) {
      if (paused) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [paused, story]);

  if (!story || !group) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10002] bg-black flex items-center justify-center">
      <motion.div
        className="relative w-full h-full max-w-[480px] mx-auto"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
        }}
      >
        {/* Barras de progreso */}
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < pos.s ? '100%' : i === pos.s ? `${progress * 100}%` : '0%',
                  transition: i === pos.s ? 'none' : 'width 0.2s ease',
                }}
              />
            </div>
          ))}
        </div>

        {/* Encabezado */}
        <div className="absolute top-6 left-2 right-2 z-20 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {group.vendedor?.avatarUrl && (
                <img src={group.vendedor.avatarUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-sm font-semibold truncate drop-shadow">
              {group.vendedor?.nombre || 'Usuario'}
            </span>
            {story.promotion_tier !== 'gratis' && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--brand-yellow)] text-black flex-shrink-0">
                {STORY_TIERS[story.promotion_tier].nombre}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-white"
            aria-label="Cerrar historia"
          >
            <IconClose size={22} />
          </button>
        </div>

        {/* Media */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
          {story.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={story.media_url}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              onEnded={goNext}
            />
          ) : (
            <img src={story.media_url} alt={story.caption || ''} className="w-full h-full object-contain" />
          )}
        </div>

        {/* Pie / leyenda */}
        {story.caption && (
          <div className="absolute bottom-6 left-3 right-3 z-20 text-white text-sm bg-black/40 rounded-lg px-3 py-2">
            {story.caption}
          </div>
        )}

        {/* Zonas táctiles de navegación */}
        <div className="absolute inset-0 flex z-10">
          <div
            className="flex-1"
            onClick={goPrev}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
          />
          <div
            className="flex-1"
            onClick={goNext}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
          />
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
