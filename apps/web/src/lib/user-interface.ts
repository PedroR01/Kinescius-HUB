export interface UserProfile{
    mail: string
    apellido: string
    nombre: string
    dni: string
}

export interface UserData extends UserProfile{
    id: number
    estado: string
    telefono?: string | null
}