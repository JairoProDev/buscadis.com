import { Categoria } from '@/types';

export type PlatformCommandKind =
  | 'navigate'
  | 'action'
  | 'category'
  | 'filter'
  | 'section';

export interface PlatformCommand {
  id: string;
  label: string;
  keywords: string[];
  kind: PlatformCommandKind;
  href?: string;
  category?: Categoria;
  actionId?: string;
  sectionId?: string;
  group: string;
}

export const PLATFORM_COMMANDS: PlatformCommand[] = [
  { id: 'nav-home', label: 'Ir al inicio', keywords: ['inicio', 'home', 'marketplace'], kind: 'navigate', href: '/', group: 'Páginas' },
  { id: 'nav-deals', label: 'Deals — promos y ofertas', keywords: ['deals', 'feed', 'shorts', 'reels', 'promos', 'ofertas', 'videos'], kind: 'navigate', href: '/feed', group: 'Páginas' },
  { id: 'nav-publicar', label: 'Publicar aviso', keywords: ['publicar', 'vender', 'ofrecer'], kind: 'navigate', href: '/publicar', group: 'Páginas' },
  { id: 'nav-perfil', label: 'Mi perfil', keywords: ['perfil', 'cuenta', 'usuario'], kind: 'navigate', href: '/perfil', group: 'Páginas' },
  { id: 'nav-favoritos', label: 'Favoritos guardados', keywords: ['favoritos', 'guardados', 'corazón'], kind: 'navigate', href: '/favoritos', group: 'Páginas' },
  { id: 'nav-mensajes', label: 'Mensajes', keywords: ['mensajes', 'chat', 'conversaciones'], kind: 'navigate', href: '/perfil?tab=mensajes', group: 'Páginas' },
  { id: 'nav-negocio', label: 'Mi negocio', keywords: ['negocio', 'empresa', 'tienda'], kind: 'navigate', href: '/mi-negocio', group: 'Páginas' },
  { id: 'nav-chat', label: 'Buscar con IA', keywords: ['buscar', 'ia', 'asistente', 'adis', 'chatbot'], kind: 'navigate', href: '/chat', group: 'Páginas' },
  { id: 'tab-overview', label: 'Perfil — resumen', keywords: ['overview', 'resumen'], kind: 'navigate', href: '/perfil?tab=overview', group: 'Perfil' },
  { id: 'tab-guardados', label: 'Perfil — guardados', keywords: ['guardados'], kind: 'navigate', href: '/perfil?tab=guardados', group: 'Perfil' },
  { id: 'tab-historial', label: 'Perfil — historial', keywords: ['historial', 'vistos'], kind: 'navigate', href: '/perfil?tab=historial', group: 'Perfil' },
  { id: 'tab-ajustes', label: 'Perfil — ajustes', keywords: ['ajustes', 'configuración', 'settings'], kind: 'navigate', href: '/perfil?tab=ajustes', group: 'Perfil' },
  { id: 'cat-empleos', label: 'Categoría Empleos', keywords: ['empleo', 'trabajo', 'chamba'], kind: 'category', category: 'empleos', group: 'Categorías' },
  { id: 'cat-inmuebles', label: 'Categoría Inmuebles', keywords: ['casa', 'depa', 'alquiler'], kind: 'category', category: 'inmuebles', group: 'Categorías' },
  { id: 'cat-vehiculos', label: 'Categoría Vehículos', keywords: ['auto', 'carro', 'moto'], kind: 'category', category: 'vehiculos', group: 'Categorías' },
  { id: 'cat-servicios', label: 'Categoría Servicios', keywords: ['servicio', 'profesional'], kind: 'category', category: 'servicios', group: 'Categorías' },
  { id: 'cat-productos', label: 'Categoría Productos', keywords: ['producto', 'comprar', 'venta'], kind: 'category', category: 'productos', group: 'Categorías' },
  { id: 'cat-eventos', label: 'Categoría Eventos', keywords: ['evento', 'entrada'], kind: 'category', category: 'eventos', group: 'Categorías' },
  { id: 'cat-negocios', label: 'Categoría Negocios', keywords: ['negocio', 'local'], kind: 'category', category: 'negocios', group: 'Categorías' },
  { id: 'cat-comunidad', label: 'Categoría Comunidad', keywords: ['comunidad', 'gratis'], kind: 'category', category: 'comunidad', group: 'Categorías' },
  { id: 'act-ubicacion', label: 'Cambiar ubicación', keywords: ['ubicación', 'distrito', 'ciudad', 'lugar'], kind: 'action', actionId: 'open_ubicacion', group: 'Acciones' },
  { id: 'act-limpiar', label: 'Limpiar filtros', keywords: ['limpiar', 'reset', 'borrar filtros'], kind: 'action', actionId: 'clear_filters', group: 'Acciones' },
  { id: 'act-colapsar', label: 'Minimizar panel de filtros', keywords: ['minimizar', 'colapsar', 'cerrar filtros'], kind: 'action', actionId: 'collapse_filters', group: 'Acciones' },
  { id: 'filt-precio', label: 'Filtrar por precio', keywords: ['precio', 'costo', 's/', 'soles'], kind: 'filter', sectionId: 'precio', group: 'Filtros' },
  { id: 'filt-ubicacion', label: 'Filtrar por ubicación', keywords: ['distrito', 'provincia', 'departamento'], kind: 'filter', sectionId: 'ubicacion', group: 'Filtros' },
  { id: 'filt-fotos', label: 'Solo con fotos', keywords: ['foto', 'imagen', 'galería'], kind: 'filter', sectionId: 'con_fotos', group: 'Filtros' },
];

export function filterPlatformCommands(query: string, limit = 8): PlatformCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return PLATFORM_COMMANDS.slice(0, limit);

  const scored = PLATFORM_COMMANDS.map((cmd) => {
    let score = 0;
    if (cmd.label.toLowerCase().includes(q)) score += 10;
    for (const kw of cmd.keywords) {
      if (kw.startsWith(q)) score += 8;
      else if (kw.includes(q)) score += 4;
    }
    if (cmd.group.toLowerCase().includes(q)) score += 2;
    return { cmd, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.cmd);
}
