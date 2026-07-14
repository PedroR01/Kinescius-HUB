import { CancelarTurnoDto, TipoReembolso } from '../dto/cancelar-turno-dto';

export interface ResultadoEvaluacion {
  permitido: boolean;
  mensaje: string;
  reembolsoAplicado: TipoReembolso;
  pierdeBeneficioAbonado?: boolean;
  sinAntelacion?: boolean;
}

export interface EstrategiaCancelacion {
  evaluarReglas(turno: any, cancelarTurnoDto: CancelarTurnoDto): ResultadoEvaluacion;
}