'use client';

import { useRef, type KeyboardEvent } from 'react';
import { IconImage, IconMegaphone, IconSend } from '@/components/Icons';

interface PublishChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  compact?: boolean;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  onAttachImage?: () => void;
  imageAttached?: boolean;
  imageUploading?: boolean;
}

/** Input conversacional para publicar — sin lógica de búsqueda del marketplace */
export default function PublishChatInput({
  value,
  onChange,
  onSend,
  compact = false,
  disabled = false,
  sending = false,
  placeholder = 'Escribe tu mensaje…',
  onAttachImage,
  imageAttached = false,
  imageUploading = false,
}: PublishChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !sending && hasText) onSend();
    }
  };

  return (
    <div
      className={`flex items-end gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] ${
        compact ? 'px-2 py-1.5' : 'px-3 py-2'
      }`}
    >
      <span className="mb-1 shrink-0 text-[var(--brand-yellow)]" aria-hidden>
        <IconMegaphone size={compact ? 16 : 18} color="var(--brand-yellow)" />
      </span>
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        placeholder={placeholder}
        className="max-h-32 min-h-[36px] flex-1 resize-none border-none bg-transparent py-1.5 text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
      />
      {onAttachImage && (
        <button
          type="button"
          onClick={onAttachImage}
          disabled={imageUploading}
          aria-label="Adjuntar foto"
          className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-[var(--hover-bg)] ${
            imageAttached ? 'text-[var(--brand-blue)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          <IconImage size={18} />
        </button>
      )}
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || sending || !hasText}
        aria-label="Enviar"
        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-[var(--text-primary)] transition-opacity disabled:opacity-40"
      >
        <IconSend size={16} />
      </button>
    </div>
  );
}
