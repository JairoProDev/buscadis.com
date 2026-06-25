'use client';

import {
  BehavioralEventInput,
  BehavioralEventType,
  EntityType,
  EVENT_SCORE_DELTAS,
} from './schema';
import { getAnonymousId, getSessionId } from './session';
import { getAttributionContext } from '@/lib/analytics/attribution';
import { bridgeBehavioralEvent } from '@/lib/analytics/marketing-bridge';

type TrackOptions = {
  entityType?: EntityType;
  entityId?: string;
  payload?: Record<string, unknown>;
  context?: Record<string, unknown>;
  scoreDelta?: number;
  userId?: string | null;
};

const FLUSH_INTERVAL_MS = 2000;
const MAX_QUEUE = 40;

let queue: BehavioralEventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

function buildContext(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

async function sendBatch(events: BehavioralEventInput[]): Promise<void> {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
  } catch {
    // Non-blocking analytics
  }
}

export function flushEvents(): void {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0, MAX_QUEUE);
  flushTimer = null;
  void sendBatch(batch).finally(() => {
    flushing = false;
    if (queue.length > 0) scheduleFlush();
  });
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL_MS);
}

export function trackEvent(eventType: BehavioralEventType, options: TrackOptions = {}): void {
  if (typeof window === 'undefined') return;

  const event: BehavioralEventInput = {
    eventType,
    entityType: options.entityType,
    entityId: options.entityId,
    payload: options.payload,
    context: { ...buildContext(), ...getAttributionContext(), ...options.context },
    scoreDelta: options.scoreDelta ?? EVENT_SCORE_DELTAS[eventType],
    sessionId: getSessionId(),
    anonymousId: getAnonymousId(),
    userId: options.userId ?? undefined,
    clientTimestamp: new Date().toISOString(),
  };

  queue.push(event);
  bridgeBehavioralEvent(eventType, {
    payload: options.payload,
    entityId: options.entityId,
  });
  if (queue.length >= MAX_QUEUE) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushEvents();
  });
  window.addEventListener('pagehide', () => flushEvents());
}
