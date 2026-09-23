'use client';

import type { ReactNode } from 'react';

/** Miniatura: el flyer se dibuja grande y se reduce, así esquinas y texto quedan en proporción. */
export default function TemplateThumb({
  selected,
  children,
}: {
  selected?: boolean;
  children: ReactNode;
}) {
  const size = 72;
  const source = 320;
  const radius = Math.round(size * 0.06);

  return (
    <div
      className={`relative shrink-0 overflow-hidden ring-2 ${
        selected ? 'ring-[var(--brand-blue)]' : 'ring-[var(--border-color)]'
      }`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0"
        style={{
          width: source,
          height: source,
          transform: `scale(${size / source})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
