import { IsEmail, IsNotEmpty } from 'class-validator';

export class RecuperarDto {
  @IsEmail({}, { message: 'Debe ingresar un email válido' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  email!: string;
}