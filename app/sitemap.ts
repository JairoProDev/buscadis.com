import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAdisosFromSupabase } from '@/lib/supabase';
import { Categoria } from '@/types';
import { getBusinessProfilePath } from '@/lib/seo/business-metadata';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

async function getPublishedBusinessProfiles(): Promise<{ slug: string; updated_at?: string | null }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await client
    .from('business_profiles')
    .select('slug, updated_at')
    .eq('is_published', true)
    .limit(5000);

  return data || [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categorias: Categoria[] = [
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad'
  ];

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // Páginas de categorías (tanto query param como ruta dedicada)
  const categoriaPages: MetadataRoute.Sitemap = categorias.flatMap((categoria) => [
    {
      url: `${siteUrl}/?categoria=${categoria}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/categoria/${categoria}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
  ]);

  // Páginas de adisos
  let adisoPages: MetadataRoute.Sitemap = [];
  
  try {
    const adisos = await getAdisosFromSupabase();
    
    adisoPages = adisos.slice(0, 1000).map((adiso) => {
      // Validar y crear fecha de forma segura
      let lastModified: Date;
      try {
        if (adiso.fechaPublicacion && adiso.horaPublicacion) {
          const dateString = `${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`;
          const date = new Date(dateString);
          // Verificar si la fecha es válida
          if (isNaN(date.getTime())) {
            lastModified = new Date(); // Usar fecha actual si es inválida
          } else {
            lastModified = date;
          }
        } else {
          lastModified = new Date(); // Usar fecha actual si faltan datos
        }
      } catch {
        lastModified = new Date(); // Usar fecha actual en caso de error
      }

      return {
        url: `${siteUrl}/${adiso.categoria}/${adiso.id}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    console.error('Error al generar sitemap de adisos:', error);
    // Continuar sin adisos si hay error
  }

  let businessPages: MetadataRoute.Sitemap = [];
  try {
    const profiles = await getPublishedBusinessProfiles();
    businessPages = profiles.map((profile) => ({
      url: `${siteUrl}${getBusinessProfilePath(profile.slug)}`,
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error al generar sitemap de negocios:', error);
  }

  return [...staticPages, ...categoriaPages, ...adisoPages, ...businessPages];
}
