import { createAdisoInSupabase } from './supabase';
import { Adiso, Categoria, Profile } from '@/types';
import { DraftListingData } from '@/components/ai/DraftListingCard';
import { newAdisoId } from '@/lib/url';

/**
 * Publica un anuncio "rápido" generado a partir del buscador unificado
 * (búsqueda / publicación con IA).
 */
export async function publishQuickAd(
    userId: string,
    profile: Profile | null,
    draft: DraftListingData
): Promise<Adiso> {
    const now = new Date();

    const adiso: Adiso = {
        id: newAdisoId(),
        categoria: draft.categoria as Categoria,
        titulo: draft.titulo,
        descripcion: draft.descripcion,
        contacto: profile?.telefono || 'No especificado',
        ubicacion: profile?.ubicacion || 'Cusco',
        fechaPublicacion: now.toISOString().split('T')[0],
        horaPublicacion: now.toTimeString().slice(0, 5),
        tamaño: 'miniatura',
        usuario_id: userId,
        user_id: userId,
        precio: draft.precio,
    };

    const created = await createAdisoInSupabase(adiso);
    const { createStoryFromAdiso } = await import('@/lib/stories/adiso-sync');
    void createStoryFromAdiso(userId, created);
    return created;
}

export async function publishQuickAdWithStory(
    userId: string,
    profile: Profile | null,
    draft: DraftListingData
): Promise<Adiso> {
    return publishQuickAd(userId, profile, draft);
}
