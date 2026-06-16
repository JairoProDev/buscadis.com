import type { ComponentType } from 'react';
import {
  IconHome,
  IconShorts,
  IconMegaphone,
  IconSearch,
  IconMap,
} from '@/components/Icons';
import type { SeccionSidebar } from '@/components/SidebarDesktop';

export type MainNavId = 'inicio' | 'deals' | 'publicar' | 'chatbot' | 'mapa';

export interface MainNavItem {
  id: MainNavId;
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Clave i18n bajo `nav.*` */
  labelKey: string;
  href: string;
  /** Sección del panel lateral en home (/) */
  sidebarId?: SeccionSidebar;
}

/** Orden: Inicio → Deals → Publicar → Buscar (IA) → Mapa */
export const MAIN_NAV_ITEMS: readonly MainNavItem[] = [
  { id: 'inicio', icon: IconHome, labelKey: 'nav.home', href: '/', sidebarId: 'adiso' },
  { id: 'deals', icon: IconShorts, labelKey: 'nav.deals', href: '/deals' },
  { id: 'publicar', icon: IconMegaphone, labelKey: 'nav.publish', href: '/publicar', sidebarId: 'publicar' },
  { id: 'chatbot', icon: IconSearch, labelKey: 'nav.search', href: '/chat', sidebarId: 'chatbot' },
  { id: 'mapa', icon: IconMap, labelKey: 'nav.map', href: '/mapa', sidebarId: 'mapa' },
] as const;

export function isMainNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
