
import { IsNotEmpty, IsUUID, IsInt } from 'class-validator';

export class CambiarTurnoDto {
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsInt()
  // Nota: Si usan UUIDs en Supabase, cambiar @IsString() por @IsUUID()
  clienteId: number;

  @IsNotEmpty({ message: 'El ID de la clase actual es requerido' })
  @IsInt()
  claseActualId: number;

  @IsNotEmpty({ message: 'El ID de la clase nueva es requerido' })
  @IsInt()
  claseNuevaId: number;
}

