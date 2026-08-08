'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Row = {
  id: string;
  created_at: string;
  metadata: { pregunta?: string } | null;
};

/**
 * Panel dueño: preguntas que la IA no pudo responder (§23 ciclo de mejora).
 */
export function OwnerIaPreguntasPanel({
  businessProfileId,
}: {
  businessProfileId?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!businessProfileId) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <p className="text-[15px] text-slate-700 leading-snug">
        Cuando alguien pregunta algo que tu perfil no responde, lo guardamos aquí para que lo
        agregues (FAQ, delivery, horario…).
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : aggregated.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aún no hay preguntas sin respuesta en los últimos 30 días.
        </p>
      ) : (
        <ul className="space-y-2">
          {aggregated.slice(0, 12).map((item) => (
            <li
              key={item.pregunta}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <p className="text-[14px] font-semibold text-slate-800 leading-snug">
                {item.pregunta}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {item.count === 1
                  ? '1 vez'
                  : `${item.count} veces`}{' '}
                · última{' '}
                {new Date(item.lastAt).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
      {aggregated[0] && aggregated[0].count >= 2 ? (
        <p className="text-[13px] font-semibold text-teal-800 bg-teal-50 rounded-lg px-2 py-1.5">
          Tip: te preguntaron «{aggregated[0].pregunta}» {aggregated[0].count} veces. Agrégalo a
          FAQ o a tu perfil.
        </p>
      ) : null}
    </div>
  );
}
