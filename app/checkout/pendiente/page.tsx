import Link from 'next/link';

export default function CheckoutPendientePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Pago pendiente</h1>
        <p className="text-sm text-slate-600">
          Cuando Mercado Pago confirme el pago, el negocio verá el pedido actualizado.
        </p>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white">
          Volver
        </Link>
      </div>
    </main>
  );
}
