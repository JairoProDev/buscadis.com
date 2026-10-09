import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Versiones del aviso de empleo',
  robots: { index: false, follow: false },
};

const VERSIONS = [
  {
    href: '/empleo-lab/gemini-creator.html',
    name: 'Gemini · Creator',
    what: 'Taller oscuro para armar el afiche. Dos salidas: mural A4 y estado 9:16. Presets, descarga PNG e impresión aislada.',
  },
  {
    href: '/empleo-lab/gemini-suite.html',
    name: 'Gemini · Suite',
    what: 'Formulario a la izquierda y vista en vivo a la derecha: celular o afiche con talones. Chips de puestos, pausar la vacante, copiar texto.',
  },
  {
    href: '/empleo-lab/gemini-postulante.html',
    name: 'Gemini · Postulante',
    what: 'La página que abre el QR. Sueldo y horario arriba, ficha de 20 segundos y otros avisos debajo.',
  },
  {
    href: '/empleo/probar',
    name: 'Buscadis · prueba',
    what: 'La versión hecha en la app, con los dos horarios reales de Pucará y la ficha antes de WhatsApp.',
  },
  {
    href: '/empleo-lab/fusion.html',
    name: 'Fusión',
    what: 'La suite de Gemini, con datos de Pucará, ficha en vez de un chat vacío, talones sin teléfono y avisos cerca.',
  },
];

export default function VersionesEmpleoPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '32px 20px 64px',
        fontFamily: 'system-ui, sans-serif',
        color: '#14343f',
      }}
    >
      <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, fontWeight: 700 }}>
        Laboratorio
      </p>
      <h1 style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '8px 0' }}>
        Cinco versiones del mismo aviso
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.45, maxWidth: 560 }}>
        Ábrelas una por una. Las tres de Gemini están igual que en los HTML. La fusión junta lo que conviene probar junto. El detalle de ideas buenas y malas está en el documento del laboratorio.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {VERSIONS.map((item) => (
          <li key={item.href} style={{ border: '1px solid #c5d2d8', borderRadius: 16, padding: 16 }}>
            <Link href={item.href} style={{ color: 'inherit', fontWeight: 800, fontSize: 18 }}>
              {item.name}
            </Link>
            <p style={{ margin: '6px 0 0', lineHeight: 1.4 }}>{item.what}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
