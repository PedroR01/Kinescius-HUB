//----- Registro con datos de usuarios registrados que se va a recibir desde el front
//-Tienen "!" los campos porque Typescript pide q los inicialice, pero es innecesario si siempre recibimos datos.
// entonces el signo indica que la clase con estos datos no se va a querer instanciar
//-Tiene "?" el campo que es opcional que se llene
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class RegistroDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre!: string;

  @IsString({ message: 'El apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  apellido!: string;

  @IsString({ message: 'El DNI debe ser un texto' })
  @IsNotEmpty({ message: 'El DNI no puede estar vacío' })
  dni!: string;

  @IsEmail({}, { message: 'Debe ingresar un email válido' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  email!: string;

  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional() // Le decimos que este campo no es obligatorio
  telefono?: string;
}