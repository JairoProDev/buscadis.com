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
} from '@/lib/publish/pricing';
import { estimateDailyReach } from '@/lib/publish/pricing';

interface PublishCheckoutPanelProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onPublishFree: () => void;
  onPublishPaid: () => void;
  publishing?: boolean;
  publishedOrderId?: string | null;
  publishedAdisoId?: string | null;
}

export default function PublishCheckoutPanel({
  draft,
  onChange,
  onPublishFree,
  onPublishPaid,
  publishing = false,
  publishedOrderId,
  publishedAdisoId,
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
      <div className="rounded-2xl border border-green-200 p-4 space-y-3 bg-green-50/50">
        <p className="font-bold text-green-800 m-0">¡Aviso publicado!</p>
        <p className="text-sm text-green-700 m-0">
          Tu aviso ya está visible. Verifica tu pago para activar el contacto.
        </p>
        {yapeQr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={yapeQr} alt="QR Yape" className="w-40 h-40 mx-auto rounded-xl" />
        )}
        <p className="text-center text-sm font-bold m-0">{formatPrice(total)} → Yape {yapePhone}</p>
        <a
          href={`https://wa.me/51${yapePhone.replace(/\D/g, '')}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-xl font-bold text-white bg-green-600"
        >
          Enviar captura por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-color)] p-4 space-y-4 bg-[var(--bg-primary)]">
      <div>
        <p className="text-sm font-bold m-0 mb-2">Promociona tu aviso</p>
        <p className="text-xs text-[var(--text-secondary)] m-0">
          Decide si conseguir tus objetivos más rápido o durante más tiempo.
        </p>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Duración</label>
        <div className="flex gap-2 mt-1">
          {DAY_BUNDLES.map((b) => (
            <button
              key={b.days}
              type="button"
              onClick={() => onChange({ paidDays: b.days, plan: 'paid' })}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition ${
                days === b.days
                  ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                  : 'border-[var(--border-color)]'
              }`}
            >
              {b.label}
              {b.discountLabel && (
                <span className="block text-[9px] font-normal text-green-600 mt-0.5">{b.discountLabel}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Alcance diario</label>
        <div className="flex gap-2 mt-1">
          {DAILY_RATE_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ dailyRate: r, plan: 'paid' })}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                rate === r
                  ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                  : 'border-[var(--border-color)]'
              }`}
            >
              {formatPrice(r)}/día
              <span className="block text-[9px] font-normal mt-0.5">~{estimateDailyReach(r).toLocaleString()} interesados.</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-3 bg-[rgba(var(--brand-primary-rgb),0.06)] text-center">
        {hasDiscount && (
          <p className="text-xs text-[var(--text-tertiary)] line-through m-0">{formatPrice(listPrice)}</p>
        )}
        <p className="text-2xl font-extrabold m-0 text-[var(--brand-blue)]">{formatPrice(total)}</p>
        <p className="text-xs text-[var(--text-secondary)] m-0 mt-1">
          {days} día(s) · ~{(reach * days).toLocaleString()} personas · contacto activo
        </p>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onPublishPaid}
          disabled={publishing}
          className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-60"
          style={{ background: 'var(--brand-blue)' }}
        >
          {publishing ? 'Publicando…' : `Publicar y pagar ${formatPrice(total)}`}
        </button>
        <button
          type="button"
          onClick={onPublishFree}
          disabled={publishing}
          className="w-full py-2.5 rounded-xl font-medium text-[var(--text-secondary)] border border-[var(--border-color)] disabled:opacity-60"
        >
          Publicar gratis (24h, funciones limitadas)
        </button>
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)] text-center m-0">
        Puedes editar tu aviso en cualquier momento · Pago con Yape
      </p>
    </div>
  );
}
