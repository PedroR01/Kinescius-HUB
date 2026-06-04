import { CLASS_UNIT_PRICE } from './class-price.constant';

export type ClaseIdPayload = { id: number };

export type DesgloseInscripcion = {
  monto_mp: number;
  monto_saldo: number;
  id_pago_mp: string | null;
};

export function repartirMontoAFavorEntreClases(
  clases: ClaseIdPayload[],
  montoAFavorAplicado: number,
  idPagoMp: string | null,
): DesgloseInscripcion[] {
  let saldoRestante = montoAFavorAplicado;

  return clases.map(() => {
    const montoSaldo = Math.min(saldoRestante, CLASS_UNIT_PRICE);
    saldoRestante -= montoSaldo;
    const montoMp = CLASS_UNIT_PRICE - montoSaldo;

    return {
      monto_mp: montoMp,
      monto_saldo: montoSaldo,
      id_pago_mp: montoMp > 0 ? idPagoMp : null,
    };
  });
}

export function desgloseSoloSaldo(): DesgloseInscripcion {
  return {
    monto_mp: 0,
    monto_saldo: CLASS_UNIT_PRICE,
    id_pago_mp: null,
  };
}
