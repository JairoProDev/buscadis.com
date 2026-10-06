/**
 * SEO regression checks. Run: npx tsx lib/seo/__tests__/run.ts
 */
import assert from 'node:assert/strict';
import { getCanonicalSiteUrl, APEX_HOST, CANONICAL_HOST } from '../canonical-site';
import { getAdisoUrl } from '@/lib/url';
import { buildBuscadisOrganizationJsonLd } from '../organization-jsonld';
import { buildAdisoPageJsonLd, buildAdisoJobPostingJsonLd } from '../adiso-jsonld';
import { getCuscoHubPath, listCuscoHubPaths } from '../cusco-hubs';
import type { Adiso } from '@/types';

const url = getCanonicalSiteUrl();
assert.match(url, /^https:\/\/www\.buscadis\.com$/);
assert.equal(CANONICAL_HOST, 'www.buscadis.com');
assert.equal(APEX_HOST, 'buscadis.com');

const adiso = {
  id: 'abc1234567',
  titulo: 'Vajillero (2 plazas)',
  categoria: 'empleos',
} as Adiso;
assert.match(getAdisoUrl(adiso), /^\/a\/abc1234567\//);

const graph = buildBuscadisOrganizationJsonLd()['@graph'] as Array<Record<string, unknown>>;
const org = graph.find((n) => n['@type'] === 'Organization');
assert.ok(org?.sameAs);
assert.ok((org?.sameAs as string[]).length > 0);

const jobAdiso = {
  id: 'job1234567',
  titulo: 'Ayudante de cocina',
  categoria: 'empleos',
  descripcion: 'Turno mañana en Cusco',
  fechaPublicacion: '2026-03-01',
  horaPublicacion: '10:00',
  ubicacion: 'Cusco',
  contacto: '999999999',
} as Adiso;
const pageGraph = buildAdisoPageJsonLd(jobAdiso)['@graph'] as Array<Record<string, unknown>>;
assert.ok(pageGraph.some((n) => n['@type'] === 'JobPosting'));
assert.equal(buildAdisoJobPostingJsonLd(jobAdiso)['@type'], 'JobPosting');

const paths = listCuscoHubPaths();
assert.ok(paths.length >= 8);
assert.equal(getCuscoHubPath('empleos'), '/l/cusco/empleos');
paths.forEach((p) => assert.ok(p.startsWith('/l/cusco/')));

console.log('✓ SEO regression checks passed');
