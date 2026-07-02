import { BadRequestException } from '@nestjs/common';
import { EstrategiaCancelacion, ResultadoEvaluacion } from './estrategia-cancelacion.interface';
import { CancelarTurnoDto, TipoReembolso } from '../dto/cancelar-turno-dto';

const CUOTA_MENSUAL = 3;
const MAX_CANCELACIONES_MES = 3;

export class CancelacionAbonadoStrategy implements EstrategiaCancelacion {
  constructor(
    private readonly cancelacionesEnMes: number,
    private readonly clasesInscriptasEnMes: number,
  ) {}

  evaluarReglas(turno: any, dto: CancelarTurnoDto): ResultadoEvaluacion {
    const esClaseFueraDeCuota = this.clasesInscriptasEnMes > CUOTA_MENSUAL;
    const nuevasCancelaciones = this.cancelacionesEnMes + 1;
    const pierdeBeneficio = nuevasCancelaciones >= MAX_CANCELACIONES_MES;

    // Clase dentro de cuota: no admite reembolso (cubierta por el abono)
    if (!esClaseFueraDeCuota && dto.tipoReembolso !== TipoReembolso.NINGUNO) {
      throw new BadRequestException(
        'Las clases dentro de la cuota del abono no admiten reembolso.',
      );
    }

    return {
      permitido: true,
      mensaje: 'Turno cancelado exitosamente.',
      reembolsoAplicado: esClaseFueraDeCuota ? dto.tipoReembolso : TipoReembolso.NINGUNO,
      pierdeBeneficioAbonado: pierdeBeneficio,
    };
  }
}
