import { TipoReembolso } from './dto/cancelar-turno-dto';
import { ResultadoReembolso } from '../pagos/reembolso.service';

export function debeEjecutarReembolso(
  tipoReembolso: TipoReembolso,
  estadoInscripcion: string,
  esAbonado: boolean = false,
): boolean {
  if (tipoReembolso === TipoReembolso.NINGUNO) return false;
  // Abonados: siempre se ejecuta monto a favor si la strategy lo indica
  if (esAbonado) return true;
  // No abonados: solo si la inscripción fue reservada (pagó la seña)
  return estadoInscripcion === 'reservado';
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
      `Se acreditó $${detalle.montoSaldo.toLocaleString('es-AR')} en su saldo a favor.`,
    );
  }

  if (detalle.montoMp > 0) {
    partes.push(
      `Se inició un reembolso en Mercado Pago por $${detalle.montoMp.toLocaleString('es-AR')}.`,
    );
  }

  return partes.join(' ');
}
