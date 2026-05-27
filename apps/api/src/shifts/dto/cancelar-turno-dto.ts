import { IsInt, IsPositive, IsEnum, IsNotEmpty } from 'class-validator';

export enum TipoReembolso {
  REEMBOLSO = 'REEMBOLSO',
  A_FAVOR = 'A_FAVOR',
  NINGUNO = 'NINGUNO',
}

export class CancelarTurnoDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  clienteId: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  claseId: number;

  @IsEnum(TipoReembolso, {
    message: 'El tipo de reembolso debe ser REEMBOLSO, A_FAVOR o NINGUNO',
  })
  @IsNotEmpty()
  tipoReembolso: TipoReembolso;
}