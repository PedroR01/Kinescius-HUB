import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from "class-validator";

export class EnviarNotificacionDto {
  @IsInt()
  @IsPositive()
  clienteId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  asunto: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
}