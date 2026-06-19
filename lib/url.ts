import { Adiso } from '@/types';
import { getSiteUrl } from '@/lib/seo/og-image';

// Helper to normalize strings for URLs
const normalizeString = (str: string): string => {
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const createAdisoSlug = (adiso: Adiso): string => {
    const titleSlug = normalizeString(adiso.titulo);
    // Ensure the ID is always at the end to be extractable
    return `${titleSlug}-${adiso.id}`;
};

export const getIdFromSlug = (slug: string): string => {
    // Extract the last part of the slug which is the ID
    const parts = slug.split('-');
    return parts[parts.length - 1];
};

export const getAdisoUrl = (adiso: Adiso): string => {
    const ubicacionStr = typeof adiso.ubicacion === 'string'
        ? adiso.ubicacion
        : (adiso.ubicacion?.distrito || adiso.ubicacion?.provincia || 'peru');

    const locationSlug = normalizeString(ubicacionStr);
    const categorySlug = normalizeString(adiso.categoria);
    const adSlug = createAdisoSlug(adiso);

    return `/${locationSlug}/${categorySlug}/${adSlug}`;
};

/** URL absoluta del adiso para compartir (WhatsApp, email, push, etc.) */
export const getAdisoAbsoluteUrl = (adiso: Adiso): string => {
    return `${getSiteUrl()}${getAdisoUrl(adiso)}`;
};
