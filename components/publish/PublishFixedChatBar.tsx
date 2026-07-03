'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { IconCamera, IconChevronDown, IconMicrophone, IconSend, IconX } from '@/components/Icons';

interface PublishFixedChatBarProps {
  onSend: (text: string, imageUrl?: string) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  sending?: boolean;
  placeholder?: string;
  embedded?: boolean;
}

export default function PublishFixedChatBar({
  onSend,
  onUploadImage,
  sending = false,
  placeholder = 'Escribe o dicta tu aviso…',
  embedded = false,
}: PublishFixedChatBarProps) {
  const [minimized, setMinimized] = useState(false);
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const t = text.trim();
    if (!t && !pendingImage) return;
    onSend(t, pendingImage || undefined);
    setText('');
    setPendingImage(null);
  };

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) setPendingImage(url);
    } finally {
      setUploading(false);
    }
  };

  const startVoice = () => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
        start: () => void;
      };
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'es-PE';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.start();
  };

  const positionClass = embedded
    ? 'relative border-t border-[var(--border-color)] bg-[var(--bg-primary)] mt-2 -mx-1'
    : 'fixed bottom-0 inset-x-0 z-[1100] border-t border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]';

  if (minimized) {
    const fabClass = embedded
      ? 'absolute bottom-3 right-3 z-10'
      : 'fixed bottom-4 right-4 z-[1100]';
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className={`${fabClass} w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white`}
        style={{ background: 'var(--brand-blue)' }}
        aria-label="Abrir chat con ADIS"
      >
        <IconSend size={16} />
      </button>
    );
  }

  return (
    <div className={positionClass}>
      <div className={`${embedded ? '' : 'max-w-3xl mx-auto'} px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]`}>
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="text-[10px] font-medium text-[var(--text-tertiary)] flex items-center gap-0.5 px-2 py-0.5"
          >
            Minimizar <IconChevronDown size={10} />
          </button>
        </div>

        {pendingImage && (
          <div className="relative inline-block mb-2">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[var(--border-color)]">
              <Image src={pendingImage} alt="" fill className="object-cover" unoptimized />
            </div>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center"
              aria-label="Quitar imagen"
            >
              <IconX size={10} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 w-10 h-10 rounded-xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]"
            aria-label="Adjuntar imagen"
          >
            <IconCamera size={18} />
          </button>
          <button
            type="button"
            onClick={startVoice}
            className="shrink-0 w-10 h-10 rounded-xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]"
            aria-label="Entrada de voz"
          >
            <IconMicrophone size={18} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="flex-1 min-h-[40px] max-h-24 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm resize-none focus:outline-none focus:border-[var(--brand-blue)]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || (!text.trim() && !pendingImage)}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
            style={{ background: 'var(--brand-blue)' }}
            aria-label="Enviar"
          >
            <IconSend size={16} />
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
    </div>
  );
}
