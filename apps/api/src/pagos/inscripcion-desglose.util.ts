import { CLASS_UNIT_PRICE } from './class-price.constant';

export type ClaseIdPayload = { id: number };

export type DatosInscripcionPago = {
  monto_a_favor: boolean;
  id_pago_mp: string | null;
};

export function inscripcionPorClaseEnCarrito(
  clases: ClaseIdPayload[],
  montoAFavorAplicado: number,
  idPagoMp: string | null,
): DatosInscripcionPago[] {
  let saldoRestante = montoAFavorAplicado;

  return clases.map(() => {
    const montoSaldo = Math.min(saldoRestante, CLASS_UNIT_PRICE);
    saldoRestante -= montoSaldo;
    const montoMp = CLASS_UNIT_PRICE - montoSaldo;

    return {
      monto_a_favor: montoSaldo > 0,
      id_pago_mp: montoMp > 0 ? idPagoMp : null,
    };
  });
}

export function inscripcionSoloSaldo(): DatosInscripcionPago {
  return {
    monto_a_favor: true,
    id_pago_mp: null,
  };
}
