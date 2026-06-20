import { supabase } from './supabase';
import type { Adiso, Categoria } from '@/types';
import { BusinessProfile } from '@/types/business';
import type { BusinessMemberRole, BusinessWithRole } from './business-access';

export const BUSINESS_TABLE = 'business_profiles';

const VALID_BUSINESS_COLUMNS = [
    'id', 'user_id', 'created_by', 'slug', 'name', 'description',
    'logo_url', 'banner_url', 'tagline', 'theme_color', 'theme_mode',
    'layout_style', 'contact_email', 'contact_phone', 'contact_whatsapp',
    'contact_address', 'contact_maps_url', 'business_hours', 'social_links',
    'custom_blocks', 'profile_blocks', 'template_id', 'theme_preset', 'template_applied_at',
    'meta_title', 'meta_description', 'og_image_url',
    'announcement_text', 'announcement_active', 'is_verified',
    'pixel_facebook', 'pixel_tiktok', 'is_vacation_mode', 'custom_domain',
    'show_contact_form', 'favicon_url', 'font_family',
    'is_published', 'view_count', 'created_at', 'updated_at',
];

export function sanitizeBusinessProfilePayload(profile: any) {
    const payload: any = {};
    for (const key of Object.keys(profile)) {
        if (VALID_BUSINESS_COLUMNS.includes(key) && profile[key] !== undefined) {
            payload[key] = profile[key];
        }
    }
    return payload;
}


/**
 * All businesses the user can access (membership / RBAC).
 * Ordered by business created_at ascending (stable default).
 */
export async function listBusinessProfilesForUser(userId: string): Promise<BusinessWithRole[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('business_members')
        .select(`
      role,
      business_profiles (*)
    `)
        .eq('user_id', userId)
        .eq('status', 'active');

    if (error) {
        console.error('Error listing business profiles for user:', error);
        return [];
    }

    const out: BusinessWithRole[] = [];
    for (const row of data || []) {
        const raw = row as {
            role: BusinessMemberRole;
            business_profiles: BusinessProfile | BusinessProfile[] | null;
        };
        const bp = Array.isArray(raw.business_profiles)
            ? raw.business_profiles[0]
            : raw.business_profiles;
        if (bp) {
            out.push({ profile: bp, role: raw.role });
        }
    }

    out.sort(
        (a, b) =>
            new Date(a.profile.created_at).getTime() - new Date(b.profile.created_at).getTime()
    );
    return out;
}

/**
 * @deprecated Prefer listBusinessProfilesForUser — kept for backward compatibility:
 * returns the first business the user belongs to (oldest).
 */
export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    const list = await listBusinessProfilesForUser(userId);
    return list[0]?.profile ?? null;
}

export async function getBusinessProfileByIdForUser(
    businessId: string,
    userId: string
): Promise<BusinessWithRole | null> {
    const list = await listBusinessProfilesForUser(userId);
    return list.find((x) => x.profile.id === businessId) ?? null;
}

export async function getBusinessProfileBySlug(slug: string): Promise<BusinessProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(BUSINESS_TABLE)
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching business profile by slug:', error);
        return null;
    }

    return data as BusinessProfile;
}

export async function createBusinessProfile(profile: Partial<BusinessProfile>): Promise<BusinessProfile | null> {
    if (!supabase) return null;

    const payload = sanitizeBusinessProfilePayload(profile);
    const { data, error } = await supabase
        .from(BUSINESS_TABLE)
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error creating business profile:', error);
        throw error;
    }

    return data as BusinessProfile;
}

export async function updateBusinessProfile(
    businessId: string,
    updates: Partial<BusinessProfile>
): Promise<BusinessProfile | null> {
    if (!supabase) return null;

    // Remove fields that shouldn't be updated directly or are read-only
    const { id, created_at, updated_at, user_id, ...rawUpdates } = updates as any;
    const cleanUpdates = sanitizeBusinessProfilePayload(rawUpdates);

    const { data, error } = await supabase
        .from(BUSINESS_TABLE)
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', businessId)
        .select()
        .single();

    if (error) {
        console.error('Error updating business profile:', error);
        throw error;
    }

    return data as BusinessProfile;
}

