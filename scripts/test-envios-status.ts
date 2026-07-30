import assert from 'node:assert/strict';
import {
  canTransition,
  nextStatusForAction,
  estimateEtaMinutes,
} from '../lib/envios/status-machine';
import { detectUso } from '../lib/envios/detect-uso';

assert.equal(canTransition('pendiente', 'aceptado'), true);
assert.equal(canTransition('pendiente', 'entregado'), false);
assert.equal(nextStatusForAction('accept', 'pendiente'), 'aceptado');
assert.equal(nextStatusForAction('entregado', 'aceptado'), null);
assert.ok(estimateEtaMinutes(11) >= 5);
assert.equal(detectUso('paquete', 'caja con ropa'), 'envio');
assert.equal(detectUso('acompanamiento', 'ayuda a subir caja'), 'asistencia');
assert.equal(detectUso('otro', ''), 'desconocido');

console.log('ok — envios status machine + detectUso + ETA');
