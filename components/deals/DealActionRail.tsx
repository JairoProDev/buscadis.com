'use client';

import { DealClip } from '@/types';
import { formatCount } from '@/lib/deals/commerce-overlay';
import {
  IconHeart,
  IconHeartOutline,
  IconShareAlt,
  IconWhatsApp,
} from '@/components/Icons';

interface DealActionRailProps {
  clip: DealClip;
  muted: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onWhatsApp?: () => void;
  onComments: () => void;
  onMore: () => void;
  onToggleMute: () => void;
  commentCount?: number;
}

function RailBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md ${
          active ? 'bg-red-500/90' : 'bg-black/40'
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

export default function DealActionRail({
  clip,
  muted,
  onLike,
  onSave,
  onShare,
  onWhatsApp,
  onComments,
  onMore,
  onToggleMute,
  commentCount = 0,
}: DealActionRailProps) {
  return (
    <div className="absolute bottom-28 right-3 z-30 flex flex-col items-center gap-4">
      <RailBtn label={formatCount(clip.like_count)} onClick={onLike} active={clip.liked}>
        {clip.liked ? (
          <IconHeart size={22} color="#fff" />
        ) : (
          <IconHeartOutline size={22} color="#fff" />
        )}
      </RailBtn>

      <RailBtn label={commentCount > 0 ? String(commentCount) : 'Comentar'} onClick={onComments}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </RailBtn>

      <RailBtn label={formatCount(clip.save_count)} onClick={onSave} active={clip.saved}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill={clip.saved ? '#fbbf24' : 'none'} stroke="#fff" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </RailBtn>

      {onWhatsApp && (
        <RailBtn label="WhatsApp" onClick={onWhatsApp}>
          <IconWhatsApp size={22} color="#fff" />
        </RailBtn>
      )}

      <RailBtn label="Compartir" onClick={onShare}>
        <IconShareAlt size={20} color="#fff" />
      </RailBtn>

      <RailBtn label={muted ? 'Sonido' : 'Silencio'} onClick={onToggleMute}>
        <span className="text-lg">{muted ? '🔇' : '🔊'}</span>
      </RailBtn>

      <RailBtn label="Más" onClick={onMore}>
        <span className="text-xl font-bold text-white">⋯</span>
      </RailBtn>
    </div>
  );
}
