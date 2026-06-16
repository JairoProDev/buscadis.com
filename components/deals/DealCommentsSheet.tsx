'use client';

import { useEffect, useState } from 'react';
import { fetchDealComments, postDealComment } from '@/lib/deals/client';
import { useAuth } from '@/hooks/useAuth';
import { IconClose } from '@/components/Icons';

interface DealCommentsSheetProps {
  open: boolean;
  clipId: string;
  onClose: () => void;
  onCountChange?: (n: number) => void;
}

export default function DealCommentsSheet({
  open,
  clipId,
  onClose,
  onCountChange,
}: DealCommentsSheetProps) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [comments, setComments] = useState<
    { id: string; body: string; author?: { nombre: string }; created_at: string }[]
  >([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchDealComments(clipId).then((data) => {
      setComments(data.comments || []);
      onCountChange?.(data.comments?.length || 0);
    });
  }, [open, clipId, onCountChange]);

  const submit = async () => {
    if (!token || !text.trim()) return;
    setLoading(true);
    try {
      const res = await postDealComment(clipId, text.trim(), token);
      setComments((prev) => [...prev, { ...res.comment, author: { nombre: 'Tú' } }]);
      setText('');
      onCountChange?.(comments.length + 1);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[70vh] rounded-t-2xl bg-[var(--bg-primary)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-[var(--text-primary)]">Comentarios</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <IconClose size={20} />
          </button>
        </div>

        <div className="mb-3 max-h-48 space-y-3 overflow-y-auto">
          {comments.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">Sé el primero en comentar</p>
          )}
          {comments.map((c) => (
            <div key={c.id}>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {c.author?.nombre || 'Usuario'}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">{c.body}</p>
            </div>
          ))}
        </div>

        {token ? (
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Agrega un comentario..."
              className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
              maxLength={500}
            />
            <button
              type="button"
              disabled={loading || !text.trim()}
              onClick={submit}
              className="rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Inicia sesión para comentar
          </p>
        )}
      </div>
    </div>
  );
}
