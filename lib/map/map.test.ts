import assert from 'node:assert/strict';
import { clusterListings, cellDegrees } from './cluster';
import { displayCoordinate, precisionFor } from './precision';
import { distritoMasEspecifico, resolveStoredPoint, textoUbicaEnZona } from './resolve-point';
import { formatMapPrice, whatsappUrlFromContact } from './format';
import type { MapListing } from './types';

const sample = (id: string, lat: number, lng: number): MapListing => ({
  id,
  titulo: id,
  categoria: 'inmuebles',
  precio: 1200,
  moneda: 'PEN',
  tipoPrecio: 'fijo',
  distrito: 'Wanchaq',
  imageUrl: null,
  lat,
  lng,
  precision: 'area',
  href: `/a/${id}/x`,
  promoted: false,
  whatsappUrl: null,
  directionsUrl: null,
});

assert.equal(cellDegrees(16), 0);
assert.equal(cellDegrees(10) > cellDegrees(14), true);

const spread = clusterListings(
  [sample('a', -13.53, -71.97), sample('b', -13.531, -71.971)],
  12,
);
assert.equal(spread.length, 1);
assert.equal(spread[0].count, 2);

const split = clusterListings(
  [sample('a', -13.53, -71.97), sample('b', -13.6, -71.9)],
  16,
);
assert.equal(split.length, 2);

assert.equal(precisionFor('negocios', 'exact'), 'exact');
assert.equal(precisionFor('inmuebles', 'exact'), 'area');
assert.equal(precisionFor('negocios', 'area'), 'area');

const p1 = displayCoordinate('abc', -13.53, -71.97, 'area');
const p2 = displayCoordinate('abc', -13.53, -71.97, 'area');
assert.deepEqual(p1, p2);
assert.notEqual(p1.lat, -13.53);

const exact = displayCoordinate('abc', -13.53, -71.97, 'exact');
assert.equal(exact.lat, -13.53);

const named = distritoMasEspecifico('casa en San Sebastián, Cusco');
assert.equal(named?.nombre, 'San Sebastián');

const stored = resolveStoredPoint({ text: 'Wanchaq' });
assert.equal(stored?.source, 'area');
assert.equal(stored?.distrito, 'Wanchaq');

const kept = resolveStoredPoint({ latitud: -13.511, longitud: -71.99, text: 'Wanchaq' });
assert.equal(kept?.source, 'exact');
assert.equal(kept?.lat, -13.511);

const generic = resolveStoredPoint({ text: 'Cusco, Perú' });
assert.equal(generic?.distrito, 'Cusco');
assert.equal(textoUbicaEnZona('Cusco, Perú', { nombre: 'Cusco', variantes: [], provincia: 'Cusco', coordenadas: { lat: 0, lng: 0 } }), false);

assert.equal(formatMapPrice({ precio: 1500, moneda: 'PEN', tipoPrecio: 'fijo' }), 'S/ 1,500');
assert.equal(whatsappUrlFromContact('964 111 222'), 'https://wa.me/51964111222');
assert.equal(whatsappUrlFromContact('hola'), null);

console.log('map tests ok');
