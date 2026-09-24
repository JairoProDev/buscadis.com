'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconHeartOutline,
  IconEyeOff,
  IconShare,
  IconHeart,
} from '@/components/Icons';
import type { AdisoCardActionId } from '@/hooks/useAdisoCardActions';

export type LongPressRadialAction = 'see_more' | 'see_less' | 'save' | 'share';

const ACTIONS: {
  id: LongPressRadialAction;
  label: string;
  angleDeg: number;
  Icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { id: 'save', label: 'Guardar', angleDeg: 200, Icon: IconHeartOutline },
  { id: 'share', label: 'Compartir', angleDeg: 250, Icon: IconShare },
  { id: 'see_more', label: 'Ver más', angleDeg: 310, Icon: IconHeart },
  { id: 'see_less', label: 'Ver menos', angleDeg: 20, Icon: IconEyeOff },
];

const RADIUS = 88;

interface AdisoCardLongPressMenuProps {
  active: boolean;
  centerX: number;
  centerY: number;
  highlighted: LongPressRadialAction | null;
  isSaved: boolean;
  onHighlight: (id: LongPressRadialAction | null) => void;
  onCommit: (id: LongPressRadialAction) => void;
  onCancel: () => void;
}

export default function AdisoCardLongPressMenu({
  active,
  centerX,
  centerY,
  highlighted,
  isSaved,
  onHighlight,
  onCommit,
  onCancel,
}: AdisoCardLongPressMenuProps) {
  useEffect(() => {
    if (!active) return;
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            className="fixed inset-0 z-[190] bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerUp={() => {
              if (highlighted) onCommit(highlighted);
              else onCancel();
            }}
          />
          <div className="pointer-events-none fixed inset-0 z-[191]" aria-hidden>
            <motion.div
              className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25 bg-white/10 backdrop-blur-sm"
              style={{ left: centerX, top: centerY }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            />
            {ACTIONS.map((action) => {
              const rad = (action.angleDeg * Math.PI) / 180;
              const x = centerX + Math.cos(rad) * RADIUS;
              const y = centerY + Math.sin(rad) * RADIUS;
              const isHi = highlighted === action.id;
              const Icon = action.id === 'save' && isSaved ? IconHeart : action.Icon;
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  className={`pointer-events-auto absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border shadow-lg transition-colors ${
                    isHi
                      ? 'scale-110 border-white bg-white text-[#1c1c1e]'
                      : 'border-white/20 bg-[#2c2c2e]/95 text-white'
                  }`}
                  style={{ left: x, top: y }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isHi ? 1.12 : 1, opacity: 1 }}
                  onPointerEnter={() => onHighlight(action.id)}
                >
                  <Icon size={20} className={isHi && action.id === 'save' && isSaved ? 'text-red-500' : ''} />
                </motion.button>
              );
            })}
            {highlighted && (
              <motion.p
                className="absolute max-w-[160px] -translate-x-1/2 text-center text-sm font-semibold text-white drop-shadow-md"
                style={{ left: centerX, top: centerY + RADIUS + 36 }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {ACTIONS.find((a) => a.id === highlighted)?.label}
              </motion.p>
            )}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function pickRadialAction(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number
): LongPressRadialAction | null {
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const dist = Math.hypot(dx, dy);
  if (dist < 36) return null;
  if (dist > RADIUS + 48) return null;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  let best: LongPressRadialAction | null = null;
  let bestDiff = 999;
  for (const a of ACTIONS) {
    let diff = Math.abs(angle - a.angleDeg);
    if (diff > 180) diff = 360 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = a.id;
    }
  }
  return bestDiff <= 42 ? best : null;
}

export function mapRadialToCardAction(id: LongPressRadialAction): AdisoCardActionId {
  return id;
}
