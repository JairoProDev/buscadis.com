import type { Profile } from '@/types';
import {
  PROMPT_DEFINITIONS,
  type ProfilePromptId,
  type ProfilePromptRow,
  type PromptDefinition,
} from '@/lib/profiling/prompt-types';

export function promptDefinition(id: ProfilePromptId): PromptDefinition | undefined {
  return PROMPT_DEFINITIONS.find((p) => p.id === id);
}

/** Field already filled → treat as complete without needing a row. */
export function isPromptSatisfiedByProfile(
  promptId: ProfilePromptId,
  profile: Profile | null | undefined
): boolean {
  if (!profile) return false;
  switch (promptId) {
    case 'whatsapp':
      return Boolean(profile.whatsapp);
    case 'demographics':
      return Boolean(profile.fecha_nacimiento || profile.genero);
    case 'dni_soft':
      return Boolean(profile.dni && profile.dni_verified_at);
    case 'intents':
      return Boolean(profile.intencion);
    default:
      return false;
  }
}

export function isPromptOnCooldown(
  row: ProfilePromptRow | undefined,
  now = new Date()
): boolean {
  if (!row || row.status !== 'dismissed' || !row.dismissed_until) return false;
  return new Date(row.dismissed_until).getTime() > now.getTime();
}

export function isPromptCompleted(row: ProfilePromptRow | undefined): boolean {
  return row?.status === 'completed';
}

/**
 * Next prompt in priority order that is not satisfied, not completed, and not on dismiss cooldown.
 */
export function resolveNextPrompt(
  profile: Profile | null | undefined,
  rows: ProfilePromptRow[]
): PromptDefinition | null {
  const byId = new Map(rows.map((r) => [r.prompt_id, r]));

  const sorted = [...PROMPT_DEFINITIONS].sort((a, b) => a.priority - b.priority);
  for (const def of sorted) {
    if (isPromptSatisfiedByProfile(def.id, profile)) continue;
    const row = byId.get(def.id);
    if (isPromptCompleted(row)) continue;
    if (isPromptOnCooldown(row)) continue;
    return def;
  }
  return null;
}

/** Fraction of key prompts already satisfied (for subtle progress bar). */
export function profileUsefulnessScore(
  profile: Profile | null | undefined,
  rows: ProfilePromptRow[] = []
): { done: number; total: number; ratio: number } {
  const total = PROMPT_DEFINITIONS.length;
  let done = 0;
  const byId = new Map(rows.map((r) => [r.prompt_id, r]));
  for (const def of PROMPT_DEFINITIONS) {
    if (isPromptSatisfiedByProfile(def.id, profile) || isPromptCompleted(byId.get(def.id))) {
      done += 1;
    }
  }
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

const VISIT_KEY = (userId: string) => `buscadis_auth_visits_${userId}`;
const SESSION_MARK = (userId: string) => `buscadis_session_marked_${userId}`;

/**
 * First browser session after Google login: no prompts.
 * Second+ browser sessions: eligible.
 */
export function isProgressiveProfilingEligible(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sessionKey = SESSION_MARK(userId);
    const visitKey = VISIT_KEY(userId);
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      const visits = Number(localStorage.getItem(visitKey) || '0') + 1;
      localStorage.setItem(visitKey, String(visits));
      return visits >= 2;
    }
    return Number(localStorage.getItem(visitKey) || '0') >= 2;
  } catch {
    return false;
  }
}

const SHOWN_SESSION_KEY = (userId: string) => `buscadis_prompt_shown_${userId}`;

/** At most one prompt presentation per browser session. */
export function hasShownPromptThisSession(userId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return sessionStorage.getItem(SHOWN_SESSION_KEY(userId)) === '1';
  } catch {
    return true;
  }
}

export function markPromptShownThisSession(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SHOWN_SESSION_KEY(userId), '1');
  } catch {
    /* ignore */
  }
}
