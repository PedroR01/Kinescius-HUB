import { IsOptional, IsString } from "class-validator";

export class CreateClaseDto {
  @IsString()
  fecha!: string;

  @IsString()
  hora!: string;

  @IsOptional()
  @IsString()
  tipo?: string | null;

  @IsOptional()
  @IsString()
  profesorDni?: string | null;
}