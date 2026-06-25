import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad de Buscadis — cómo recopilamos, usamos y protegemos tus datos.',
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Política de privacidad</h1>
          <p className="mt-2 text-sm text-slate-500">Última actualización: junio 2026</p>
          <p className="mt-4 text-slate-600">
            Buscadis es operado por ADIS TECHNOLOGICAL PLATFORMS S.A.C. Esta política describe cómo tratamos
            tus datos cuando usas buscadis.com y la aplicación móvil Buscadis.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Datos que recopilamos</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>
              <strong>Cuenta:</strong> nombre, correo electrónico y datos de perfil que proporciones al registrarte.
            </li>
            <li>
              <strong>Anuncios:</strong> título, descripción, imágenes, ubicación y datos de contacto que publiques.
            </li>
            <li>
              <strong>Uso del servicio:</strong> búsquedas, favoritos, interacciones y eventos de navegación para
              mejorar la plataforma.
            </li>
            <li>
              <strong>App móvil:</strong> token de notificaciones push, versión de la app, modelo de dispositivo y
              eventos técnicos anónimos.
            </li>
            <li>
              <strong>Comunicaciones:</strong> mensajes que nos envíes por soporte o formularios de solicitud.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Cómo usamos tus datos</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Mostrar y gestionar tus anuncios y tu cuenta.</li>
            <li>Conectar compradores y vendedores mediante la plataforma.</li>
            <li>Enviar notificaciones sobre actividad relevante (si las autorizas).</li>
            <li>Prevenir fraude, abuso y mejorar la seguridad.</li>
            <li>Analizar el uso agregado para mejorar el producto.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Compartición con terceros</h2>
          <p className="text-slate-600">
            Usamos proveedores de infraestructura y servicios (alojamiento, base de datos, analítica, pagos y
            notificaciones push) que procesan datos en nuestro nombre bajo contrato. No vendemos tus datos
            personales a terceros para publicidad externa.
          </p>
          <p className="text-slate-600">
            Herramientas de medición activas en buscadis.com (según tu consentimiento de cookies):
          </p>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>
              <strong>Vercel Analytics y Speed Insights</strong> — tráfico agregado y rendimiento (Core Web Vitals).
            </li>
            <li>
              <strong>Google Analytics 4</strong> — páginas visitadas, búsquedas y conversiones (solo si aceptas
              cookies de analítica).
            </li>
            <li>
              <strong>Microsoft Clarity</strong> — mapas de calor y grabaciones de sesión anonimizadas (solo si
              aceptas cookies de analítica).
            </li>
            <li>
              <strong>Sentry</strong> — detección de errores técnicos para mantener la estabilidad del servicio.
            </li>
            <li>
              <strong>Analítica propia (Supabase)</strong> — eventos de producto como búsquedas, clics en anuncios y
              contactos por WhatsApp, necesarios para mejorar la plataforma.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Conservación y seguridad</h2>
          <p className="text-slate-600">
            Conservamos los datos mientras tu cuenta esté activa o sea necesario para prestar el servicio y cumplir
            obligaciones legales. Aplicamos medidas técnicas y organizativas razonables para proteger la
            información.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Tus derechos</h2>
          <p className="text-slate-600">
            Puedes acceder, corregir o solicitar la eliminación de tu cuenta y datos personales mediante nuestro
            formulario oficial:
          </p>
          <Link href="/account-deletion" className="font-semibold text-blue-700 underline">
            Solicitar eliminación de cuenta o datos
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Menores de edad</h2>
          <p className="text-slate-600">
            Buscadis no está dirigido a menores de 13 años. Si detectamos una cuenta de un menor sin consentimiento
            parental, podemos eliminarla.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Contacto</h2>
          <p className="text-slate-600">
            Para consultas sobre privacidad:{' '}
            <a href="mailto:soporte@buscadis.com" className="font-semibold text-blue-700 underline">
              soporte@buscadis.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
