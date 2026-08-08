/** Builders de demos — solo servidor. */
import type { PerfilPayload } from './types';
import {
  DEMO_META,
  DEMO_PERFIL_VIVO_SLUGS,
  isDemoPerfilVivoSlug,
  type DemoPerfilVivoSlug,
} from './demos-slugs';
import { buildDemoRetailPayload } from './fixtures/demo-retail';
import { buildDemoCitaPayload } from './fixtures/demo-cita';
import { buildDemoComidaPayload } from './fixtures/demo-comida';
import { buildDemoProfesionalPayload } from './fixtures/demo-profesional';
import { buildDemoLocalPayload } from './fixtures/demo-local';
import { buildDemoAltoTicketPayload } from './fixtures/demo-alto-ticket';

export {
  DEMO_PERFIL_VIVO_SLUGS,
  DEMO_META,
  isDemoPerfilVivoSlug,
};
export type { DemoPerfilVivoSlug };

const BUILDERS: Record<DemoPerfilVivoSlug, (now?: Date) => PerfilPayload> = {
  demo: buildDemoRetailPayload,
  'demo-cita': buildDemoCitaPayload,
  'demo-comida': buildDemoComidaPayload,
  'demo-profesional': buildDemoProfesionalPayload,
  'demo-local': buildDemoLocalPayload,
  'demo-alto-ticket': buildDemoAltoTicketPayload,
};

export function buildDemoPerfilVivoPayload(
  slug: string,
  now?: Date
): PerfilPayload | null {
  if (!isDemoPerfilVivoSlug(slug)) return null;
  return BUILDERS[slug](now);
}
