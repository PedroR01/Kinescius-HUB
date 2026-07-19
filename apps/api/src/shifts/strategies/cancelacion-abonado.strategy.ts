import { EstrategiaCancelacion, ResultadoEvaluacion } from './estrategia-cancelacion.interface';
import { CancelarTurnoDto, TipoReembolso } from '../dto/cancelar-turno-dto';

const MAX_CANCELACIONES_MES = 3;
const HORAS_ANTELACION_ABONADO = 48;

export class CancelacionAbonadoStrategy implements EstrategiaCancelacion {
  constructor(
    private readonly cancelacionesEnMes: number,
  ) {}

  evaluarReglas(turno: any, _dto: CancelarTurnoDto): ResultadoEvaluacion {
    const nuevasCancelaciones = this.cancelacionesEnMes + 1;
    const pierdeBeneficio = nuevasCancelaciones >= MAX_CANCELACIONES_MES;

    // Calcular antelación (48hs para abonados)
    const fechaClase = new Date(`${turno.fecha}T${turno.hora}-03:00`);
    const ahora = new Date();
    const diferenciaMilisegundos = fechaClase.getTime() - ahora.getTime();
    const horasDeAntelacion = diferenciaMilisegundos / (1000 * 60 * 60);
    const sinAntelacion = horasDeAntelacion < HORAS_ANTELACION_ABONADO;

    const partes: string[] = [];

    if (sinAntelacion) {
      partes.push('Turno cancelado exitosamente.');
      partes.push('No se devolverá su seña por cancelación con menos de 48hs.');
    } else {
      partes.push('Turno cancelado exitosamente.');
      if (turno.monto_a_favor) {
        partes.push('Se acreditó $5000 en tu monto a favor.');
      } else {
        partes.push('Se inició un reembolso en Mercado Pago por $5000.');
      }
    }

    if (pierdeBeneficio) {
      partes.push('Por cancelar 3 veces o más en un mismo mes, perderás el descuento para las clases de este mes.');
    }

    const reembolsoAplicado = sinAntelacion
      ? TipoReembolso.NINGUNO
      : (turno.monto_a_favor ? TipoReembolso.A_FAVOR : TipoReembolso.REEMBOLSO);

    return {
      permitido: true,
      mensaje: partes.join(' '),
      reembolsoAplicado,
      pierdeBeneficioAbonado: pierdeBeneficio,
      sinAntelacion,
    };
  }
}
