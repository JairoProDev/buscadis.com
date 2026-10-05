'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  completeTaskApi,
  createTaskApi,
  fetchOpportunityDetail,
  importWhatsAppExportApi,
  patchOpportunityApi,
  postActivity,
  suggestReplyApi,
} from '@/lib/comercial/client';
import type { SalesActivity, SalesOpportunityWithAdiso, SalesTask } from '@/lib/comercial/types';
import type { SuggestReplyIntent } from '@/lib/comercial/ai-suggest';
import { SALES_STAGE_IDS } from '@/lib/comercial/types';

const AI_INTENTS: { id: SuggestReplyIntent; label: string }[] = [
  { id: 'first_contact', label: 'Primer contacto' },
  { id: 'follow_up', label: 'Seguimiento' },
  { id: 'proposal', label: 'Propuesta' },
  { id: 'objection', label: 'Objeción' },
  { id: 'close', label: 'Cierre' },
];

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { session } = useAuth();
  const token = session?.access_token;

  const [opp, setOpp] = useState<SalesOpportunityWithAdiso | null>(null);
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [tasks, setTasks] = useState<SalesTask[]>([]);
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [waExport, setWaExport] = useState('');
  const [waPreview, setWaPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await fetchOpportunityDetail(token, id);
    setOpp(data.opportunity);
    setActivities(data.activities);
    setTasks(data.tasks);
  }, [token, id]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [load]);

  const saveStage = async (stageId: string) => {
    if (!token) return;
    await patchOpportunityApi(token, id, { stage_id: stageId });
    await load();
  };

  const addNote = async (type: 'note' | 'whatsapp_outbound' = 'note') => {
    if (!token || !note.trim()) return;
    await postActivity(token, id, type, note.trim());
    setNote('');
    await load();
  };

  const runAi = async (intent: SuggestReplyIntent) => {
    if (!token) return;
    setError(null);
    try {
      const { draft: text } = await suggestReplyApi(token, id, intent);
      setDraft(text);
      setNote(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'IA falló');
    }
  };

  const openWhatsApp = () => {
    if (!opp?.contact_whatsapp) return;
    const phone = opp.contact_whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(draft || note || '');
    window.open(`https://wa.me/51${phone}?text=${text}`, '_blank');
  };

  if (!opp) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--text-secondary)]">{error || 'Cargando…'}</p>
      </main>
    );
  }

  const adisoPath = opp.adiso_id ? `/a/${opp.adiso_id}` : null;
  const docsPath =
    typeof opp.metadata?.docs_path === 'string' ? opp.metadata.docs_path : null;

  const addTask = async () => {
    if (!token || !taskTitle.trim()) return;
    await createTaskApi(token, id, taskTitle.trim());
    setTaskTitle('');
    await load();
  };

  const markTaskDone = async (taskId: string) => {
    if (!token) return;
    await completeTaskApi(token, taskId);
    await load();
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin/comercial" className="text-sm text-[var(--brand-blue)]">
        ← Pipeline
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">{opp.title}</h1>
      <p className="text-sm text-[var(--text-secondary)]">
        {opp.source} · etapa {opp.stage_id}
        {opp.account_id && ` · cuenta ${opp.account_id.slice(0, 8)}…`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={opp.stage_id}
          onChange={(e) => void saveStage(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
        >
          {SALES_STAGE_IDS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {opp.contact_whatsapp && (
          <button
            type="button"
            onClick={openWhatsApp}
            className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
          >
            Abrir WhatsApp
          </button>
        )}
        {adisoPath && (
          <Link
            href={adisoPath}
            target="_blank"
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm"
          >
            Ver aviso
          </Link>
        )}
        {docsPath && (
          <span className="rounded-lg border border-dashed border-[var(--border-color)] px-4 py-2 text-xs text-[var(--text-secondary)]">
            Caso: {docsPath}/CASO.md
          </span>
        )}
      </div>

      <section className="mt-6 rounded-xl border border-[var(--border-color)] p-4">
        <h2 className="text-sm font-bold">Contacto</h2>
        <ul className="mt-2 text-sm text-[var(--text-secondary)]">
          {opp.business_name && <li>Negocio: {opp.business_name}</li>}
          {opp.contact_whatsapp && <li>WhatsApp: {opp.contact_whatsapp}</li>}
          {opp.amount_pen != null && <li>Monto: S/ {opp.amount_pen}</li>}
          {opp.plan_tier && <li>Plan: {opp.plan_tier}</li>}
          {opp.notes && <li className="mt-2 whitespace-pre-wrap">{opp.notes}</li>}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border-color)] p-4">
        <h2 className="text-sm font-bold">IA — borrador WhatsApp</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {AI_INTENTS.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => void runAi(i.id)}
              className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs"
            >
              {i.label}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          className="mt-3 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm"
          placeholder="Nota o mensaje para WhatsApp…"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => void addNote('note')}
            className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm text-white"
          >
            Guardar nota
          </button>
          <button
            type="button"
            onClick={() => void addNote('whatsapp_outbound')}
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm"
          >
            Registrar envío WA
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border-color)] p-4">
        <h2 className="text-sm font-bold">Importar chat WhatsApp</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Export oficial: chat → ⋮ → Exportar chat → Sin archivos. Pega el .txt aquí (ver{' '}
          <code className="text-[10px]">docs/comercial/IMPORTAR-CHATS-WHATSAPP.md</code>).
        </p>
        <textarea
          value={waExport}
          onChange={(e) => setWaExport(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 font-mono text-xs"
          placeholder="[04/10/2026, 10:30:15] Cliente: Hola..."
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!token || waExport.length < 20}
            onClick={() => {
              if (!token) return;
              void importWhatsAppExportApi(token, id, waExport, true)
                .then((r) =>
                  setWaPreview(
                    `Vista previa: ${r.total} mensajes (${r.inbound} entrantes, ${r.outbound} salientes)`,
                  ),
                )
                .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
            }}
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs"
          >
            Vista previa
          </button>
          <button
            type="button"
            disabled={!token || waExport.length < 20}
            onClick={() => {
              if (!token) return;
              void importWhatsAppExportApi(token, id, waExport, false)
                .then((r) => {
                  setWaPreview(`Importados ${r.imported} mensajes`);
                  setWaExport('');
                  return load();
                })
                .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
            }}
            className="rounded-lg bg-[var(--brand-blue)] px-3 py-2 text-xs text-white"
          >
            Importar al historial
          </button>
        </div>
        {waPreview && <p className="mt-2 text-xs text-[var(--text-secondary)]">{waPreview}</p>}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold">Actividades</h2>
        <ul className="mt-3 space-y-3">
          {activities.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 text-sm"
            >
              <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                {a.activity_type}
              </span>
              <span className="ml-2 text-xs text-[var(--text-tertiary)]">
                {new Date(a.created_at).toLocaleString('es-PE')}
              </span>
              {a.body && <p className="mt-2 whitespace-pre-wrap text-[var(--text-primary)]">{a.body}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border-color)] p-4">
        <h2 className="text-sm font-bold">Tareas</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Seguimiento, renovación, etc."
            className="flex-1 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void addTask()}
            className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm text-white"
          >
            Añadir
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-center justify-between gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 ${
                t.completed_at ? 'opacity-50' : ''
              }`}
            >
              <span className={t.completed_at ? 'line-through' : ''}>{t.title}</span>
              {!t.completed_at && (
                <button
                  type="button"
                  onClick={() => void markTaskDone(t.id)}
                  className="text-xs font-semibold text-[var(--brand-blue)]"
                >
                  Hecho
                </button>
              )}
            </li>
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-[var(--text-tertiary)]">Sin tareas pendientes.</p>
          )}
        </ul>
      </section>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </main>
  );
}
