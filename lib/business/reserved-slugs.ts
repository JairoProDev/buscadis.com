/**
 * Slugs que no deben resolverse como perfil de negocio en /{slug}.
 * Las rutas reales de la app viven en app/{ruta}/; esto evita colisiones en el catch-all.
 */
export const RESERVED_BUSINESS_SLUGS = new Set([
  'login',
  'auth',
  'signup',
  'register',
  'perfil',
  'mi-negocio',
  'admin',
  'api',
  'negocio',
  'p',
  'feed',
  'deals',
  'mapa',
  'chat',
  'publicar',
  'gratuitos',
  'favoritos',
  'guia',
  'ayuda',
  'privacidad',
  'progreso',
  'ocultos',
  'promocionar',
  'invitacion',
  'eliminar-cuenta',
  'account-deletion',
  'app',
  'c',
  'q',
  'categoria',
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad',
  'adiso',
  'a',
]);

export function isReservedBusinessSlug(slug: string): boolean {
  return RESERVED_BUSINESS_SLUGS.has(slug.toLowerCase());
}
