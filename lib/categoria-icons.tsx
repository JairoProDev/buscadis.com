'use client';

import type { ComponentType } from 'react';
import { Categoria } from '@/types';
import {
  IconComunidad,
  IconEmpleos,
  IconEventos,
  IconInmuebles,
  IconNegocios,
  IconProductos,
  IconServicios,
  IconVehiculos,
} from '@/components/Icons';

export type CategoriaIconComponent = ComponentType<{
  size?: number;
  color?: string;
  className?: string;
}>;

const ICON_MAP: Record<Categoria, CategoriaIconComponent> = {
  empleos: IconEmpleos,
  inmuebles: IconInmuebles,
  vehiculos: IconVehiculos,
  servicios: IconServicios,
  productos: IconProductos,
  eventos: IconEventos,
  negocios: IconNegocios,
  comunidad: IconComunidad,
};

export function getCategoriaIcon(categoria: Categoria): CategoriaIconComponent {
  return ICON_MAP[categoria] ?? IconProductos;
}

/** Mismo orden que las categorías principales del home */
export const PUBLISH_CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'empleos', label: 'Empleos' },
  { value: 'inmuebles', label: 'Inmuebles' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'productos', label: 'Productos' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'comunidad', label: 'Comunidad' },
];

export function getCategoriaLabel(categoria: Categoria): string {
  return PUBLISH_CATEGORIAS.find((c) => c.value === categoria)?.label ?? categoria;
}
