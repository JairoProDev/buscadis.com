'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

/**
 * Captura de reseña — una pregunta (estrellas). Spec 06 §8.
 */
export default function ResenaInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : '';

  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    if (token === 'demo') {
      setNombre('Ferretería Demo Quival');
      setSlug('demo');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/resena/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Enlace inválido');
        setNombre(json.nombre);
        setSlug(json.slug);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Enlace inválido o vencido');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async () => {
    if (rating < 1) {
      setError('Toca una estrella');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (token === 'demo') {
        setDone(true);
        return;
      }
      const res = await fetch(`/api/resena/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          text: text.trim() || undefined,
          customerName: customerName.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo guardar');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !nombre) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-[17px] font-bold text-slate-800">{error}</p>
        <Link href="/" className="mt-4 text-teal-700 font-semibold">
          Ir a Buscadis
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-slate-50 p-6 text-center">
        <p className="text-2xl font-black text-slate-900">Gracias</p>
        <p className="mt-2 text-[17px] text-slate-600 max-w-sm">
          Tu opinión ya ayuda a otros a confiar en {nombre}.
        </p>
        {slug && (
          <button
            type="button"
            onClick={() => router.push(`/v/${slug}`)}
            className="mt-6 min-h-[52px] px-6 rounded-2xl bg-teal-600 text-white text-[17px] font-bold"
          >
            Ver el perfil
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50/80 via-slate-50 to-slate-100">
      <main className="max-w-md mx-auto px-4 py-10 pb-28">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-800">Buscadis</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 leading-tight">
          ¿Cómo te fue con {nombre}?
        </h1>
        <p className="mt-2 text-[17px] text-slate-600">
          Una sola pregunta. Toca las estrellas.
        </p>

        <div className="mt-8 flex justify-center gap-2" role="group" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
              className="min-w-[52px] min-h-[56px] text-4xl leading-none transition-transform active:scale-90"
              style={{ color: n <= rating ? '#E8A317' : '#d4d1db' }}
            >
              ★
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="mt-8 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-600">Tu nombre (opcional)</span>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full min-h-[52px] rounded-2xl border border-slate-200 px-4 text-[17px] bg-white"
                placeholder="Ej. María"
                maxLength={40}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-600">¿Algo más? (opcional)</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full min-h-[96px] rounded-2xl border border-slate-200 px-4 py-3 text-[17px] bg-white"
                placeholder="La atención, el precio, el producto…"
                maxLength={400}
              />
            </label>
          </div>
        )}

        {error && nombre && (
          <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-slate-200 max-w-md mx-auto">
        <button
          type="button"
          disabled={busy || rating < 1}
          onClick={() => void submit()}
          className="w-full min-h-[56px] rounded-2xl bg-teal-600 disabled:opacity-40 text-white text-[17px] font-bold"
        >
          {busy ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
