import Link from 'next/link';

export default function PromocionarErrorPage() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-4xl mb-3">❌</p>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">No se completó el pago</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
        Puedes intentar de nuevo desde tu adiso o escribirnos si necesitas ayuda.
      </p>
      <Link href="/" className="px-6 py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold">
        Volver al inicio
      </Link>
    </main>
  );
}
