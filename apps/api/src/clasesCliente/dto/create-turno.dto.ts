import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateTurnoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId!: number;

  @IsOptional()
  @IsString()
  estado?: string;
}
