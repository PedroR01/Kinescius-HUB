import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateProfesorDto {
  @IsString()
  @IsNotEmpty()
  dni!: string;

  @IsString()
  @IsNotEmpty()
  mail!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsString()
  @IsOptional()
  telefono?: string | null;
}