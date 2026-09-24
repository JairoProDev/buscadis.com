'use client';

import { forwardRef } from 'react';
import { IconTrash } from '@/components/Icons';
import { publishUi } from '@/lib/bs-tokens';

const CardDeleteZone = forwardRef<HTMLDivElement, { active?: boolean; hot?: boolean }>(
  function CardDeleteZone({ active, hot }, ref) {
    if (!active) return null;
    return (
      <div
        ref={ref}
        className={`pointer-events-none absolute right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border-2 transition-all ${
          hot
            ? 'scale-110 border-red-500 bg-red-500/35'
            : 'border-red-400/70 bg-red-500/20'
        }`}
        aria-hidden
      >
        <IconTrash size={18} color={hot ? publishUi.onDark : publishUi.deleteIcon} />
      </div>
    );
  },
);

export default CardDeleteZone;

function hitTrash(clientX: number, clientY: number, el: HTMLElement | null) {
  if (!el) return false;
  const pad = 10;
  const r = el.getBoundingClientRect();
  return (
    clientX >= r.left - pad &&
    clientX <= r.right + pad &&
    clientY >= r.top - pad &&
    clientY <= r.bottom + pad
  );
}

export { hitTrash };
