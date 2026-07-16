import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class EditarQuejaDto {
  @IsString()
  @MinLength(1, { message: 'El comentario no puede estar vacío' })
  comentario!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  calificacion!: number;
}