'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { ClaimedBusinessSummary } from '@/lib/business/claimed-business';

const STORAGE_PREFIX = 'buscadis_business_welcome_v1_';

export function markBusinessWelcomeSeen(businessId: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${businessId}`, '1');
  } catch {
    // ignore
  }
}

export function hasSeenBusinessWelcome(businessId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${businessId}`) === '1';
  } catch {
    return false;
  }
}

/**
 * Pick which business to welcome the user about after login/claim.
 */
export function pickWelcomeBusiness(
  businesses: ClaimedBusinessSummary[]
): ClaimedBusinessSummary | null {
  if (!businesses?.length) return null;
  const justClaimed = businesses.find((b) => b.justClaimed);
  if (justClaimed) return justClaimed;
  const firstOwnerUnseen = businesses.find(
    (b) => b.role === 'owner' && !hasSeenBusinessWelcome(b.id)
  );
  return firstOwnerUnseen || null;
}

type Props = {
  business: ClaimedBusinessSummary;
  onDismiss: () => void;
};

export default function BusinessAccessWelcome({ business, onDismiss }: Props) {
  if (typeof document === 'undefined') return null;

  const publicPath = `/@${business.slug}`;
  const editPath = `/@${business.slug}?edit=true`;
  const isOwner = business.role === 'owner';
  const title = business.justClaimed
    ? `¡${business.name} ya es tuyo!`
    : isOwner
      ? `Administras ${business.name}`
      : `Formas parte de ${business.name}`;

  const subtitle = business.justClaimed
    ? 'Tu correo quedó vinculado a esta página. Puedes verla y editarla cuando quieras.'
    : isOwner
      ? 'Desde aquí puedes ver tu página pública o abrir el editor para actualizarla.'
      : 'Como administrador puedes ayudar a editar la página y gestionar el equipo.';

  const dismiss = () => {
    markBusinessWelcomeSeen(business.id);
    onDismiss();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-welcome-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={dismiss}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-6 pt-6 pb-4">
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logo_url}
              alt=""
              className="w-14 h-14 rounded-xl object-cover border border-white shadow-sm mb-3"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-sky-100 text-sky-700 font-bold text-xl flex items-center justify-center mb-3">
              {(business.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <h2 id="business-welcome-title" className="text-xl font-bold text-slate-900 m-0">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 m-0 leading-relaxed">{subtitle}</p>
        </div>
        <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
          <Link
            href={editPath}
            onClick={dismiss}
            className="w-full text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 transition-colors"
          >
            Editar mi página
          </Link>
          <Link
            href={publicPath}
            onClick={dismiss}
            className="w-full text-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-sm py-3 transition-colors"
          >
            Ver página pública
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
