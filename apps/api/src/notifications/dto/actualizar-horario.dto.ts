import { IsInt, Min, Max } from 'class-validator';

export class ActualizarHorarioDto {
  @IsInt()
  @Min(0)
  @Max(23)
  hora: number;

  @IsInt()
  @Min(0)
  @Max(59)
  minuto: number;
}
