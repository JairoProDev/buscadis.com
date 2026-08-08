/** Slugs demo — seguro para client (sin fixtures). */
export const DEMO_PERFIL_VIVO_SLUGS = [
  'demo',
  'demo-cita',
  'demo-comida',
  'demo-profesional',
  'demo-local',
  'demo-alto-ticket',
] as const;

export type DemoPerfilVivoSlug = (typeof DEMO_PERFIL_VIVO_SLUGS)[number];

export function isDemoPerfilVivoSlug(slug: string): slug is DemoPerfilVivoSlug {
  return (DEMO_PERFIL_VIVO_SLUGS as readonly string[]).includes(slug);
}

export const DEMO_META: Record<
  DemoPerfilVivoSlug,
  { title: string; arquetipo: string }
> = {
  demo: { title: 'Ferretería Demo Quival | Perfil Vivo', arquetipo: 'retail' },
  'demo-cita': { title: 'Barbería Norte Cusco | Perfil Vivo', arquetipo: 'cita' },
  'demo-comida': { title: 'Huatia Andina | Perfil Vivo', arquetipo: 'comida' },
  'demo-profesional': {
    title: 'Dra. Elena Vargas | Perfil Vivo',
    arquetipo: 'profesional',
  },
  'demo-local': { title: 'Farmacia San Blas | Perfil Vivo', arquetipo: 'local' },
  'demo-alto-ticket': {
    title: 'Andes Solar Cusco | Perfil Vivo',
    arquetipo: 'alto_ticket',
  },
};
