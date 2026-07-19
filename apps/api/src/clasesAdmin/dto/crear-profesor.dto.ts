import { IsString, IsEmail, Length } from "class-validator";

export class CrearProfesorDto {
  @IsString()
  @Length(7, 8, { message: "El DNI debe tener entre 7 y 8 dígitos" })
  dni!: string;

  @IsEmail({}, { message: "El mail no es válido" })
  mail!: string;

  @IsString()
  @Length(1, 100, { message: "El nombre es obligatorio" })
  nombre!: string;

  @IsString()
  @Length(1, 100, { message: "El apellido es obligatorio" })
  apellido!: string;
}