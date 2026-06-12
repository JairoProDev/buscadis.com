import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { getBusinessProductAsAdiso } from '@/lib/business';
import { getIdFromSlug } from '@/lib/url';
import ClientAdisoWrapper from '@/components/ClientAdisoWrapper';
import { Categoria, Adiso } from '@/types';
import PublicBusinessPage from '@/app/negocio/[slug]/page';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

interface PageProps {
    params: Promise<{
        slug: string[]; // Catch-all array
    }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const { slug } = params;

    // Format 1: /[ubicacion]/[categoria]/[slug] (Length 3)
    // Format 2: /[categoria]/[id] (Length 2) - Legacy
    // Format 3: /[business_slug] (Length 1)

    if (slug.length === 1) {
        const targetSlug = decodeURIComponent(slug[0]);
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        try {
            const { data } = await supabaseAdmin.from('business_profiles').select('name, description, logo_url, banner_url').eq('slug', targetSlug).single();
            if (data) {
                const title = `${data.name} | Buscadis`;
                const description = data.description || `Página oficial de ${data.name} en Buscadis`;
                const imageUrl = data.logo_url || data.banner_url || `${siteUrl}/og-image.jpg`;
                return {
                    title, description,
                    openGraph: { title, description, url: `${siteUrl}/${targetSlug}`, images: [{ url: imageUrl }] }
                };
            }
        } catch (e) {
            // Ignore error, fallback to default
        }
    } else if (slug.length === 3) {
        const [ubicacion, categoria, adSlug] = slug;
        const id = getIdFromSlug(adSlug);
        if (!id) return { title: 'Adiso no encontrado' };

        try {
            let adiso = await getAdisoByIdFromSupabase(id);
            if (!adiso) {
                adiso = await getBusinessProductAsAdiso(id);
            }

            if (!adiso) return { title: 'Adiso no encontrado' };

            const title = `${adiso.titulo} en ${ubicacion} | Buscadis`;
            const description = adiso.descripcion
                ? `${adiso.descripcion.substring(0, 160)}...`
                : `Anuncio de ${adiso.categoria}: ${adiso.titulo}`;
            const url = `${siteUrl}/${ubicacion}/${categoria}/${adSlug}`;
            const imageUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl || `${siteUrl}/og-image.jpg`;

            return {
                title,
                description,
                alternates: { canonical: url },
                openGraph: {
                    title, description, url, siteName: 'Buscadis',
                    images: [{ url: imageUrl, width: 1200, height: 630, alt: adiso.titulo }],
                    locale: 'es_PE', type: 'article'
                },
                twitter: { card: 'summary_large_image', title, description, images: [imageUrl] }
            };
        } catch (e) { return { title: 'Error' }; }

    } else if (slug.length === 2) {
        const [categoria, id] = slug;

        // Check if category is valid or 'adiso' (special route for catalog products)
        const categoriasValidas: string[] = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad', 'adiso'];
        if (!categoriasValidas.includes(categoria)) return { title: 'No encontrado' };

        try {
            let adiso = await getAdisoByIdFromSupabase(id);
            if (!adiso) {
                adiso = await getBusinessProductAsAdiso(id);
            }

            if (!adiso) return { title: 'Adiso no encontrado' };

            const title = `${adiso.titulo} - ${adiso.categoria} | Buscadis`;
            const url = `${siteUrl}/${categoria}/${id}`;
            const imageUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl || `${siteUrl}/og-image.jpg`;

            return {
                title,
                // ... minimal metadata for legacy
                alternates: { canonical: url },
                openGraph: {
                    title,
                    url,
                    images: [{ url: imageUrl }]
                }
            };
        } catch (e) { return { title: 'Error' }; }
    }

    return { title: 'Buscadis' };
}

export default async function Page(props: PageProps) {
    const params = await props.params;
    const searchParams = props.searchParams ? await props.searchParams : {};
    const { slug } = params;

    let targetId: string | null = null;
    let isLegacy = false;

    if (slug.length === 1) {
        // Custom static landings live in public/{slug}/ (see next.config.js rewrites)
        if (slug[0].toLowerCase() === 'villachaco') {
            notFound();
        }
        // Format 3: /[business_slug]
        return <PublicBusinessPage params={{ slug: slug[0] }} searchParams={searchParams} />;
    } else if (slug.length === 3) {
        // New SEO URL: /[ubicacion]/[categoria]/[slug]
        targetId = getIdFromSlug(slug[2]);
    } else if (slug.length === 2) {
        // Legacy URL: /[categoria]/[id]
        // Basic check if 2nd param looks like an ID
        targetId = slug[1];
        isLegacy = true;
    }

    if (!targetId) return notFound();

    // Try Server Fetch
    let adiso: Adiso | null = null;
    try {
        adiso = await getAdisoByIdFromSupabase(targetId);
        if (!adiso) {
            // Try fetching from catalog_products if not found in adisos
            adiso = await getBusinessProductAsAdiso(targetId);
        }
    } catch (err) {
        console.error('Error fetching adiso:', err);
    }

    // Render Wrapper
    // Wrapper handles "loading..." or "storage fallback" if server adiso is null
    return <ClientAdisoWrapper id={targetId} initialAdiso={adiso} />;
}

