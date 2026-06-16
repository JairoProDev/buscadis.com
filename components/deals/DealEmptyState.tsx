'use client';

interface DealEmptyStateProps {
  onCreate: () => void;
}

export default function DealEmptyState({ onCreate }: DealEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-black px-8 text-center text-white">
      <p className="text-4xl">🛍️</p>
      <h2 className="text-xl font-bold">Aún no hay Deals</h2>
      <p className="text-sm text-white/70">
        Sé el primero en publicar una promo en video. Los consumidores entran buscando ofertas — dales algo que
        les encante.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-xl bg-[var(--brand-yellow)] px-6 py-3 font-bold text-black"
      >
        Crear mi primer Deal
      </button>
    </div>
  );
}
