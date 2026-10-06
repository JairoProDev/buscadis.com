/**
 * SEO regression checks. Run: npx tsx lib/seo/__tests__/run.ts
 */
import assert from 'node:assert/strict';
import { getCanonicalSiteUrl, APEX_HOST, CANONICAL_HOST } from '../canonical-site';
import { getAdisoUrl } from '@/lib/url';
import { buildBuscadisOrganizationJsonLd } from '../organization-jsonld';
import { buildAdisoPageJsonLd, buildAdisoJobPostingJsonLd } from '../adiso-jsonld';
import { getCuscoHubPath, listCuscoHubPaths } from '../cusco-hubs';
import { getSearchCanonicalPath, searchQueryToSlug, searchSlugToQuery } from '../search-url';
import { buildSitemapIndexXml } from '../sitemap-index';
import type { Adiso } from '@/types';

async function main() {
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

assert.equal(searchQueryToSlug('Empleo Cusco'), 'empleo-cusco');
assert.equal(searchSlugToQuery('empleo-cusco'), 'empleo cusco');
assert.equal(getSearchCanonicalPath('empleo cusco'), '/buscar/empleo-cusco');

const indexXml = await buildSitemapIndexXml();
assert.match(indexXml, /<sitemapindex/);
assert.match(indexXml, /\/sitemap\/0\.xml/);
assert.doesNotMatch(indexXml, /&amp;amp;/);

const paths = listCuscoHubPaths();
assert.ok(paths.length >= 8);
assert.equal(getCuscoHubPath('empleos'), '/l/cusco/empleos');
paths.forEach((p) => assert.ok(p.startsWith('/l/cusco/')));

const inmueble = {
  id: 'inm1234567',
  titulo: 'Departamento en alquiler',
  categoria: 'inmuebles',
  descripcion: 'Cerca al centro de Cusco',
  fechaPublicacion: '2026-03-01',
  horaPublicacion: '10:00',
  ubicacion: 'Cusco',
  contacto: '999999999',
  atributos: { area_m2: 85 },
} as Adiso;
const inmGraph = buildAdisoPageJsonLd(inmueble)['@graph'] as Array<Record<string, unknown>>;
assert.ok(inmGraph.some((n) => n['@type'] === 'RealEstateListing'));

console.log('✓ SEO regression checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
