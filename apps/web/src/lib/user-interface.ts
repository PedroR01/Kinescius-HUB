export interface User{
    id: number
    dni: string
    mail: string
    apellido: string
    nombre: string
    estado: string
    telefono?: string | null
}