import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Categoria } from '@/types';
import { getMarketplaceFeed } from '@/lib/business';
import CategoriaPageContent from './CategoriaPageContent';
import { CrawlableAdisoList, ListingPagination } from '@/components/seo/CrawlableAdisoList';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAdisoItemListJsonLd } from '@/lib/seo/adiso-jsonld';
import { buildCategoryShareMetadata } from '@/lib/seo/category-metadata';

const PAGE_SIZE = 24;

interface CategoriaPageProps {
  params: Promise<{ nombre: string }>;
  searchParams: Promise<{ page?: string }>;
}

const categoriasValidas: Categoria[] = [
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad',
];

const categoriaLabels: Record<Categoria, string> = {
  empleos: 'Empleos',
  inmuebles: 'Inmuebles',
  vehiculos: 'Vehículos',
  servicios: 'Servicios',
  productos: 'Productos',
  eventos: 'Eventos',
  negocios: 'Negocios',
  comunidad: 'Comunidad',
};

export async function generateMetadata({ params }: CategoriaPageProps): Promise<Metadata> {
  const { nombre } = await params;

  if (!categoriasValidas.includes(nombre as Categoria)) {
    return { title: 'Categoría no encontrada' };
  }

  return buildCategoryShareMetadata(nombre as Categoria, {
    urlPath: `/categoria/${nombre}`,
  });
}

export default async function CategoriaPage({ params, searchParams }: CategoriaPageProps) {
  const { nombre } = await params;
  const sp = await searchParams;

  if (!categoriasValidas.includes(nombre as Categoria)) {
    notFound();
  }

  const categoria = nombre as Categoria;
  const page = Math.max(1, Number.parseInt(sp.page || '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const adisosCategoria = await getMarketplaceFeed({
      limit: PAGE_SIZE + 1,
      offset,
      soloActivos: true,
      categoria,
    });
    const hasNext = adisosCategoria.length > PAGE_SIZE;
    const pageAdisos = hasNext ? adisosCategoria.slice(0, PAGE_SIZE) : adisosCategoria;
    const label = categoriaLabels[categoria];
    const basePath = `/categoria/${nombre}`;

    return (
      <>
        <JsonLd
          data={buildAdisoItemListJsonLd(pageAdisos, {
            name: `${label} en Buscadis`,
            urlPath: page > 1 ? `${basePath}?page=${page}` : basePath,
          })}
        />
        {/* Always in HTML for crawlers (client may redirect humans to /?categoria=) */}
        <CrawlableAdisoList
          adisos={pageAdisos}
          heading={`${label} — página ${page}`}
          visuallyHidden
        />
        <ListingPagination basePath={basePath} page={page} hasNext={hasNext} />
        <CategoriaPageContent categoria={categoria} adisos={pageAdisos} />
      </>
    );
  } catch (error) {
    console.error('Error al cargar categoría:', error);
    notFound();
  }
}
