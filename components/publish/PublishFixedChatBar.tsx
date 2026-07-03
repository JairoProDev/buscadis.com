'use client';

import { useRef, useState } from 'react';
import { IconAdis, IconChevronDown, IconMicrophone } from '@/components/Icons';
import PublishChatInput from './PublishChatInput';
import PublishImagePreview from './PublishImagePreview';

interface PublishFixedChatBarProps {
  onSend: (text: string, imageUrl?: string) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  sending?: boolean;
  embedded?: boolean;
}

export default function PublishFixedChatBar({
  onSend,
  onUploadImage,
  sending = false,
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

  const handleFilePick = () => fileRef.current?.click();

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

  if (minimized) {
    const fabClass = embedded
      ? 'absolute bottom-3 right-3 z-10'
      : 'fixed bottom-4 right-4 z-[1100]';
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className={`${fabClass} w-12 h-12 rounded-full shadow-[var(--shadow-hover)] flex items-center justify-center bg-[var(--brand-blue)] ring-2 ring-white/20`}
        aria-label="Abrir asistente ADIS"
      >
        <IconAdis size={20} color="#fff" />
      </button>
    );
  }

  const wrapperClass = embedded
    ? 'relative mt-3 pt-3 border-t border-[var(--border-color)]'
    : 'fixed bottom-0 inset-x-0 z-[1100] border-t border-[var(--border-color)] bg-[var(--bg-primary)]/95 backdrop-blur-md shadow-[0_-8px_32px_rgba(0,0,0,0.08)]';

  return (
    <div className={wrapperClass}>
      <div className={`${embedded ? '' : 'max-w-xl mx-auto'} px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] ring-1 ring-[rgba(var(--brand-primary-rgb),0.15)] flex items-center justify-center">
              <IconAdis size={14} color="var(--brand-blue)" />
            </div>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Asistente ADIS</span>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="text-[11px] font-medium text-[var(--text-tertiary)] flex items-center gap-0.5 hover:text-[var(--text-secondary)]"
          >
            Minimizar <IconChevronDown size={12} />
          </button>
        </div>

        {pendingImage && (
          <div className="mb-2">
            <PublishImagePreview url={pendingImage} onRemove={() => setPendingImage(null)} size="sm" />
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={startVoice}
            className="shrink-0 mb-0.5 flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--hover-bg)] hover:text-[var(--brand-blue)] transition-colors"
            aria-label="Entrada de voz"
          >
            <IconMicrophone size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <PublishChatInput
              value={text}
              onChange={setText}
              onSend={handleSend}
              sending={sending}
              disabled={sending}
              placeholder="Describe tu aviso o pega el texto…"
              onAttachImage={handleFilePick}
              imageAttached={Boolean(pendingImage)}
              imageUploading={uploading}
              compact
            />
          </div>
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
