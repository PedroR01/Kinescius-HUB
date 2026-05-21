import { IsOptional, IsString, IsNumber, Min, IsEnum } from "class-validator";

enum TipoClase {
  ZONA_MEDIA = "zona media",
  ZONA_SUPERIOR = "zona superior",
  ZONA_INFERIOR = "zona inferior",
}

export class CreateClaseDto {
  @IsString()
  fecha!: string;

  @IsString()
  hora!: string;

  @IsOptional()
  @IsEnum(TipoClase, { message: "El tipo debe ser: zona media, zona superior o zona inferior" })
  tipo?: TipoClase | null;

  @IsOptional()
  @IsString()
  profesorDni?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: "El cupo debe ser mayor a 0" })
  cupo?: number;
}