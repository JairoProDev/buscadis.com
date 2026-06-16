'use client';

interface DealLiveBadgeProps {
  title?: string;
  onClick?: () => void;
}

export default function DealLiveBadge({ title, onClick }: DealLiveBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold uppercase text-white shadow-lg backdrop-blur"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      EN VIVO
      {title && <span className="font-medium normal-case opacity-90">· {title}</span>}
    </button>
  );
}
