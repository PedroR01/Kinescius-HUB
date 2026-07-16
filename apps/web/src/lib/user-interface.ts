export interface UserProfile{
    mail: string
    apellido: string
    nombre: string
    dni: string
    telefono?: string | null
    rol: number;
}

export interface UserData extends UserProfile{
    id: number
    estado?: string | null
}

export interface EstadoCliente {
    id_pago_abonado: number
    monto_favor: number
    fecha_pago: string
    fecha_fin: string
    clases_utilizadas: number
}