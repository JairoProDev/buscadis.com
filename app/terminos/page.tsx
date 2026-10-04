import type { Metadata } from 'next';
import Link from 'next/link';
import { BUSCADIS_LEGAL_NAME } from '@/lib/legal/operator';

export const metadata: Metadata = {
  title: 'Términos de servicio',
  description:
    'Términos de uso de Buscadis: reglas para publicar adisos, usar la plataforma y contactar con otros usuarios en Perú.',
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Términos de servicio</h1>
          <p className="mt-2 text-sm text-slate-500">Última actualización: octubre 2026</p>
          <p className="mt-4 text-slate-600">
            Buscadis es operado por {BUSCADIS_LEGAL_NAME}. Al usar buscadis.com o la aplicación móvil
            Buscadis aceptas estos términos.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. El servicio</h2>
          <p className="text-slate-600">
            Buscadis es un marketplace de clasificados que permite publicar y descubrir adisos (anuncios) y
            perfiles de negocio. No somos parte de las transacciones entre usuarios salvo que indiquemos lo
            contrario de forma expresa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Tu cuenta</h2>
          <p className="text-slate-600">
            Para publicar o gestionar contenido debes iniciar sesión con un proveedor compatible (por ejemplo,
            Google). Eres responsable de la actividad en tu cuenta y de mantener acceso a tu correo asociado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Contenido y conducta</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Publica solo anuncios veraces, legales y que te pertenezcan o tengas derecho a promocionar.</li>
            <li>Está prohibido spam, fraude, suplantación, contenido ilegal o que vulnere derechos de terceros.</li>
            <li>Podemos retirar anuncios, limitar funciones o suspender cuentas que incumplan estas reglas.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Pagos y promociones</h2>
          <p className="text-slate-600">
            Algunas funciones (por ejemplo destacar un adiso) pueden requerir pago. Los precios y condiciones se
            muestran antes de confirmar. Los reembolsos se evalúan según la ley aplicable y la naturaleza del
            servicio digital contratado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Privacidad</h2>
          <p className="text-slate-600">
            El tratamiento de datos personales se rige por nuestra{' '}
            <Link href="/privacidad" className="font-semibold text-blue-700 underline">
              política de privacidad
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Limitación de responsabilidad</h2>
          <p className="text-slate-600">
            El servicio se ofrece &quot;tal cual&quot;, dentro de lo permitido por la ley peruana. No garantizamos
            resultados comerciales de tus anuncios ni la conducta de otros usuarios. Usa criterio al contactar y
            cerrar tratos fuera de la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Cambios y contacto</h2>
          <p className="text-slate-600">
            Podemos actualizar estos términos; la fecha arriba indica la versión vigente. Consultas:{' '}
            <a href="mailto:soporte@buscadis.com" className="font-semibold text-blue-700 underline">
              soporte@buscadis.com
            </a>
            .
          </p>
        </section>

        <p className="text-sm text-slate-500">
          <Link href="/" className="text-blue-700 underline">Volver al inicio</Link>
        </p>
      </div>
    </main>
  );
}
