import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Categoria } from '@/types';
import { getAdisosFromSupabase } from '@/lib/supabase';
import CategoriaPageContent from './CategoriaPageContent';
import { withDefaultShareImage, getSiteUrl } from '@/lib/seo/og-image';

const siteUrl = getSiteUrl();

interface CategoriaPageProps {
  params: Promise<{
    nombre: string;
  }>;
}

const categoriasValidas: Categoria[] = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'];

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

const categoriaDescriptions: Record<Categoria, string> = {
  empleos: 'Encuentra oportunidades de trabajo y empleo en Perú',
  inmuebles: 'Compra, vende o alquila propiedades en Perú',
  vehiculos: 'Compra y vende vehículos nuevos y usados en Perú',
  servicios: 'Encuentra servicios profesionales y personales',
  productos: 'Compra y vende productos nuevos y usados',
  eventos: 'Descubre eventos y actividades en tu ciudad',
  negocios: 'Oportunidades de negocio y franquicias',
  comunidad: 'Anuncios de la comunidad y clasificados generales',
};

export async function generateMetadata({ params }: CategoriaPageProps): Promise<Metadata> {
  const { nombre } = await params;
  
  if (!categoriasValidas.includes(nombre as Categoria)) {
    return {
      title: 'Categoría no encontrada',
    };
  }

  const categoria = nombre as Categoria;
  const label = categoriaLabels[categoria];
  const description = categoriaDescriptions[categoria];

  return {
    title: `${label} - Buscadis`,
    description,
    alternates: {
      canonical: `${siteUrl}/categoria/${nombre}`,
    },
    ...withDefaultShareImage({
      title: `${label} - Buscadis`,
      description,
      url: `${siteUrl}/categoria/${nombre}`,
    }),
  };
}

export default async function CategoriaPage({ params }: CategoriaPageProps) {
  const { nombre } = await params;
  
  if (!categoriasValidas.includes(nombre as Categoria)) {
    notFound();
  }

  const categoria = nombre as Categoria;
  
  try {
    // Obtener adisos de esta categoría
    const todosAdisos = await getAdisosFromSupabase();
    const adisosCategoria = todosAdisos.filter(a => a.categoria === categoria);

    return <CategoriaPageContent categoria={categoria} adisos={adisosCategoria} />;
  } catch (error) {
    console.error('Error al cargar categoría:', error);
    notFound();
  }
}















