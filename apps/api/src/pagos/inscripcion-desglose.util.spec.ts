import {
  inscripcionPorClaseEnCarrito,
  inscripcionSoloSaldo,
} from './inscripcion-desglose.util';

describe('inscripcionPorClaseEnCarrito', () => {
  const clases = [{ id: 1 }, { id: 2 }];

  it('1 clase 100% MP: monto_a_favor=false, id_pago_mp set', () => {
    const [d] = inscripcionPorClaseEnCarrito([{ id: 1 }], 0, 'pay-1');
    expect(d.monto_a_favor).toBe(false);
    expect(d.id_pago_mp).toBe('pay-1');
  });

  it('1 clase 100% saldo: monto_a_favor=true, id_pago_mp null', () => {
    const [d] = inscripcionPorClaseEnCarrito([{ id: 1 }], 10_000, null);
    expect(d.monto_a_favor).toBe(true);
    expect(d.id_pago_mp).toBeNull();
  });

  it('carrito 2 clases con saldo parcial reparte en orden', () => {
    const inscripciones = inscripcionPorClaseEnCarrito(
      clases,
      10_000,
      'pay-mix',
    );
    expect(inscripciones[0].monto_a_favor).toBe(true);
    expect(inscripciones[0].id_pago_mp).toBeNull();
    expect(inscripciones[1].monto_a_favor).toBe(false);
    expect(inscripciones[1].id_pago_mp).toBe('pay-mix');
  });

  it('inscripcionSoloSaldo coincide con inscripción solo saldo', () => {
    const d = inscripcionSoloSaldo();
    expect(d.monto_a_favor).toBe(true);
    expect(d.id_pago_mp).toBeNull();
  });
});
