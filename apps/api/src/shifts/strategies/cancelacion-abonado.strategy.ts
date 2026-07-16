import { EstrategiaCancelacion, ResultadoEvaluacion } from './estrategia-cancelacion.interface';
import { CancelarTurnoDto, TipoReembolso } from '../dto/cancelar-turno-dto';

const CUOTA_MENSUAL = 3;
const MAX_CANCELACIONES_MES = 3;
const HORAS_ANTELACION_ABONADO = 48;

export class CancelacionAbonadoStrategy implements EstrategiaCancelacion {
  constructor(
    private readonly cancelacionesEnMes: number,
    private readonly clasesInscriptasEnMes: number,
  ) {}

  evaluarReglas(turno: any, _dto: CancelarTurnoDto): ResultadoEvaluacion {
    const esClaseFueraDeCuota = this.clasesInscriptasEnMes > CUOTA_MENSUAL;
    const nuevasCancelaciones = this.cancelacionesEnMes + 1;
    const pierdeBeneficio = nuevasCancelaciones >= MAX_CANCELACIONES_MES;

    // Calcular antelación (48hs para abonados)
    const fechaClase = new Date(`${turno.fecha}T${turno.hora}-03:00`);
    const ahora = new Date();
    const diferenciaMilisegundos = fechaClase.getTime() - ahora.getTime();
    const horasDeAntelacion = diferenciaMilisegundos / (1000 * 60 * 60);
    const sinAntelacion = horasDeAntelacion < HORAS_ANTELACION_ABONADO;

    // Construir mensaje compuesto según escenarios de la HU
    const partes: string[] = [];

    if (sinAntelacion) {
      partes.push('Turno cancelado exitosamente sin antelación.');
      partes.push('No se devolverá su seña por cancelación con menos de 48hs.');
    } else {
      partes.push('Turno cancelado exitosamente.');
    }

    if (pierdeBeneficio) {
      partes.push('Por cancelar 3 veces o más en un mismo mes, perderás el descuento para las clases de este mes.');
    }

    // Con antelación (>=48hs): A_FAVOR | Sin antelación (<48hs): NINGUNO
    const reembolsoAplicado = !sinAntelacion
      ? TipoReembolso.A_FAVOR
      : TipoReembolso.NINGUNO;

    return {
      permitido: true,
      mensaje: partes.join(' '),
      reembolsoAplicado,
      pierdeBeneficioAbonado: pierdeBeneficio,
      sinAntelacion,
    };
  }
}

