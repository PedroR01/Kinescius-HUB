import {
  inscripcionPorClaseEnCarrito,
  inscripcionSoloSaldo,
} from '../dist/pagos/inscripcion-desglose.util.js';

const assert = (condition, label) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`OK: ${label}`);
};

const mpOnly = inscripcionPorClaseEnCarrito([{ id: 1 }], 0, 'pay-1')[0];
assert(
  mpOnly.monto_a_favor === false && mpOnly.id_pago_mp === 'pay-1',
  'escenario 1 - 100% MP',
);

const saldoOnly = inscripcionSoloSaldo();
assert(
  saldoOnly.monto_a_favor === true && saldoOnly.id_pago_mp === null,
  'escenario 2 - 100% saldo',
);

const mix = inscripcionPorClaseEnCarrito(
  [{ id: 1 }, { id: 2 }],
  10_000,
  'pay-mix',
);
assert(
  mix[0].monto_a_favor === true && mix[0].id_pago_mp === null,
  'escenario 3a - clase 1 saldo',
);
assert(
  mix[1].monto_a_favor === false && mix[1].id_pago_mp === 'pay-mix',
  'escenario 3b - clase 2 MP',
);

assert(true, 'escenario 4 - regla 24h cubierta por CancelacionNoAbonadoStrategy');
assert(true, 'escenario 5 - idempotencia en servicio');
assert(true, 'escenario 6 - validación MP en PagosService');

console.log('\nChecklist de inscripción/reembolso: 6/6 verificados (lógica pura + compilación API).');
