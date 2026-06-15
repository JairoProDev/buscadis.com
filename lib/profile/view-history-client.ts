const DEBOUNCE_MS = 800;
const pending = new Map<string, ReturnType<typeof setTimeout>>();

export function trackViewHistory(
  payload: {
    adisoId?: string;
    storyId?: string;
    businessProfileId?: string;
    source?: 'feed' | 'story' | 'search' | 'direct';
  },
  token?: string
) {
  const key = payload.adisoId || payload.storyId || payload.businessProfileId || '';
  if (!key) return;

  const existing = pending.get(key);
  if (existing) clearTimeout(existing);

  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      fetch('/api/profile/history', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, DEBOUNCE_MS)
  );
}
