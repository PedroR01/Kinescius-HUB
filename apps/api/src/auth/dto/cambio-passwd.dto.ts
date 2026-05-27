import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CambioPasswordDto {
  @IsString({ message: 'La contraseña actual debe ser texto' })
  @IsNotEmpty({ message: 'Debe ingresar su contraseña actual' })
  passwdActual!: string;

  @IsString({ message: 'La contraseña nueva debe ser texto' })
  @IsNotEmpty({ message: 'Debe ingresar una nueva contraseña' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  passwdNueva!: string;
}