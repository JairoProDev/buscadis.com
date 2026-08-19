'use client';

import Link from 'next/link';
import type { BusinessProfile } from '@/types/business';

type Props = {
  profile: Pick<
    BusinessProfile,
    'id' | 'slug' | 'name' | 'logo_url' | 'banner_url' | 'contact_whatsapp' | 'is_published'
  >;
  productCount: number;
  productsWithPrice: number;
};

/**
 * P8 — Onboarding 15 min: abrir la vitrina.
 */
export function VitrinaOnboardingChecklist({
  profile,
  productCount,
  productsWithPrice,
}: Props) {
  const steps = [
    {
      id: 'portada',
      ok: Boolean(profile.logo_url || profile.banner_url),
      label: 'Foto / logo de tu local',
      href: profile.slug ? `/@${profile.slug}?edit=true` : '/mi-negocio',
    },
    {
      id: 'productos',
      ok: productCount >= 3,
      label: `Al menos 3 productos (${productCount}/3)`,
      href: `/mi-negocio/catalogo?business=${profile.id}`,
    },
    {
      id: 'precios',
      ok: productsWithPrice >= 1,
      label: 'Al menos 1 precio visible',
      href: `/mi-negocio/catalogo?business=${profile.id}`,
    },
    {
      id: 'wa',
      ok: Boolean(profile.contact_whatsapp),
      label: 'WhatsApp de ventas',
      href: profile.slug ? `/@${profile.slug}?edit=true` : '/mi-negocio',
    },
    {
      id: 'live',
      ok: Boolean(profile.is_published),
      label: 'Vitrina publicada (alquiler Pro)',
      href: profile.slug ? `/@${profile.slug}?edit=true&hub=trust` : '/mi-negocio',
    },
  ];

  const done = steps.filter((s) => s.ok).length;
  const ready = done === steps.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
          Centro comercial Buscadis
        </p>
        <h2 className="text-lg font-bold text-slate-900 mt-0.5">
          {ready ? 'Tu local está abierto' : 'Abre tu vitrina en 15 minutos'}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {ready
            ? 'Comparte tu enlace y revisa pedidos en /mi-negocio/pedidos.'
            : `Checklist ${done}/${steps.length}: foto, 3 productos, precio, WhatsApp y publicar.`}
        </p>
      </div>
      <ul className="space-y-2">
        {steps.map((s) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className={`flex items-center gap-2 min-h-11 rounded-xl px-3 text-sm font-semibold ${
                s.ok
                  ? 'bg-teal-50 text-teal-900'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span aria-hidden>{s.ok ? '✓' : '○'}</span>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
      {profile.slug ? (
        <Link
          href={`/@${profile.slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white w-full"
        >
          Ver cómo te ven los clientes
        </Link>
      ) : null}
      <Link
        href="/mi-negocio/pedidos"
        className="inline-flex min-h-10 items-center justify-center text-sm font-bold text-teal-800 w-full"
      >
        Ir a pedidos →
      </Link>
    </div>
  );
}
