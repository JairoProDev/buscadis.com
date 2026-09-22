'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { listBusinessProfilesForUser } from '@/lib/business';
import AuthModal from '@/components/AuthModal';

type OrderRow = {
  id: string;
  order_number: string;
  items: { title: string; qty: number; price?: number }[];
  total: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  customer_note: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sent_wa: 'Nuevo',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  paid: 'Pagado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

/** Siguiente acción útil según estado (no saturar con 6 botones). */
function nextActions(status: string): { status: string; label: string; primary?: boolean }[] {
  switch (status) {
    case 'sent_wa':
    case 'draft':
      return [
        { status: 'confirmed', label: 'Confirmar', primary: true },
        { status: 'cancelled', label: 'Cancelar' },
      ];
    case 'confirmed':
      return [
        { status: 'preparing', label: 'En preparación', primary: true },
        { status: 'paid', label: 'Marcar pagado' },
        { status: 'cancelled', label: 'Cancelar' },
      ];
    case 'preparing':
      return [
        { status: 'paid', label: 'Ya pagó', primary: true },
        { status: 'delivered', label: 'Entregado' },
      ];
    case 'paid':
      return [{ status: 'delivered', label: 'Marcar entregado', primary: true }];
    default:
      return [];
  }
}

function readOrdenParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('orden')?.trim() || null;
}

export default function PedidosPage() {
  const { user, loading: authLoading, session } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [patching, setPatching] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    setHighlightId(readOrdenParam());
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void listBusinessProfilesForUser(user.id).then((list) => {
      const first = list[0]?.profile;
      setSlug(first?.slug ?? null);
      setBusinessName(first?.name ?? '');
    });
  }, [user, authLoading]);

  const load = useCallback(async () => {
    if (!slug || !session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/orders`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.status === 402) {
        setUpgrade(true);
        setOrders([]);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'No se pudieron cargar pedidos');
        return;
      }
      setUpgrade(false);
      setOrders(data.orders || []);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }, [slug, session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!highlightId || loading || !orders.length) return;
    const el = document.getElementById(`orden-${highlightId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, loading, orders]);

  const pending = useMemo(
    () => orders.filter((o) => !['delivered', 'cancelled', 'paid'].includes(o.status)).length,
    [orders]
  );

  async function patchOrder(
    orderId: string,
    body: { status?: string; payment_status?: string; payment_method?: string }
  ) {
    if (!slug || !session?.access_token) return;
    setPatching(orderId);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) await load();
    } finally {
      setPatching(null);
    }
  }

  if (!authLoading && !user) {
    return (
      <>
        <AuthModal abierto modoInicial="login" onCerrar={() => {}} />
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <p className="text-slate-600 text-sm">Inicia sesión para ver pedidos de tu vitrina.</p>
        </div>
      </>
    );
  }

  const publicUrl =
    typeof window !== 'undefined' && slug
      ? `${window.location.origin}/@${slug}`
      : slug
        ? `/@${slug}`
        : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tu vitrina
            </p>
            <h1 className="text-lg font-bold text-slate-900">
              Pedidos
              {pending > 0 ? (
                <span className="ml-2 text-sm font-semibold text-teal-700">
                  · {pending} pendientes
                </span>
              ) : null}
            </h1>
          </div>
          <Link href={slug ? `/@${slug}?edit=true` : '/mi-negocio'} className="text-sm font-semibold text-teal-700">
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-3 pb-16">
        {upgrade ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-950">Activa Pro — S/30 al mes</p>
            <p className="text-sm text-amber-900 mt-1 leading-relaxed">
              Aquí ves cada pedido que te llega desde tu perfil (con productos y total). Es el
              alquiler de tu local digital.
            </p>
            <Link
              href={slug ? `/@${slug}?edit=true&hub=trust` : '/mi-negocio'}
              className="inline-flex mt-3 min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white"
            >
              Activar Pro
            </Link>
          </div>
        ) : null}

        {loading ? <p className="text-sm text-slate-500">Cargando pedidos…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !upgrade && orders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <p className="font-bold text-slate-900">Aún no hay pedidos</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cuando alguien agregue productos en {businessName || 'tu perfil'} y pulse{' '}
              <strong>Enviar pedido por WhatsApp</strong>, aparecerá aquí con el detalle.
            </p>
            <ol className="text-sm text-slate-700 list-decimal pl-5 space-y-1">
              <li>Comparte tu enlace con clientes</li>
              <li>Ellos arman el pedido en tu vitrina</li>
              <li>Tú confirmas y marcas el pago (Yape/Plin)</li>
            </ol>
            {slug ? (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href={`/@${slug}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white"
                >
                  Abrir mi vitrina
                </Link>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800"
                  onClick={() => {
                    if (publicUrl) void navigator.clipboard?.writeText(publicUrl);
                  }}
                >
                  Copiar enlace para compartir
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {orders.map((o) => {
          const actions = nextActions(o.status);
          const label = STATUS_LABEL[o.status] || o.status;
          const isHighlight = highlightId === o.id;
          return (
            <article
              key={o.id}
              id={`orden-${o.id}`}
              className={`rounded-xl border bg-white p-4 shadow-sm space-y-2 ${
                isHighlight
                  ? 'border-teal-500 ring-2 ring-teal-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between gap-2 items-start">
                <div>
                  <p className="font-bold text-slate-900">{o.order_number}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(o.created_at).toLocaleString('es-PE', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    S/ {Number(o.total).toFixed(2)}
                  </p>
                  <span
                    className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      o.status === 'paid' || o.status === 'delivered'
                        ? 'bg-teal-50 text-teal-800'
                        : o.status === 'cancelled'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-50 text-amber-900'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>

              <ul className="text-sm text-slate-700 space-y-0.5">
                {(o.items || []).map((i, idx) => (
                  <li key={idx}>
                    {i.qty}× {i.title}
                  </li>
                ))}
              </ul>

              {o.customer_note ? (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5">
                  Nota: {o.customer_note}
                </p>
              ) : null}

              {actions.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {actions.map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      disabled={patching === o.id}
                      className={`text-xs font-semibold min-h-9 px-3 rounded-full border ${
                        a.primary
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-800'
                      }`}
                      onClick={() =>
                        void patchOrder(o.id, {
                          status: a.status,
                          payment_status: a.status === 'paid' ? 'paid' : undefined,
                          payment_method:
                            a.status === 'paid' ? o.payment_method || 'yape' : undefined,
                        })
                      }
                    >
                      {a.label}
                    </button>
                  ))}
                  {o.status !== 'paid' && o.status !== 'delivered' && o.status !== 'cancelled' ? (
                    <button
                      type="button"
                      disabled={patching === o.id}
                      className="text-xs font-semibold min-h-9 px-3 rounded-full border border-teal-200 bg-teal-50 text-teal-900"
                      onClick={() =>
                        void patchOrder(o.id, {
                          payment_status: 'paid',
                          payment_method: 'yape',
                          status: 'paid',
                        })
                      }
                    >
                      Pagó Yape/Plin
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </main>
    </div>
  );
}
