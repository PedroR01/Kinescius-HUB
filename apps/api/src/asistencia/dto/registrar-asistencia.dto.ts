import { IsUUID } from 'class-validator';

export class RegistrarAsistenciaDto {
  @IsUUID('4', { message: 'El token de asistencia no es válido.' })
  token!: string;
}
