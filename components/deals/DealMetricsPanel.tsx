'use client';

import { DealClipMetrics } from '@/types';
import { formatCount } from '@/lib/deals/commerce-overlay';

interface DealMetricsPanelProps {
  metrics: DealClipMetrics;
  title?: string;
}

export default function DealMetricsPanel({ metrics, title = 'Métricas del Deal' }: DealMetricsPanelProps) {
  const items = [
    { label: 'Vistas', value: metrics.views },
    { label: 'Likes', value: metrics.likes },
    { label: 'Guardados', value: metrics.saves },
    { label: 'Compartidos', value: metrics.shares },
    { label: 'Clics CTA', value: metrics.cta_clicks },
    { label: 'WhatsApp', value: metrics.whatsapp_clicks },
  ];

  const ctr =
    metrics.views > 0 ? ((metrics.cta_clicks / metrics.views) * 100).toFixed(1) : '0';

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
      <h3 className="mb-3 font-bold text-[var(--text-primary)]">{title}</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-lg font-extrabold text-[var(--brand-blue)]">{formatCount(item.value)}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-[var(--text-secondary)]">
        Tasa de clic (CTA): <strong>{ctr}%</strong>
      </p>
    </div>
  );
}
