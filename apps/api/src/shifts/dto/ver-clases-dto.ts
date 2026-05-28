export class ClaseDto {
    id: number;
    fecha: string;
    hora: string;
    tipo: string;
}

export class MisClasesResponseDto {
    id_clase: number;
    id_cliente: number;
    Clase: ClaseDto;
}

