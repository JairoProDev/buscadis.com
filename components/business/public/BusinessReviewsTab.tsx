'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';
import { IconStar } from '@/components/Icons';

interface ReviewRow {
  id: string;
  rating: number;
  text?: string;
  created_at: string;
}

interface BusinessReviewsTabProps {
  slug: string;
}

export default function BusinessReviewsTab({ slug }: BusinessReviewsTabProps) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [aggregate, setAggregate] = useState<BusinessReviewAggregate | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/business/${encodeURIComponent(slug)}/reviews`);
    const data = await res.json();
    setReviews(data.reviews || []);
    setAggregate(data.aggregate || null);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!session?.access_token) {
      setMessage('Inicia sesión para dejar tu reseña');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rating, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setText('');
      await load();
      setMessage('¡Gracias por tu reseña!');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Cargando reseñas…</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      {aggregate && aggregate.review_count > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center">
          <p className="text-4xl font-black text-amber-500">{aggregate.avg_rating.toFixed(1)}</p>
          <p className="text-sm text-slate-500">{aggregate.review_count} reseñas</p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4">
        <h3 className="font-bold text-lg">Deja tu reseña</h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={n <= rating ? 'text-amber-400' : 'text-slate-200'}
            >
              <IconStar size={28} />
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cuéntanos tu experiencia…"
          className="w-full rounded-xl border border-slate-200 p-3 text-sm min-h-[100px] outline-none focus:border-[var(--brand-color)]"
        />
        {message && <p className="text-sm text-slate-500">{message}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-[var(--brand-color)] text-white font-bold disabled:opacity-50"
        >
          {submitting ? 'Enviando…' : 'Publicar reseña'}
        </button>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex gap-0.5 text-amber-400 mb-2">
              {Array.from({ length: r.rating }).map((_, i) => (
                <IconStar key={i} size={14} />
              ))}
            </div>
            {r.text && <p className="text-sm text-slate-600">{r.text}</p>}
            <p className="text-xs text-slate-400 mt-2">
              {new Date(r.created_at).toLocaleDateString('es-PE')}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
