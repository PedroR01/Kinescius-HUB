import { BadRequestException } from '@nestjs/common';
import { EstrategiaCancelacion, ResultadoEvaluacion } from './estrategia-cancelacion.interface';
import { CancelarTurnoDto, TipoReembolso } from '../dto/cancelar-turno-dto';

export class CancelacionNoAbonadoStrategy implements EstrategiaCancelacion {
  
  evaluarReglas(turno: any, dto: CancelarTurnoDto): ResultadoEvaluacion {
    const fechaClase = new Date(`${turno.fecha}T${turno.hora}-03:00`);
    const ahora = new Date();

    const diferenciaMilisegundos = fechaClase.getTime() - ahora.getTime();
    const horasDeAntelacion = diferenciaMilisegundos / (1000 * 60 * 60);

    // 3. Regla: Cancelación fuera de tiempo (menos de 24hs)
    if (horasDeAntelacion < 24) {
      if (dto.tipoReembolso !== TipoReembolso.NINGUNO) {
        throw new BadRequestException('Cancelaciones con menos de 24hs no admiten reembolso ni saldo a favor.');
      }
      return {
        permitido: true,
        mensaje: 'Turno cancelado exitosamente sin antelación.',
        reembolsoAplicado: TipoReembolso.NINGUNO,
      };
    }

    // 4. Regla: Cancelación exitosa en tiempo y forma (más de 24hs)
    return {
      permitido: true,
      mensaje: 'Turno cancelado exitosamente.',
      reembolsoAplicado: dto.tipoReembolso, 
    };
  }
}