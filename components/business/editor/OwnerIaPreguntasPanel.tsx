'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type Row = {
  id: string;
  created_at: string;
  metadata: { pregunta?: string } | null;
};

/**
 * Panel dueño: preguntas IA sin respuesta + aprobar FAQ (P5).
 */
export function OwnerIaPreguntasPanel({
  businessProfileId,
  businessSlug,
}: {
  businessProfileId?: string;
  businessSlug?: string;
}) {
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!businessProfileId) return;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    void (async () => {
      setLoading(true);
      try {
        const { data } = await supabase!
          .from('page_analytics')
          .select('id, created_at, metadata')
          .eq('business_profile_id', businessProfileId)
          .eq('event_type', 'ia_unanswered')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(80);
        setRows((data as Row[]) || []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [businessProfileId]);

  const aggregated = useMemo(() => {
    const map = new Map<string, { pregunta: string; count: number; lastAt: string }>();
    for (const r of rows) {
      const pregunta = (r.metadata?.pregunta || '').trim();
      if (!pregunta) continue;
      const key = pregunta.toLowerCase();
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        if (r.created_at > prev.lastAt) prev.lastAt = r.created_at;
      } else {
        map.set(key, { pregunta, count: 1, lastAt: r.created_at });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [rows]);

  async function approve(pregunta: string) {
    if (!businessSlug || !session?.access_token) return;
    const respuesta = (drafts[pregunta] || '').trim();
    if (respuesta.length < 3) {
      setToast('Escribe una respuesta corta antes de aprobar.');
      return;
    }
    setSaving(pregunta);
    setToast(null);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessSlug)}/faq-trained`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pregunta, respuesta }),
        }
      );
      const data = await res.json();
      setToast(data.ok ? 'FAQ guardada. El asistente ya puede usarla.' : data.error || 'Error');
    } catch {
      setToast('Error de red');
    } finally {
      setSaving(null);
    }
  }

  if (!businessProfileId) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <p className="text-[15px] text-slate-700 leading-snug">
        Cuando alguien pregunta algo que tu perfil no responde, lo guardamos aquí. Aprueba una
        respuesta y tu empleado digital la usará (Max).
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : aggregated.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aún no hay preguntas sin respuesta en los últimos 30 días.
        </p>
      ) : (
        <ul className="space-y-3">
          {aggregated.slice(0, 12).map((item) => (
            <li
              key={item.pregunta}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 space-y-2"
            >
              <p className="text-[14px] font-semibold text-slate-800 leading-snug">
                {item.pregunta}
              </p>
              <p className="text-[12px] text-slate-500">
                {item.count === 1 ? '1 vez' : `${item.count} veces`}
              </p>
              {businessSlug ? (
                <>
                  <textarea
                    className="w-full min-h-[72px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    placeholder="Respuesta que verá el cliente…"
                    value={drafts[item.pregunta] || ''}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [item.pregunta]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="min-h-10 px-3 rounded-lg bg-teal-700 text-white text-sm font-bold"
                    disabled={saving === item.pregunta}
                    onClick={() => void approve(item.pregunta)}
                  >
                    {saving === item.pregunta ? 'Guardando…' : 'Aprobar FAQ'}
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {toast ? <p className="text-[13px] font-semibold text-teal-800">{toast}</p> : null}
    </div>
  );
}
