'use client';

import { FaTimes } from 'react-icons/fa';

interface PublishImagePreviewProps {
  url: string;
  onRemove: () => void;
  size?: 'sm' | 'md';
}

export default function PublishImagePreview({ url, onRemove, size = 'md' }: PublishImagePreviewProps) {
  const dim = size === 'sm' ? 'w-14 h-14' : 'w-20 h-20';
  return (
    <div className="relative inline-block shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Vista previa"
        className={`${dim} rounded-xl object-cover border border-[var(--border-color)] shadow-sm`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-md hover:scale-105 transition-transform"
        aria-label="Quitar foto"
      >
        <FaTimes size={10} />
      </button>
    </div>
  );
}
