export class ClaseDto {
  id: number;
  fecha: string;
  hora: string;
  tipo: string;
  profesor: string;
  cupo: number;
}

export class MisClasesResponseDto {
  id_clase: number;
  id_cliente: number;
  monto_a_favor?: boolean;
  estado?: string;
  fuera_de_cuota?: boolean;
  Clase: ClaseDto;
}

export type InscripcionConClase = {
  id_cliente: number;
  id_clase: number;
  monto_a_favor?: boolean;
  estado?: string;
  Clase: {
    id: number;
    fecha: string;
    hora: string;
    tipo: string;
    cupo: number;
    id_profesor: number | null;
  };
};

