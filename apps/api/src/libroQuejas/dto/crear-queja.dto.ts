// Importo decoradores de class-validator para validar automáticamente los datos del body
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

// Este DTO define cómo tiene que venir la request cuando se crea una queja
export class CreateQuejaDto {
  // ID del cliente que hace el comentario (Persona_.id con rol 'cliente')
  // Tiene que ser un número entero
  @IsInt()
  id_cliente!: number;

  // ID de la clase sobre la que se hace el comentario
  // También tiene que ser entero
  @IsInt()
  id_clase!: number;

  // Comentario del cliente
  // Tiene que ser un string
  @IsString()
  // No puede estar vacío (mínimo 1 carácter)
  @MinLength(1, { message: 'El comentario no puede estar vacío' })
  comentario!: string;

  // Calificación de la clase
  // Tiene que ser un número entero
  @IsInt({ message: 'La calificación debe ser un número entero' })
  // Valor mínimo permitido: 1
  @Min(1, { message: 'La calificación mínima es 1' })
  // Valor máximo permitido: 5
  @Max(5, { message: 'La calificación máxima es 5' })
  calificacion!: number;
}