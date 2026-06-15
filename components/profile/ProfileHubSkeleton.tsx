'use client';

/** Skeleton con la misma estructura que ProfileHubShell para evitar hydration mismatch. */
export default function ProfileHubSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5" aria-busy="true" aria-label="Cargando perfil">
      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm">
        <div className="h-24 bg-gradient-to-br from-[var(--brand-blue)]/30 via-[#3b82f6]/20 to-transparent" />
        <div className="relative px-5 pb-5">
          <div className="-mt-12 mb-4 flex items-end justify-between gap-3">
            <div className="skeleton-shimmer h-[88px] w-[88px] rounded-full" />
            <div className="flex gap-2 pb-1">
              <div className="skeleton-shimmer h-8 w-20 rounded-full" />
              <div className="skeleton-shimmer h-8 w-14 rounded-full" />
            </div>
          </div>
          <div className="skeleton-shimmer mb-2 h-6 w-48 rounded-lg" />
          <div className="skeleton-shimmer mb-3 h-4 w-56 rounded-lg" />
          <div className="skeleton-shimmer h-5 w-28 rounded-lg" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-shimmer h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="skeleton-shimmer min-h-[320px] rounded-2xl" />
    </div>
  );
}