export async function saveBusinessProfile(profile: BusinessProfile): Promise<BusinessProfile | null> {
    if (!profile.id) {
        throw new Error('saveBusinessProfile requires profile.id');
    }
    return updateBusinessProfile(profile.id, profile);
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
    if (!supabase) return false;

    const { count, error } = await supabase
        .from(BUSINESS_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

    if (error) {
        console.error('Error checking slug:', error);
        return false;
    }

    return count === 0;
}

export async function uploadBusinessImage(file: File, userId: string, type: 'logo' | 'banner'): Promise<string | null> {
    if (!supabase) return null;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

        // Use 'catalog-images' bucket which exists and is public
        const bucketName = 'catalog-images';

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading image to storage:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (e) {
        console.error("Exception uploading image:", e);
        return null;
    }
}

export async function getBusinessCatalog(businessProfileId: string): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('business_profile_id', businessProfileId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching catalog:', error);
        return [];
    }

    return data || [];
}

export async function getBusinessProductAsAdiso(productId: string): Promise<any | null> {
    if (!supabase) return null;

    try {
        // Fetch product and business profile
        const { data: product, error } = await supabase
            .from('catalog_products')
            .select(`
                *,
                business_profiles (
                    id,
                    name,
                    slug,
                    contact_phone,
                    contact_whatsapp,
                    contact_address,
                    contact_email,
                    logo_url
                )
            `)
            .eq('id', productId)
            .single();

        if (error || !product) {
            // Try fetching by slug if not UUID
            if (error?.code === '22P02') return null; // Invalid UUID
            return null;
        }

        const business = product.business_profiles;

        // Map to Adiso
        // Note: Using 'any' return type temporarily to match Adiso interface looseness or just return mapped object
        // The consumer expects Adiso-like object
        return {
            id: product.id,
            titulo: product.title,
            descripcion: product.description,
            precio: product.price,
            imagenesUrls: Array.isArray(product.images)
                ? product.images.map((img: any) => typeof img === 'string' ? img : img.url)
                : [],
            imagenUrl: Array.isArray(product.images) && product.images.length > 0
                ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
                : '',
            categoria: product.category || 'Otros',
            ubicacion: business?.contact_address || 'Ubicación no especificada',
            usuarioId: product.user_id,
            slug: product.id, // Or product.slug if exists

            // Extra context for UI
            business: {
                id: business?.id,
                name: business?.name,
                slug: business?.slug,
                logoUrl: business?.logo_url,
                whatsapp: business?.contact_whatsapp
            },

            // Required Adiso fields (mocked/default)
            fechaPublicacion: product.created_at,
            horaPublicacion: new Date(product.created_at).toLocaleTimeString(),
            contacto: business?.contact_whatsapp || business?.contact_phone || '',
            vistas: product.view_count || 0,
            contactos: product.click_count || 0,
            estaActivo: product.status === 'published'
        };

    } catch (e) {
        console.error('Error fetching business product:', e);
        return null;
    }
}

const MARKETPLACE_CATEGORIES: Categoria[] = [
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad',
];

function normalizeCatalogCategory(category?: string | null): Categoria {
    const value = (category || '').trim().toLowerCase();
    if (MARKETPLACE_CATEGORIES.includes(value as Categoria)) {
        return value as Categoria;
    }
    if (value.includes('emple')) return 'empleos';
    if (value.includes('inmueble') || value.includes('casa') || value.includes('terreno')) return 'inmuebles';
    if (value.includes('veh')) return 'vehiculos';
    if (value.includes('serv')) return 'servicios';
    if (value.includes('event')) return 'eventos';
    if (value.includes('negoc')) return 'negocios';
    if (value.includes('comun')) return 'comunidad';
    return 'productos';
}

function catalogProductToAdiso(product: any): Adiso {
    const business = product.business_profiles;
    const images = Array.isArray(product.images)
        ? product.images
            .map((img: any) => (typeof img === 'string' ? img : img?.url))
            .filter(Boolean)
        : [];
    const createdAt = product.created_at ? new Date(product.created_at) : new Date();
    const fechaPublicacion = createdAt.toISOString();

    return {
        id: product.id,
        titulo: product.title || 'Producto',
        descripcion: product.description || '',
        precio: typeof product.price === 'number' ? product.price : undefined,
        moneda: product.currency === 'USD' ? 'USD' : 'PEN',
        imagenesUrls: images,
        imagenUrl: images[0],
        categoria: normalizeCatalogCategory(product.category),
        ubicacion: business?.contact_address || 'Perú',
        fechaPublicacion,
        horaPublicacion: createdAt.toISOString().slice(11, 19),
        contacto: business?.contact_whatsapp || business?.contact_phone || business?.contact_email || '',
        vistas: product.view_count || 0,
        contactos: product.click_count || 0,
        estaActivo: product.status === 'published',
        esHistorico: false,
        user_id: product.user_id || business?.user_id || undefined,
        usuario_id: product.user_id || business?.user_id || undefined,
        privateData: {
            ...(product.ai_metadata || {}),
            source: 'catalog_product',
            business_profile_id: product.business_profile_id,
        },
        vendedor: {
            id: business?.id || product.user_id || product.id,
            nombre: business?.name || 'Negocio',
            avatarUrl: business?.logo_url || undefined,
            esVerificado: Boolean(business?.is_verified),
            nivelVerificacion: business?.is_verified ? 'negocio' : 'basico',
        },
    };
}

