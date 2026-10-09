import type { Metadata } from 'next';
import { Sofia_Sans_Condensed, Source_Sans_3 } from 'next/font/google';
import AvisoEmpleoStudio from '@/components/empleo/AvisoEmpleoStudio';

const display = Sofia_Sans_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-aviso',
});

const body = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-aviso-body',
});

export const metadata: Metadata = {
  title: 'Ayudante de cocina · Restaurante Pucará',
  description:
    'Aviso de empleo de Restaurante Pucará en Saphy, Cusco. Elige horario y postula por WhatsApp.',
  robots: { index: false, follow: false },
};

export default function ProbarAvisoEmpleoPage() {
  return (
    <AvisoEmpleoStudio className={`${display.variable} ${body.variable}`} />
  );
}
