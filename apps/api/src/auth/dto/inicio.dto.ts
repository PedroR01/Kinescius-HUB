//----- Registro con datos de usuarios que se va a recibir desde el front

//-Tienen "!" los campos porque Typescript pide q los inicialice, pero es innecesario si siempre recibimos datos.
// entonces el signo indica que la clase con estos datos no se va a querer instanciar
//-Tiene "?" el campo que es opcional que se llene
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class InicioDto {
  @IsEmail({}, { message: 'Debe ingresar un email válido' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  passwd!: string;
}