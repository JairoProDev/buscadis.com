import { supabase, dbToAdiso } from './supabase';
import { UserAdInteraction, AdInteractionType, Adiso } from '@/types';
import { extractKeywords } from './interest-keywords';

export type DismissReason =
    | 'no_interesa'
    | 'ya_lo_tengo'
    | 'repetido'
    | 'precio'
    | 'ubicacion'
    | 'otro';

export const DISMISS_REASONS: { id: DismissReason; label: string }[] = [
    { id: 'no_interesa', label: 'No me interesa esta categoría' },
    { id: 'ya_lo_tengo', label: 'Ya tengo algo así' },
    { id: 'repetido', label: 'Anuncio repetido' },
    { id: 'precio', label: 'El precio no me conviene' },
    { id: 'ubicacion', label: 'Está muy lejos de mí' },
    { id: 'otro', label: 'Otro motivo' },
];

/**
 * Obtiene los adisos ocultos (not_interested)
 */
export async function getAdisosOcultos(userId: string): Promise<Adiso[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('user_ad_interactions')
        .select('adiso_id')
        .eq('user_id', userId)
        .eq('interaction_type', 'not_interested');

    if (error || !data || data.length === 0) return [];

    const adisoIds = data.map((d: any) => d.adiso_id);

    // Fetch adisos
    const { data: adisos, error: adisosError } = await supabase
        .from('adisos')
        .select('*')
        .in('id', adisoIds);

    if (adisosError) return [];

    return (adisos || []).map((row: any) => dbToAdiso(row));
}

/**
 * Restaura un adiso oculto (elimina la interacción not_interested)
 */
export async function restaurarAdisoOculto(userId: string, adisoId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
        .from('user_ad_interactions')
        .delete()
        .eq('user_id', userId)
        .eq('adiso_id', adisoId)
        .eq('interaction_type', 'not_interested');

    if (error) throw error;
}

export async function registrarInteraccion(
    userId: string,
    adisoId: string,
    tipo: AdInteractionType
): Promise<UserAdInteraction | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('user_ad_interactions')
            .insert({
                user_id: userId,
                adiso_id: adisoId,
                interaction_type: tipo
            })
            .select()
            .single();

        if (error) {
            // Ignorar error de duplicados
            if (error.code === '23505') return null;
            console.error('Error al registrar interacción:', error);
            return null;
        }

        return data as UserAdInteraction;
    } catch (err) {
        console.error('Error en registrarInteraccion:', err);
        return null;
    }
}

/**
 * Registra un signal de interés (favorito = +1, descarte = -1) en el perfil
 * agregado del usuario: afinidad por categoría, afinidad por keywords del
 * título/descripción y, para descartes, el motivo elegido.
 */
export async function recordInterestSignal(
    userId: string,
    adiso: Adiso,
    delta: 1 | -1,
    reason?: DismissReason
): Promise<void> {
    if (!supabase) return;

    const keywords = extractKeywords(`${adiso.titulo} ${adiso.descripcion}`);

    try {
        const { error } = await supabase.rpc('fn_record_interest_signal', {
            p_user_id: userId,
            p_categoria: adiso.categoria,
            p_keywords: keywords,
            p_delta: delta,
            p_reason: reason || null,
        });

        if (error) {
            console.error('Error al registrar señal de interés:', error);
        }
    } catch (err) {
        console.error('Error en recordInterestSignal:', err);
    }
}

/**
 * Actualiza el motivo de descarte (reason) de una interacción 'not_interested'
 * ya existente.
 */
export async function setInteractionReason(
    userId: string,
    adisoId: string,
    reason: DismissReason
): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
        .from('user_ad_interactions')
        .update({ reason })
        .eq('user_id', userId)
        .eq('adiso_id', adisoId)
        .eq('interaction_type', 'not_interested');

    if (error) {
        console.error('Error al guardar motivo de descarte:', error);
    }
}

export interface UserInterestProfile {
    categoriaSignals: Record<string, number>;
    keywordSignals: Record<string, number>;
    dismissReasons: Record<string, number>;
}

/**
 * Obtiene el perfil agregado de intereses del usuario (afinidad por
 * categoría y por keywords), usado para personalizar el asistente de IA
 * y las recomendaciones del feed principal.
 */
export async function getUserInterestProfile(userId: string): Promise<UserInterestProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_interest_profile')
        .select('categoria_signals, keyword_signals, dismiss_reasons')
        .eq('user_id', userId)
        .maybeSingle();

    if (error || !data) return null;

    return {
        categoriaSignals: (data.categoria_signals as Record<string, number>) || {},
        keywordSignals: (data.keyword_signals as Record<string, number>) || {},
        dismissReasons: (data.dismiss_reasons as Record<string, number>) || {},
    };
}

/**
 * Obtiene las interacciones de un usuario para una lista de adisos (optimización)
 * o para todos si no se pasa lista.
 * Retorna un Set de IDs para búsqueda rápida.
 */
export async function getInteraccionesUsuario(
    userId: string,
    tipo: AdInteractionType
): Promise<Set<string>> {
    if (!supabase) return new Set();

    const { data, error } = await supabase
        .from('user_ad_interactions')
        .select('adiso_id')
        .eq('user_id', userId)
        .eq('interaction_type', tipo);

    if (error) {
        console.error('Error obteniendo interacciones:', error);
        return new Set();
    }

    return new Set(data.map((d: any) => d.adiso_id));
}
