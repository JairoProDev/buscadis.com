'use client';

import { PublishDraft } from '@/lib/publish/publish-draft-types';
import {
  DAY_BUNDLES,
  DAILY_RATE_OPTIONS,
  calculateTotalPrice,
  calculateListPrice,
  formatPrice,
  getYapePhone,
  getYapeQrUrl,
  estimateDailyReach,
} from '@/lib/publish/pricing';
import PublishPreviewCard from './PublishPreviewCard';
import PublishReachLines from './PublishReachLines';

interface PublishCheckoutPanelProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onPublishFree: () => void;
  onPublishPaid: () => void;
  publishing?: boolean;
  publishedOrderId?: string | null;
  publishedAdisoId?: string | null;
  onBack?: () => void;
}

export default function PublishCheckoutPanel({
  draft,
  onChange,
  onPublishFree,
  onPublishPaid,
  publishing = false,
  publishedOrderId,
  publishedAdisoId,
  onBack,
}: PublishCheckoutPanelProps) {
  const days = draft.paidDays ?? 7;
  const rate = draft.dailyRate ?? 5;
  const total = calculateTotalPrice(days, rate);
  const listPrice = calculateListPrice(days, rate);
  const hasDiscount = total < listPrice;
  const reach = estimateDailyReach(rate);
  const yapeQr = getYapeQrUrl();
  const yapePhone = getYapePhone();

  if (publishedOrderId && publishedAdisoId) {
    const waMsg = encodeURIComponent(
      `Hola, publiqué mi aviso ${publishedAdisoId}. Adjunto captura de pago Yape por ${formatPrice(total)}.`
    );
    return (
      <div className="space-y-3">
        <p className="font-bold text-[var(--text-primary)] m-0">¡Aviso publicado!</p>
        <p className="text-sm text-[var(--text-secondary)] m-0">
          Verifica tu pago para activar el contacto con interesados.
        </p>
        {yapeQr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={yapeQr} alt="QR Yape" className="w-36 h-36 mx-auto rounded-xl border border-[var(--border-color)]" />
        )}
        <p className="text-center text-sm font-bold m-0">{formatPrice(total)} → Yape {yapePhone}</p>
        <a
          href={`https://wa.me/51${yapePhone.replace(/\D/g, '')}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-xl font-bold text-white"
          style={{ background: 'var(--brand-blue)' }}
        >
          Enviar captura por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Free vs Paid comparison */}
      <div className="grid grid-cols-2 gap-3 items-start">
        <PublishPreviewCard draft={draft} variant="free" label="Gratis" compact />
        <PublishPreviewCard draft={draft} variant="paid" label="Promocionado" compact />
      </div>

      <PublishReachLines draft={{ ...draft, dailyRate: rate }} className="text-center" />

      <div>
        <p className="text-sm font-bold m-0 mb-1">Elige tu plan</p>
        <p className="text-xs text-[var(--text-secondary)] m-0">
          Gratis: 1 foto, 24h. Promocionado: más alcance y contacto activo.
        </p>
      </div>

      {/* Paid options */}
      <div className="space-y-3 rounded-xl border border-[var(--border-color)] p-3">
        <p className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] m-0">Duración</p>
        <div className="grid grid-cols-3 gap-1.5">
          {DAY_BUNDLES.map((b) => (
            <button
              key={b.days}
              type="button"
              onClick={() => onChange({ paidDays: b.days, plan: 'paid' })}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition ${
                days === b.days
                  ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)] text-[var(--brand-blue)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {b.label}
              {b.discountLabel && (
                <span className="block text-[9px] font-normal opacity-80 mt-0.5">{b.discountLabel}</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] m-0 pt-1">Alcance diario</p>
        <div className="grid grid-cols-3 gap-1.5">
          {DAILY_RATE_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ dailyRate: r, plan: 'paid' })}
              className={`py-2 rounded-lg text-[11px] font-bold border transition ${
                rate === r
                  ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)] text-[var(--brand-blue)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {formatPrice(r)}/día
              <span className="block text-[9px] font-normal mt-0.5">~{estimateDailyReach(r).toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className="text-center pt-1">
          {hasDiscount && (
            <p className="text-xs text-[var(--text-tertiary)] line-through m-0">{formatPrice(listPrice)}</p>
          )}
          <p className="text-xl font-extrabold m-0 text-[var(--brand-blue)]">{formatPrice(total)}</p>
          <p className="text-[10px] text-[var(--text-secondary)] m-0 mt-0.5">
            {days} día(s) · ~{(reach * days).toLocaleString()} personas
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onPublishPaid}
          disabled={publishing}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60"
          style={{ background: 'var(--brand-blue)' }}
        >
          {publishing ? 'Publicando…' : `Publicar promocionado · ${formatPrice(total)}`}
        </button>
        <button
          type="button"
          onClick={onPublishFree}
          disabled={publishing}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-color)] disabled:opacity-60"
        >
          Publicar gratis (1 foto · 24h)
        </button>
        {onBack && (
          <button type="button" onClick={onBack} className="text-xs text-[var(--text-tertiary)] py-1">
            ← Volver a editar
          </button>
        )}
      </div>
    </div>
  );
}
