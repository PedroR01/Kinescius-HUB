import { TipoReembolso } from './dto/cancelar-turno-dto';
import { ResultadoReembolso } from '../pagos/reembolso.service';

export function debeEjecutarReembolso(
  tipoReembolso: TipoReembolso,
  estadoInscripcion: string,
): boolean {
  return (
    estadoInscripcion === 'pagado' &&
    tipoReembolso !== TipoReembolso.NINGUNO
  );
}

export function construirMensajeReembolso(
  mensajeBase: string,
  tipoReembolso: TipoReembolso,
  detalle: ResultadoReembolso | null,
): string {
  if (!detalle || tipoReembolso === TipoReembolso.NINGUNO) {
    return mensajeBase;
  }

  const partes: string[] = [mensajeBase];

  if (detalle.montoSaldo > 0) {
    partes.push(
      `Se acreditó $${detalle.montoSaldo.toLocaleString('es-AR')} en tu saldo a favor.`,
    );
  }

  if (detalle.montoMp > 0) {
    partes.push(
      `Se inició un reembolso en Mercado Pago por $${detalle.montoMp.toLocaleString('es-AR')}.`,
    );
  }

  return partes.join(' ');
}
