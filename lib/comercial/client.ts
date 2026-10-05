import type {
  SalesActivity,
  SalesOpportunityWithAdiso,
  SalesPipelineMetrics,
  SalesStage,
  SalesTask,
} from './types';
import type { SuggestReplyIntent } from './ai-suggest';

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchPipeline(token: string) {
  const res = await fetch('/api/ops/comercial/pipeline', {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('No se pudo cargar pipeline');
  return res.json() as Promise<{ stages: SalesStage[]; metrics: SalesPipelineMetrics }>;
}

export async function fetchOpportunities(
  token: string,
  opts?: { source?: string; campaign?: string },
) {
  const params = new URLSearchParams();
  if (opts?.source) params.set('source', opts.source);
  if (opts?.campaign) params.set('campaign', opts.campaign);
  const q = params.toString() ? `?${params}` : '';
  const res = await fetch(`/api/ops/comercial/opportunities${q}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('No se pudieron cargar oportunidades');
  return res.json() as Promise<{ opportunities: SalesOpportunityWithAdiso[] }>;
}

export async function fetchOpportunityDetail(token: string, id: string) {
  const res = await fetch(`/api/ops/comercial/opportunities/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Oportunidad no encontrada');
  return res.json() as Promise<{
    opportunity: SalesOpportunityWithAdiso;
    activities: SalesActivity[];
    tasks: SalesTask[];
  }>;
}

export async function patchOpportunityApi(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`/api/ops/comercial/opportunities/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error al actualizar');
  return res.json();
}

export async function postActivity(
  token: string,
  opportunityId: string,
  activity_type: string,
  body: string,
) {
  const res = await fetch(`/api/ops/comercial/opportunities/${opportunityId}/activities`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ activity_type, body }),
  });
  if (!res.ok) throw new Error('Error al guardar actividad');
  return res.json();
}

export async function suggestReplyApi(
  token: string,
  opportunityId: string,
  intent: SuggestReplyIntent,
) {
  const res = await fetch('/api/ops/comercial/ai/suggest-reply', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ opportunity_id: opportunityId, intent }),
  });
  if (!res.ok) throw new Error('IA no disponible');
  return res.json() as Promise<{ draft: string }>;
}

export async function backfillRuedaApi(token: string, batchId?: string) {
  const res = await fetch('/api/ops/comercial/rueda/backfill', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ batch_id: batchId }),
  });
  if (!res.ok) throw new Error('Backfill falló');
  return res.json();
}

export async function createTaskApi(
  token: string,
  opportunityId: string,
  title: string,
  dueAt?: string,
) {
  const res = await fetch(`/api/ops/comercial/opportunities/${opportunityId}/tasks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, due_at: dueAt }),
  });
  if (!res.ok) throw new Error('No se pudo crear la tarea');
  return res.json() as Promise<{ task: SalesTask }>;
}

export async function completeTaskApi(token: string, taskId: string) {
  const res = await fetch(`/api/ops/comercial/tasks/${taskId}/complete`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('No se pudo completar la tarea');
  return res.json();
}

export async function backfillPaidClientsApi(token: string) {
  const res = await fetch('/api/ops/comercial/paid/backfill', {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Sync clientes pagados falló');
  return res.json() as Promise<{ synced: number; errors: string[] }>;
}
