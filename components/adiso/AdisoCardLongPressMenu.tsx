'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { OVERLAY_BACKDROP_Z, OVERLAY_SHEET_Z } from '@/lib/ui/overlay-layer';
import {
  IconHeartOutline,
  IconEyeOff,
  IconShare,
  IconHeart,
  IconSparkles,
} from '@/components/Icons';
import type { AdisoCardActionId } from '@/hooks/useAdisoCardActions';

export type LongPressRadialAction = 'see_more' | 'see_less' | 'save' | 'share';

/** Matemáticas de pantalla: 0° = derecha, 90° = abajo, 180° = izquierda, 270° = arriba */
export const RADIAL_ACTIONS: {
  id: LongPressRadialAction;
  label: string;
  angleDeg: number;
  Icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { id: 'share', label: 'Compartir', angleDeg: 270, Icon: IconShare },
  { id: 'see_more', label: 'Ver más así', angleDeg: 0, Icon: IconSparkles },
  { id: 'see_less', label: 'Ver menos', angleDeg: 90, Icon: IconEyeOff },
  { id: 'save', label: 'Guardar', angleDeg: 180, Icon: IconHeartOutline },
];

export const RADIAL_RADIUS_PX = 84;
const INNER_DEAD_ZONE = 22;
const ANGLE_TOLERANCE_DEG = 52;

interface AdisoCardLongPressMenuProps {
  active: boolean;
  centerX: number;
  centerY: number;
  highlighted: LongPressRadialAction | null;
  isSaved: boolean;
  onHighlight?: (id: LongPressRadialAction | null) => void;
  onCommit?: (id: LongPressRadialAction) => void;
  onCancel?: () => void;
  onGestureMove?: (clientX: number, clientY: number) => void;
  onGestureEnd?: (clientX: number, clientY: number) => void;
}

export default function AdisoCardLongPressMenu({
  active,
  centerX,
  centerY,
  highlighted,
  isSaved,
  onGestureMove,
  onGestureEnd,
}: AdisoCardLongPressMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [active]);

  if (!mounted) return null;

  const layer = (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            className="fixed inset-0 touch-none bg-black/45"
            style={{ zIndex: OVERLAY_BACKDROP_Z, pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* Captura el dedo: evita scroll del feed y alimenta la selección radial */}
          <div
            className="fixed inset-0 touch-none"
            style={{ zIndex: OVERLAY_SHEET_Z + 2, touchAction: 'none' }}
            onPointerMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onGestureMove?.(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onGestureEnd?.(e.clientX, e.clientY);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              onGestureEnd?.(e.clientX, e.clientY);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              const t = e.touches[0];
              if (t) onGestureMove?.(t.clientX, t.clientY);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              const t = e.changedTouches[0];
              if (t) onGestureEnd?.(t.clientX, t.clientY);
            }}
            onTouchCancel={(e) => {
              const t = e.changedTouches[0];
              if (t) onGestureEnd?.(t.clientX, t.clientY);
            }}
          />
          <div
            className="pointer-events-none fixed inset-0 touch-none"
            style={{ zIndex: OVERLAY_SHEET_Z }}
            aria-hidden
          >
            <motion.div
              className="absolute h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30 bg-white/12 backdrop-blur-sm"
              style={{ left: centerX, top: centerY }}
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            />
            {RADIAL_ACTIONS.map((action) => {
              const rad = (action.angleDeg * Math.PI) / 180;
              const x = centerX + Math.cos(rad) * RADIAL_RADIUS_PX;
              const y = centerY + Math.sin(rad) * RADIAL_RADIUS_PX;
              const isHi = highlighted === action.id;
              const Icon =
                action.id === 'save' && isSaved ? IconHeart : action.Icon;
              return (
                <motion.div
                  key={action.id}
                  className={`pointer-events-none absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border shadow-lg ${
                    isHi
                      ? 'scale-110 border-white bg-white text-[#1c1c1e]'
                      : 'scale-100 border-white/25 bg-[#2c2c2e]/95 text-white'
                  }`}
                  style={{ left: x, top: y }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isHi ? 1.14 : 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <Icon
                    size={20}
                    className={isHi && action.id === 'save' && isSaved ? 'text-red-500' : ''}
                  />
                </motion.div>
              );
            })}
            {highlighted && (
              <motion.p
                className="absolute max-w-[200px] -translate-x-1/2 text-center text-sm font-semibold text-white drop-shadow-md"
                style={{ left: centerX, top: centerY + RADIAL_RADIUS_PX + 28 }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {RADIAL_ACTIONS.find((a) => a.id === highlighted)?.label}
              </motion.p>
            )}
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(layer, document.body);
}

export function pickRadialAction(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number,
): LongPressRadialAction | null {
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const dist = Math.hypot(dx, dy);
  if (dist < INNER_DEAD_ZONE) return null;

  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  let best: LongPressRadialAction | null = null;
  let bestDiff = 999;
  for (const a of RADIAL_ACTIONS) {
    let diff = Math.abs(angle - a.angleDeg);
    if (diff > 180) diff = 360 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = a.id;
    }
  }
  return bestDiff <= ANGLE_TOLERANCE_DEG ? best : null;
}

export function mapRadialToCardAction(id: LongPressRadialAction): AdisoCardActionId {
  return id;
}
