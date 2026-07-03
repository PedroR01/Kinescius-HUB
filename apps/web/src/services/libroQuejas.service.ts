import { API_BASE } from '@/lib/constants';

// Ajustar API_BASE_URL / import si ya existe un cliente centralizado en src/api
//const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export interface CrearQuejaPayload {
  id_cliente: number;
  id_clase: number;
  comentario: string;
  calificacion: number; // puntuación de 1 a 5
}

// Defino la respuesta esperada del backend
export interface CrearQuejaResponse {
  id: number; // id del comentario creado en la DB
  mensaje: string; // mensaje de confirmación
}

export class LibroQuejasApiError extends Error {
  status: number; // guardo el status HTTP para manejar errores (400, 500, etc)

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LibroQuejasApiError';
    this.status = status;
  }
}

export async function crearQueja(
  payload: CrearQuejaPayload,
): Promise<CrearQuejaResponse> {
  const token = localStorage.getItem('miToken'); // ajustar key si tu login usa otra

  const res = await fetch(`${API_BASE}/libro-quejas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // El back devuelve { message, statusCode } en las excepciones de Nest
    const body = await res.json().catch(() => null);
    const mensaje =
      body?.message ?? 'No se pudo registrar el comentario. Probá de nuevo.';
    throw new LibroQuejasApiError(mensaje, res.status);
  }

  return res.json();
}