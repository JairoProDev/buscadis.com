import Link from 'next/link';
import { BUSCADIS_LEGAL_NAME, BUSCADIS_PURPOSE_SUMMARY } from '@/lib/legal/operator';

/**
 * Copy de propósito en HTML inicial para crawlers y lectores de pantalla.
 * No ocupa espacio visual (sr-only); el usuario ve el feed de inmediato.
 * Misma información que metadata, JSON-LD y el pie legal al final del scroll.
 */
export function HomeCrawlerBrief() {
  return (
    <div className="sr-only">
      <h1>Buscadis</h1>
      <p>{BUSCADIS_PURPOSE_SUMMARY}</p>
      <p>Operado por {BUSCADIS_LEGAL_NAME}.</p>
      <p>
        <Link href="/privacidad">Política de privacidad</Link>
        {' · '}
        <Link href="/terminos">Términos de servicio</Link>
        {' · '}
        <Link href="/guia">Cómo funciona Buscadis</Link>
      </p>
    </div>
  );
}
