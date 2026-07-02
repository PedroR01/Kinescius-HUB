// Este DTO define cómo va a ser la respuesta del historial de clases
// o sea, qué datos le devuelvo al frontend cuando pide el historial

export class HistorialClaseDto {
  // ID de la clase
  idClase: number;

  // Fecha en la que se realizó la clase (formato string)
  fecha: string;

  // Hora en la que se realizó la clase
  hora: string;

  // Tipo de clase (puede ser null si no está definido)
  tipo: string | null;

  // Nombre del profesor de la clase (Persona_.nombre)
  profesorNombre: string;

  // Apellido del profesor de la clase (Persona_.apellido)
  profesorApellido: string;

  // Calificación que dejó el cliente (puede ser null si no comentó)
  calificacion: number | null;

  // Comentario que dejó el cliente (puede ser null si no comentó)
  comentario: string | null;
}