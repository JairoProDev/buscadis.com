import Link from 'next/link';

export default function CheckoutExitoPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Pago recibido</h1>
        <p className="text-sm text-slate-600">
          Gracias. El negocio verá tu pedido como pagado
          {searchParams.order ? ` (${searchParams.order})` : ''}.
        </p>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white">
          Volver a Buscadis
        </Link>
      </div>
    </main>
  );
}
