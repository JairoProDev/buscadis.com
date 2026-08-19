'use client';

import { useCallback, useEffect, useState } from 'react';
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
  created_at: string;
};

const STATUS_ACTIONS: { status: string; label: string }[] = [
  { status: 'confirmed', label: 'Confirmar' },
  { status: 'preparing', label: 'Preparando' },
  { status: 'paid', label: 'Marcar pagado' },
  { status: 'delivered', label: 'Entregado' },
  { status: 'cancelled', label: 'Cancelar' },
];

export default function PedidosPage() {
  const { user, loading: authLoading, session } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    void listBusinessProfilesForUser(user.id).then((list) => {
      const s = list[0]?.profile.slug ?? null;
      setSlug(s);
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

  async function patchOrder(
    orderId: string,
    body: { status?: string; payment_status?: string; payment_method?: string }
  ) {
    if (!slug || !session?.access_token) return;
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
    if (res.ok) void load();
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Centro comercial
            </p>
            <h1 className="text-lg font-bold text-slate-900">Pedidos</h1>
          </div>
          <Link href="/mi-negocio" className="text-sm font-semibold text-teal-700">
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-3">
        {upgrade ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-950">Alquiler Pro — S/30/mes</p>
            <p className="text-sm text-amber-900 mt-1">
              Los pedidos estructurados son parte de tu vitrina Pro. Activa el plan para ver y
              gestionar pedidos de clientes.
            </p>
            <Link
              href={slug ? `/@${slug}?edit=true&hub=trust` : '/mi-negocio'}
              className="inline-flex mt-3 min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white"
            >
              Activar Pro
            </Link>
          </div>
        ) : null}

        {loading ? <p className="text-sm text-slate-500">Cargando…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !upgrade && orders.length === 0 ? (
          <p className="text-sm text-slate-600 leading-relaxed">
            Aún no hay pedidos. Cuando un cliente agregue productos en tu Perfil Vivo y envíe el
            pedido por WhatsApp, aparecerá aquí.
          </p>
        ) : null}

        {orders.map((o) => (
          <article
            key={o.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2"
          >
            <div className="flex justify-between gap-2">
              <p className="font-bold text-slate-900">{o.order_number}</p>
              <p className="text-sm font-semibold text-slate-700">
                S/ {Number(o.total).toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {new Date(o.created_at).toLocaleString('es-PE')} · {o.status} · pago{' '}
              {o.payment_status}
            </p>
            <ul className="text-sm text-slate-700 space-y-0.5">
              {(o.items || []).map((i, idx) => (
                <li key={idx}>
                  {i.qty}× {i.title}
                </li>
              ))}
            </ul>
            {o.customer_note ? (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                Nota: {o.customer_note}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {STATUS_ACTIONS.map((a) => (
                <button
                  key={a.status}
                  type="button"
                  className="text-xs font-semibold min-h-9 px-3 rounded-full border border-slate-200 bg-slate-50 text-slate-800"
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
              <button
                type="button"
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
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
