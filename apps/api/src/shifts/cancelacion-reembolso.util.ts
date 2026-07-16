import { TipoReembolso } from './dto/cancelar-turno-dto';
import { ResultadoReembolso } from '../pagos/reembolso.service';

export function debeEjecutarReembolso(
  tipoReembolso: TipoReembolso,
  estadoInscripcion: string,
  esAbonado: boolean,
): boolean {
  if (tipoReembolso === TipoReembolso.NINGUNO) return false;
  return esAbonado || estadoInscripcion === 'pagado';
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
      `Se acreditó $${detalle.montoSaldo.toLocaleString('es-AR')} en tu monto a favor.`,
    );
  }

  if (detalle.montoMp > 0) {
    partes.push(
      `Se inició un reembolso en Mercado Pago por $${detalle.montoMp.toLocaleString('es-AR')}.`,
    );
  }

  return partes.join(' ');
}