export async function getCatalogProductsAsAdisos(options?: {
    limit?: number;
    offset?: number;
    categoria?: string;
    busqueda?: string;
}): Promise<Adiso[]> {
    if (!supabase) return [];

    try {
        let query = supabase
            .from('catalog_products')
            .select(`
                *,
                business_profiles (
                    id,
                    user_id,
                    name,
                    slug,
                    logo_url,
                    contact_phone,
                    contact_whatsapp,
                    contact_email,
                    contact_address,
                    is_verified,
                    is_published
                )
            `)
            .eq('status', 'published');

        if (options?.categoria && options.categoria !== 'todos') {
            query = query.ilike('category', `%${options.categoria}%`);
        }

        if (options?.busqueda) {
            const q = options.busqueda.trim();
            if (q) {
                query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
            }
        }

        query = query.order('created_at', { ascending: false });

        if (options?.limit) {
            const from = options.offset || 0;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        } else {
            query = query.limit(20);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching catalog products for marketplace:', error);
            return [];
        }

        const publishedProducts = (data || []).filter((p: any) => {
            const profile = p.business_profiles;
            if (!profile) return true;
            return profile.is_published !== false;
        });

        return publishedProducts.map(catalogProductToAdiso);
    } catch (error) {
        console.error('Error mapping catalog products to adisos:', error);
        return [];
    }
}

// Helper to get extension from mime type
function getExtensionFromMime(mime: string): string {
    const types: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg'
    };
    return types[mime] || 'jpg';
}

export async function uploadProductImage(file: File, userId: string): Promise<string> {
    if (!supabase) throw new Error('Supabase no inicializado');

    // Use the bucket that exists in the project (catalog-images based on prevalence in codebase)
    const bucketName = 'catalog-images';

    // Validate file size (e.g. 10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('La imagen es muy pesada (máx 10MB). Intenta con una más ligera.');
    }

    try {
        // Robust extension detection
        let fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || fileExt === file.name || fileExt.length > 5) {
            fileExt = getExtensionFromMime(file.type);
        }

        // Remove special chars from random string
        const cleanRandom = Math.random().toString(36).substring(7).replace(/[^a-z0-9]/g, '');
        const fileName = `${userId}/products/${Date.now()}-${cleanRandom}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);

            // Helpful message for missing bucket
            if ((uploadError as any).message?.includes('Bucket not found') || (uploadError as any).error === 'Bucket not found') {
                throw new Error(`El bucket '${bucketName}' no existe en Supabase. Por favor ve a Storage y crea un bucket público llamado '${bucketName}'.`);
            }

            throw new Error(uploadError.message || 'Error al subir imagen a Supabase');
        }

        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (e: any) {
        console.error("Exception in uploadProductImage:", e);
        throw new Error(e.message || 'Error inesperado al subir imagen');
    }
}

export async function updateCatalogProduct(productId: string, updates: any): Promise<any> {
    if (!supabase) throw new Error('Supabase no inicializado');

    // updates should match catalog_products schema including updated_at
    const { data, error } = await supabase
        .from('catalog_products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select()
        .single();

    if (error) {
        console.error('Error updating product:', error);
        throw new Error(error.message || 'Error al actualizar producto');
    }

    return data;
}

export async function createCatalogProduct(product: any): Promise<any> {
    if (!supabase) throw new Error('Supabase no inicializado');

    // product should include business_profile_id and user_id
    const { data, error } = await supabase
        .from('catalog_products')
        .insert([{ ...product }])
        .select()
        .single();

    if (error) {
        console.error('Error creating product:', error);
        throw new Error(error.message || 'Error al crear producto');
    }

    return data;
}

export async function deleteCatalogProduct(productId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
        .from('catalog_products')
        .delete()
        .eq('id', productId);

    if (error) {
        console.error('Error deleting product:', error);
        return false;
    }

    return true;
}

export async function deleteAllBusinessProducts(businessProfileId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('catalog_products')
        .delete()
        .eq('business_profile_id', businessProfileId);

    if (error) {
        console.error('Error deleting all products:', error);
        return false;
    }

    return true;
}
