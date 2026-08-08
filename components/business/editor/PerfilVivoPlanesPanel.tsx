'use client';

import {
  PERFIL_VIVO_PLANS,
  planIdFromTier,
  getSubscriptionTier,
  PROFILE_PUBLISH_MONTHLY_PEN,
  PROFILE_PUBLISH_YEARLY_PEN,
  PROFILE_MAX_MONTHLY_PEN,
} from '@/lib/business/subscription';
import type { BusinessProfile } from '@/types/business';

/**
 * Comparativa Free / Pro / Max (GTM §10). Checkout Pro reusa el flujo de publicar.
 */
export function PerfilVivoPlanesPanel({
  profile,
  onUpgradePro,
}: {
  profile: Partial<BusinessProfile>;
  onUpgradePro?: () => void;
}) {
  const current = planIdFromTier(getSubscriptionTier(profile));

  return (
    <div className="space-y-3">
      <p className="text-[15px] text-slate-700 leading-snug">
        El free es digno (se comparte). Pro desbloquea publicar y crecer. Max es acompañamiento
        completo + ADIS AI.
      </p>
      <div className="grid gap-2">
        {PERFIL_VIVO_PLANS.map((plan) => {
          const active = plan.id === current;
          return (
            <div
              key={plan.id}
              className={`rounded-xl border px-3 py-3 ${
                active
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[16px] font-bold text-slate-900">{plan.nombre}</h3>
                <p className="text-[15px] font-black text-slate-900">
                  {plan.precioMensualPen === 0
                    ? 'S/0'
                    : `S/${plan.precioMensualPen}`}
                  {plan.precioMensualPen > 0 ? (
                    <span className="text-[12px] font-semibold text-slate-500">/mes</span>
                  ) : null}
                </p>
              </div>
              {plan.precioAnualPen ? (
                <p className="text-[12px] text-slate-500 mt-0.5">
                  o S/{plan.precioAnualPen}/año (ahorras S/
                  {plan.precioMensualPen * 12 - plan.precioAnualPen})
                </p>
              ) : null}
              <ul className="mt-2 space-y-1">
                {plan.incluye.map((line) => (
                  <li key={line} className="text-[13px] text-slate-700 leading-snug">
                    · {line}
                  </li>
                ))}
              </ul>
              {active ? (
                <p className="mt-2 text-[12px] font-bold text-teal-800">Tu plan actual</p>
              ) : null}
              {plan.ancla ? (
                <p className="mt-2 text-[12px] text-slate-500 italic leading-snug">{plan.ancla}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      {current === 'free' && onUpgradePro ? (
        <button
          type="button"
          onClick={onUpgradePro}
          className="w-full min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[15px] font-bold"
        >
          Pasar a Pro — S/{PROFILE_PUBLISH_MONTHLY_PEN}/mes
        </button>
      ) : null}
      {current === 'pro' ? (
        <p className="text-[13px] text-slate-600 leading-snug">
          Max (S/{PROFILE_MAX_MONTHLY_PEN}/mes) se activa con el equipo Buscadis — escríbenos por
          WhatsApp para ADIS AI y acompañamiento.
        </p>
      ) : null}
      {current === 'free' ? (
        <p className="text-[12px] text-slate-500">
          Anual Pro: S/{PROFILE_PUBLISH_YEARLY_PEN} (vs S/{PROFILE_PUBLISH_MONTHLY_PEN * 12}{' '}
          mensual).
        </p>
      ) : null}
    </div>
  );
}
