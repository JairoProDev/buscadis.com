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
import PublishPreviewCard, { type PublisherPreview } from './PublishPreviewCard';
import PublishReachLines from './PublishReachLines';
import { publishCard, publishPrimaryBtn, publishSecondaryBtn, publishLabel } from './publish-ui';

interface PublishCheckoutPanelProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onPublishFree: () => void;
  onPublishPaid: () => void;
  publishing?: boolean;
  publishedOrderId?: string | null;
  publishedAdisoId?: string | null;
  publisher?: PublisherPreview | null;
}

export default function PublishCheckoutPanel({
  draft,
  onChange,
  onPublishFree,
  onPublishPaid,
  publishing = false,
  publishedOrderId,
  publishedAdisoId,
  publisher,
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
      <div className={`${publishCard} p-5 space-y-4 text-center`}>
        <div className="w-12 h-12 mx-auto rounded-full bg-[rgba(var(--brand-primary-rgb),0.12)] flex items-center justify-center text-xl">
          ✓
        </div>
        <div>
          <p className="font-bold text-lg text-[var(--text-primary)] m-0">¡Aviso publicado!</p>
          <p className="text-sm text-[var(--text-secondary)] m-0 mt-1">
            Verifica tu pago para activar el contacto con interesados.
          </p>
        </div>
        {yapeQr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={yapeQr}
            alt="QR Yape"
            className="w-40 h-40 mx-auto rounded-2xl ring-1 ring-[var(--border-color)] shadow-sm"
          />
        )}
        <p className="text-base font-bold m-0 text-[var(--brand-blue)]">
          {formatPrice(total)} → Yape {yapePhone}
        </p>
        <a
          href={`https://wa.me/51${yapePhone.replace(/\D/g, '')}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${publishPrimaryBtn} block text-center no-underline`}
        >
          Enviar captura por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${publishCard} p-4`}>
        <p className="text-sm font-bold text-[var(--text-primary)] m-0 mb-3">
          Compara tu aviso
        </p>
        <div className="grid grid-cols-2 gap-3 items-start">
          <PublishPreviewCard draft={draft} variant="free" label="Gratis" compact publisher={publisher} />
          <PublishPreviewCard draft={draft} variant="paid" label="Promocionado" compact publisher={publisher} />
        </div>
        <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
          <PublishReachLines draft={{ ...draft, dailyRate: rate }} variant="stack" />
        </div>
      </div>

      <div className={`${publishCard} p-4 space-y-3`}>
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)] m-0">Plan promocionado</p>
          <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
            Más alcance, contacto activo y hasta 10 fotos.
          </p>
        </div>

        <div>
          <p className={publishLabel}>Duración</p>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {DAY_BUNDLES.map((b) => (
              <button
                key={b.days}
                type="button"
                onClick={() => onChange({ paidDays: b.days, plan: 'paid' })}
                className={`py-2.5 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                  days === b.days
                    ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)] shadow-[0_0_0_2px_rgba(var(--brand-primary-rgb),0.12)]'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[rgba(var(--brand-primary-rgb),0.3)]'
                }`}
              >
                {b.label}
                {b.discountLabel && (
                  <span className="block text-[9px] font-normal opacity-80 mt-0.5">{b.discountLabel}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={publishLabel}>Alcance diario</p>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {DAILY_RATE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ dailyRate: r, plan: 'paid' })}
                className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                  rate === r
                    ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)] shadow-[0_0_0_2px_rgba(var(--brand-primary-rgb),0.12)]'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[rgba(var(--brand-primary-rgb),0.3)]'
                }`}
              >
                {formatPrice(r)}/día
                <span className="block text-[9px] font-normal mt-0.5">~{estimateDailyReach(r).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center pt-2 rounded-xl bg-[rgba(var(--brand-primary-rgb),0.06)] ring-1 ring-[rgba(var(--brand-primary-rgb),0.15)] py-3">
          {hasDiscount && (
            <p className="text-xs text-[var(--text-tertiary)] line-through m-0">{formatPrice(listPrice)}</p>
          )}
          <p className="text-2xl font-extrabold m-0 text-[var(--brand-blue)]">{formatPrice(total)}</p>
          <p className="text-[11px] text-[var(--text-secondary)] m-0 mt-1">
            {days} día(s) · ~{(reach * days).toLocaleString()} personas
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onPublishPaid}
          disabled={publishing}
          className={publishPrimaryBtn}
        >
          {publishing ? 'Publicando…' : `Publicar promocionado · ${formatPrice(total)}`}
        </button>
        <button
          type="button"
          onClick={onPublishFree}
          disabled={publishing}
          className={publishSecondaryBtn}
        >
          Publicar gratis (1 foto · 24h)
        </button>
      </div>
    </div>
  );
}
