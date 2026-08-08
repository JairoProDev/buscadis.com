'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type ReviewRow = {
  id: string;
  rating: number;
  text?: string;
  customer_name?: string | null;
  created_at: string;
  response_text?: string;
  responded_at?: string;
};

/** Panel dueño: listar reseñas y responder (P10). */
export function OwnerReviewsPanel({ slug }: { slug: string }) {
  const { session } = useAuth();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/reviews`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.reviews || []);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const reply = async (reviewId: string) => {
    const text = (drafts[reviewId] || '').trim();
    if (text.length < 2 || !session?.access_token) return;
    setBusyId(reviewId);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(slug)}/reviews/${encodeURIComponent(reviewId)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ response_text: text }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || 'No se pudo guardar');
        return;
      }
      setDrafts((d) => ({ ...d, [reviewId]: '' }));
      setMsg('Respuesta publicada');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (!slug) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
      <p className="text-[15px] font-bold text-slate-800">Responder reseñas</p>
      <p className="text-[13px] text-slate-600 leading-snug">
        Tu respuesta se ve en el perfil público. Sé breve y concreto.
      </p>
      {loading ? (
        <p className="text-[12px] text-slate-400">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-[13px] text-slate-500">Aún no hay reseñas visibles.</p>
      ) : (
        <ul className="space-y-3">
          {rows.slice(0, 8).map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 space-y-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-800">
                  {r.customer_name || 'Cliente'} · {'★'.repeat(r.rating)}
                </p>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {new Date(r.created_at).toLocaleDateString('es-PE')}
                </p>
              </div>
              {r.text ? (
                <p className="text-[13px] text-slate-600 leading-snug">{r.text}</p>
              ) : null}
              {r.response_text ? (
                <p className="text-[13px] text-teal-800 bg-teal-50 rounded-md px-2 py-1.5 leading-snug">
                  <span className="font-semibold">Tu respuesta: </span>
                  {r.response_text}
                </p>
              ) : (
                <>
                  <textarea
                    value={drafts[r.id] || ''}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [r.id]: e.target.value.slice(0, 600) }))
                    }
                    placeholder="Escribe tu respuesta…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border text-sm min-h-[64px]"
                  />
                  <button
                    type="button"
                    disabled={busyId === r.id || (drafts[r.id] || '').trim().length < 2}
                    onClick={() => void reply(r.id)}
                    className="w-full min-h-[44px] rounded-xl bg-slate-900 disabled:opacity-40 text-white text-[14px] font-bold"
                  >
                    {busyId === r.id ? 'Guardando…' : 'Publicar respuesta'}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
    </div>
  );
}
