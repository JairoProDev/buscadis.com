'use client';

import { DealClip, DealFeedTab, DealLiveSession } from '@/types';

const SESSION_KEY = 'buscadis_session_id';

export function getDealSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function fetchDealFeed(params: {
  tab?: DealFeedTab;
  cursor?: string;
  clipId?: string;
  token?: string | null;
}): Promise<{ clips: DealClip[]; nextCursor?: string; liveSessions?: DealLiveSession[] }> {
  const sp = new URLSearchParams();
  sp.set('tab', params.tab || 'for_you');
  sp.set('sessionId', getDealSessionId());
  if (params.cursor) sp.set('cursor', params.cursor);
  if (params.clipId) sp.set('clip', params.clipId);

  const headers: HeadersInit = {};
  if (params.token) headers.Authorization = `Bearer ${params.token}`;

  const res = await fetch(`/api/deals/feed?${sp}`, { headers });
  if (!res.ok) throw new Error('Error al cargar feed');
  return res.json();
}

export async function interactDealClip(
  clipId: string,
  type: string,
  opts?: { token?: string | null; watchTimeMs?: number; reason?: string }
) {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`/api/deals/${clipId}/interact`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type,
      sessionId: getDealSessionId(),
      watchTimeMs: opts?.watchTimeMs,
      reason: opts?.reason,
    }),
  });

  if (!res.ok) throw new Error('Interacción fallida');
  return res.json();
}

export async function followCreator(creatorId: string, token: string) {
  const res = await fetch('/api/deals/follow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ creatorId }),
  });
  if (!res.ok) throw new Error('No se pudo seguir');
  return res.json();
}

export async function fetchDealComments(clipId: string) {
  const res = await fetch(`/api/deals/${clipId}/comments`);
  if (!res.ok) return { comments: [] };
  return res.json();
}

export async function postDealComment(clipId: string, body: string, token: string) {
  const res = await fetch(`/api/deals/${clipId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error('No se pudo comentar');
  return res.json();
}

export function getDealShareUrl(clipId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/deals?clip=${clipId}`;
}
