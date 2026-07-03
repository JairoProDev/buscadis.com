'use client';

import { useRef, type KeyboardEvent } from 'react';
import { IconImage, IconSend } from '@/components/Icons';

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

/** Composer estilo asistente IA — limpio, sin iconografía de megáfono */
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
  const canSend = !disabled && !sending && (hasText || imageAttached);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div
      className={`publish-composer flex items-end gap-1.5 rounded-[1.25rem] border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow focus-within:border-[rgba(var(--brand-primary-rgb),0.35)] focus-within:shadow-[0_0_0_3px_rgba(var(--brand-primary-rgb),0.12)] ${
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
      }`}
    >
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        placeholder={placeholder}
        className={`max-h-28 min-h-[38px] flex-1 resize-none border-none bg-transparent py-1.5 leading-snug outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ${
          compact ? 'text-[13px]' : 'text-sm'
        }`}
      />
      {onAttachImage && (
        <button
          type="button"
          onClick={onAttachImage}
          disabled={imageUploading}
          aria-label="Adjuntar foto"
          className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            imageAttached
              ? 'bg-[rgba(var(--brand-primary-rgb),0.12)] text-[var(--brand-blue)]'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <IconImage size={17} />
        </button>
      )}
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Enviar"
        className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
          canSend
            ? 'bg-[var(--brand-blue)] text-white shadow-sm hover:brightness-110 active:scale-95'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
        }`}
      >
        <IconSend size={15} color={canSend ? '#fff' : undefined} />
      </button>
    </div>
  );
}
