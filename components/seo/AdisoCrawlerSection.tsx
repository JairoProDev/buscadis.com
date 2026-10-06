import Link from 'next/link';
import type { Adiso } from '@/types';
import {
  formatPrecioDisplay,
  formatUbicacionCorta,
  getJobSalaryLabel,
  sanitizeAdisoDescripcion,
  toDisplayTitle,
} from '@/lib/adiso-display';
import { getAdisoUrl } from '@/lib/url';

const CATEGORIA_LABELS: Record<Adiso['categoria'], string> = {
  empleos: 'Empleos',
  inmuebles: 'Inmuebles',
  vehiculos: 'Vehículos',
  servicios: 'Servicios',
  productos: 'Productos',
  eventos: 'Eventos',
  negocios: 'Negocios',
  comunidad: 'Comunidad',
};

function formatPublishedAt(adiso: Adiso): string | null {
  if (!adiso.fechaPublicacion) return null;
  const time = adiso.horaPublicacion ? `${adiso.horaPublicacion}:00` : '00:00:00';
  const iso = `${adiso.fechaPublicacion}T${time}`;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return adiso.fechaPublicacion;
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Lima',
  });
}

/**
 * HTML crítico del adiso para crawlers y lectores de pantalla (sr-only).
 * El detalle interactivo sigue en el cliente.
 */
export function AdisoCrawlerSection({ adiso }: { adiso: Adiso }) {
  const title = toDisplayTitle(adiso.titulo) || adiso.titulo;
  const description = sanitizeAdisoDescripcion(adiso.descripcion);
  const categoriaLabel = CATEGORIA_LABELS[adiso.categoria];
  const ubicacion =
    typeof adiso.ubicacion === 'string'
      ? adiso.ubicacion
      : formatUbicacionCorta(adiso.ubicacion) || 'Perú';
  const salary = adiso.categoria === 'empleos' ? getJobSalaryLabel(adiso) : null;
  const price =
    adiso.categoria !== 'empleos' ? formatPrecioDisplay(adiso) : null;
  const published = formatPublishedAt(adiso);
  const canonicalPath = getAdisoUrl(adiso);

  return (
    <article className="sr-only" aria-label={title}>
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Buscadis</Link>
          </li>
          <li>
            <Link href={`/categoria/${adiso.categoria}`}>{categoriaLabel}</Link>
          </li>
          <li>
            <span>{title}</span>
          </li>
        </ol>
      </nav>
      <h1>{title}</h1>
      <p>
        {categoriaLabel} en {ubicacion}. Publicado en Buscadis
        {published ? ` el ${published}` : ''}.
      </p>
      {salary ? <p>Remuneración: {salary}</p> : null}
      {price ? <p>Precio: {price}</p> : null}
      {description ? <p>{description}</p> : null}
      <p>
        <Link href={canonicalPath}>Ver adiso en Buscadis</Link>
      </p>
    </article>
  );
}
