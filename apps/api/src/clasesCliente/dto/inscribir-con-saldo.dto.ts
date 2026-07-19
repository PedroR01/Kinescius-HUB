import { Type } from "class-transformer";
import { IsArray, IsInt, Min, ValidateNested } from "class-validator";

class ClaseIdDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class InscribirConSaldoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaseIdDto)
  clases!: ClaseIdDto[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  montoAFavorAplicado!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  clasesFavorAplicadas!: number;
}
