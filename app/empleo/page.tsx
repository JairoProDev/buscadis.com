import type { Metadata } from 'next';
import { Sofia_Sans_Condensed, Source_Sans_3 } from 'next/font/google';
import { CreadorEmpleo } from '@/components/empleo/CreadorEmpleo';

const display = Sofia_Sans_Condensed({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-aviso' });
const body = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-aviso-body' });

export const metadata: Metadata = {
  title: 'Crear aviso de empleo | Buscadis',
  description: 'Arma un aviso de trabajo, imprímelo con QR y recibe postulaciones por WhatsApp.',
  robots: { index: false, follow: false },
};

export default function EmpleoCrearPage() {
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <CreadorEmpleo />
    </div>
  );
}
