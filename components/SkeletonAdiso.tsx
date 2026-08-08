'use client';

import React from 'react';

/**
 * Componente Skeleton para mostrar mientras se cargan los adisos
 * Mejora la UX con placeholders animados
 */
export default function SkeletonAdiso() {
  return (
    <div
      className="animate-pulse flex flex-col gap-3 rounded-xl border p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div
        className="skeleton-shimmer h-5 w-[70%]"
      />

      <div className="flex flex-col gap-2">
        <div className="skeleton-shimmer h-3.5 w-full" />
        <div className="skeleton-shimmer h-3.5 w-[85%]" />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="skeleton-shimmer h-3 w-[40%]" />
        <div className="skeleton-shimmer h-3 w-[30%]" />
      </div>
    </div>
  );
}

/**
 * Componente para mostrar múltiples skeletons en la grilla
 * Optimizado para coincidir con el tamaño de los adisos
 */
export function SkeletonAdisosGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="col-span-1 row-span-1">
          <SkeletonAdiso />
        </div>
      ))}
    </>
  );
}
