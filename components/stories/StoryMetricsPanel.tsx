'use client';

import { createPortal } from 'react-dom';
import { Story, StoryMetrics } from '@/types';
import { STORY_OBJECTIVES } from '@/lib/stories/config';
import { IconClose } from '@/components/Icons';

interface StoryMetricsPanelProps {
  story: Story;
  metrics: StoryMetrics;
  onClose: () => void;
}

export default function StoryMetricsPanel({ story, metrics, onClose }: StoryMetricsPanelProps) {
  const objective = STORY_OBJECTIVES[story.objective];

  const rows = [
    { label: 'Vistas', value: metrics.views, key: 'views' },
    { label: 'Clics al adiso', value: metrics.cta_clicks, key: 'cta' },
    { label: 'WhatsApp', value: metrics.whatsapp_clicks, key: 'wa' },
    { label: 'Chats', value: metrics.chat_opens, key: 'chat' },
    { label: 'Guardados', value: metrics.favorites, key: 'fav' },
    { label: 'Compartidos', value: metrics.shares, key: 'share' },
  ];

  const primaryMetric =
    story.objective === 'contactos'
      ? metrics.whatsapp_clicks + metrics.chat_opens
      : story.objective === 'clicks'
        ? metrics.cta_clicks
        : metrics.cta_clicks + metrics.whatsapp_clicks;

  return createPortal(
    <div className="fixed inset-0 z-[10003] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Métricas</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <IconClose size={18} />
          </button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-1 truncate">{story.caption || 'Historia'}</p>
        <p className="text-xs text-[var(--brand-blue)] mb-4">Objetivo: {objective.label}</p>

        <div className="space-y-2 mb-4">
          {rows.map((r) => (
            <div key={r.key} className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{r.label}</span>
              <span className="font-semibold text-[var(--text-primary)]">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[var(--bg-secondary)] p-3 text-center">
          <p className="text-xs text-[var(--text-secondary)]">Progreso vs objetivo</p>
          <p className="text-2xl font-bold text-[var(--brand-blue)]">{primaryMetric}</p>
          {primaryMetric < 3 && story.promotion_tier === 'gratis' && (
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Tip: sube a Destacada (S/5) para más alcance.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
