import {
  desgloseSoloSaldo,
  repartirMontoAFavorEntreClases,
} from './inscripcion-desglose.util';
import { CLASS_UNIT_PRICE } from './class-price.constant';

describe('repartirMontoAFavorEntreClases', () => {
  const clases = [{ id: 1 }, { id: 2 }];

  it('1 clase 100% MP: monto_mp=10000, monto_saldo=0', () => {
    const [d] = repartirMontoAFavorEntreClases([{ id: 1 }], 0, 'pay-1');
    expect(d.monto_mp).toBe(CLASS_UNIT_PRICE);
    expect(d.monto_saldo).toBe(0);
    expect(d.id_pago_mp).toBe('pay-1');
  });

  it('1 clase 100% saldo: monto_mp=0, monto_saldo=10000', () => {
    const [d] = repartirMontoAFavorEntreClases([{ id: 1 }], CLASS_UNIT_PRICE, null);
    expect(d.monto_mp).toBe(0);
    expect(d.monto_saldo).toBe(CLASS_UNIT_PRICE);
    expect(d.id_pago_mp).toBeNull();
  });

  it('carrito 2 clases con saldo parcial reparte en orden', () => {
    const desgloses = repartirMontoAFavorEntreClases(
      clases,
      CLASS_UNIT_PRICE,
      'pay-mix',
    );
    expect(desgloses[0].monto_saldo).toBe(CLASS_UNIT_PRICE);
    expect(desgloses[0].monto_mp).toBe(0);
    expect(desgloses[1].monto_saldo).toBe(0);
    expect(desgloses[1].monto_mp).toBe(CLASS_UNIT_PRICE);
    expect(desgloses[1].id_pago_mp).toBe('pay-mix');
  });

  it('desgloseSoloSaldo coincide con inscripción solo saldo', () => {
    const d = desgloseSoloSaldo();
    expect(d.monto_mp).toBe(0);
    expect(d.monto_saldo).toBe(CLASS_UNIT_PRICE);
    expect(d.id_pago_mp).toBeNull();
  });
});
