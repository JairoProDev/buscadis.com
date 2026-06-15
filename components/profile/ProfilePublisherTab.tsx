'use client';

import { useEffect, useState } from 'react';
import { Story } from '@/types';
import StoryArchiveGrid from '@/components/stories/StoryArchiveGrid';
import ProfileMyAdisosGrid from './ProfileMyAdisosGrid';
import Link from 'next/link';

type PublisherSubTab = 'avisos' | 'historias' | 'promocionar';

interface ProfilePublisherTabProps {
  token?: string;
  highlightId?: string | null;
}

export default function ProfilePublisherTab({ token, highlightId }: ProfilePublisherTabProps) {
  const [subTab, setSubTab] = useState<PublisherSubTab>('avisos');
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  const fetchStories = async () => {
    if (!token) return;
    setStoriesLoading(true);
    try {
      const res = await fetch('/api/stories/mine?archived=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { stories?: Story[] };
        setStories(data.stories || []);
      }
    } finally {
      setStoriesLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'historias') fetchStories();
  }, [subTab, token]);

  const subs: { id: PublisherSubTab; label: string }[] = [
    { id: 'avisos', label: 'Mis avisos' },
    { id: 'historias', label: 'Mis historias' },
    { id: 'promocionar', label: 'Promocionar' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {subs.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSubTab(s.id)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              subTab === s.id
                ? 'bg-[var(--brand-blue)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {subTab === 'avisos' && (
        <>
          <div className="flex justify-end">
            <Link
              href="/publicar"
              className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
            >
              + Nuevo aviso
            </Link>
          </div>
          <ProfileMyAdisosGrid token={token} highlightId={highlightId} />
        </>
      )}

      {subTab === 'historias' && (
        <>
          {storiesLoading ? (
            <div className="skeleton-shimmer h-48 rounded-2xl" />
          ) : (
            <StoryArchiveGrid stories={stories} token={token} onRefresh={fetchStories} />
          )}
        </>
      )}

      {subTab === 'promocionar' && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Destaca tus avisos e historias para llegar a más personas.
          </p>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Abre un aviso o historia y usa el botón Promocionar.
          </p>
        </div>
      )}
    </div>
  );
}
