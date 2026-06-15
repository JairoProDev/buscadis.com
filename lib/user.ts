import { supabase } from './supabase';
import { Profile, UserPreferences, Favorito } from '@/types';

/**
 * Obtiene el perfil de un usuario
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // Errores no críticos que no deben lanzar excepciones
    if (error.code === 'PGRST116' || error.code === 'PGRST205') {
      // Perfil no encontrado o tabla no existe (aún no se ejecutó el SQL)
      return null;
    }
    // Error 406 (Not Acceptable) generalmente es por RLS o permisos, no crítico
    if (error.message?.includes('406') || (error as any).status === 406 || (error as any).statusCode === 406) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error 406 al obtener perfil (posible problema de RLS):', error);
      }
      return null;
    }
    // Solo mostrar errores críticos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error al obtener perfil:', error);
    }
    throw error;
  }

  return data as Profile;
}

/**
 * Actualiza el perfil de un usuario
 * Si el perfil no existe, lo crea primero
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Verificar si el perfil existe
  const perfilExistente = await getProfile(userId);

  if (!perfilExistente) {
    // Si no existe, crearlo primero
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: user?.email,
        nombre: updates.nombre || user?.user_metadata?.nombre || 'Usuario',
        apellido: updates.apellido || user?.user_metadata?.apellido || '',
        ...updates,
        rol: 'usuario' // Valor por defecto
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear perfil:', error);
      throw error;
    }

    return data as Profile;
  }

  // Si existe, actualizarlo
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    // Si el error es que no se encontró (PGRST116), intentar crear
    if (error.code === 'PGRST116') {
      return updateProfile(userId, updates); // Recursión para crear
    }
    console.error('Error al actualizar perfil:', error);
    throw error;
  }

  return data as Profile;
}

export interface UserSocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
}

export async function uploadProfileAvatar(file: File, userId: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
    const bucketName = 'catalog-images';

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.error('Exception uploading avatar:', e);
    return null;
  }
}

export async function updateUserSocialLinks(social: UserSocialLinks): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado');

  const { error } = await supabase.auth.updateUser({ data: { social } });
  if (error) throw error;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === 'PGRST205') {
      // Preferencias no encontradas o tabla no existe (aún no se ejecutó el SQL)
      // Crear preferencias por defecto si la tabla existe, sino retornar null
      try {
        return await createDefaultPreferences(userId);
      } catch (createError: any) {
        if (createError.code === 'PGRST205') {
          // Tabla no existe aún
          return null;
        }
        throw createError;
      }
    }
    console.error('Error al obtener preferencias:', error);
    throw error;
  }

  return data as UserPreferences;
}

/**
 * Crea preferencias por defecto para un usuario
 */
async function createDefaultPreferences(userId: string): Promise<UserPreferences> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const defaultPreferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> = {
    user_id: userId,
    categorias_favoritas: [],
    notificaciones_email: true,
    notificaciones_push: false,
    idioma: 'es',
    tema: 'auto',
    radio_busqueda_km: 10
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .insert(defaultPreferences)
    .select()
    .single();

  if (error) {
    console.error('Error al crear preferencias:', error);
    throw error;
  }

  return data as UserPreferences;
}

/**
 * Actualiza las preferencias de un usuario
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Asegurar que existan las preferencias
  await getUserPreferences(userId);

  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar preferencias:', error);
    throw error;
  }

  return data as UserPreferences;
}

/**
 * Actualiza la ubicación del usuario
 */
export async function updateUserLocation(
  userId: string,
  ubicacion: string,
  latitud?: number,
  longitud?: number
): Promise<Profile> {
  return updateProfile(userId, {
    ubicacion,
    latitud,
    longitud
  });
}

/**
 * Cambia el rol de un usuario
 * Nota: En producción, esto debería verificar permisos de admin
 */
export async function updateUserRole(
  userId: string,
  nuevoRol: 'usuario' | 'anunciante' | 'admin'
): Promise<Profile> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Asegurar que el perfil existe primero
  let perfil = await getProfile(userId);

  if (!perfil) {
    // Crear perfil si no existe
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: user?.email,
        nombre: user?.user_metadata?.nombre || 'Usuario',
        rol: nuevoRol
      })
      .select()
      .single();

    if (createError) {
      console.error('Error al crear perfil:', createError);
      throw createError;
    }

    return newProfile as Profile;
  }

  // Actualizar rol
  const { data, error } = await supabase
    .from('profiles')
    .update({ rol: nuevoRol })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar rol:', error);
    throw error;
  }

  return data as Profile;
}

