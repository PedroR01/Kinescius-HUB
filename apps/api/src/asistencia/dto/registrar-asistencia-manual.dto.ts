import { Type } from 'class-transformer';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class RegistrarAsistenciaManualDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  claseId!: number;

  @IsString({ message: 'Ingresá el DNI o el mail del cliente.' })
  @MinLength(3, { message: 'Ingresá el DNI o el mail del cliente.' })
  identificador!: string;
}
