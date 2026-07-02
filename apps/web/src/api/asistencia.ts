import { API_BASE } from "@/lib/constants";

export type GenerarTokenResponse = {
  token: string;
  expiresAt: string;
  qrUrl: string;
};

export type RegistrarAsistenciaResponse = {
  message: string;
  clase: {
    fecha: string;
    hora: string;
    tipo: string;
  } | null;
};

export type InscriptoAsistencia = {
  id_cliente: number;
  asistio: boolean;
  asistio_at: string | null;
  estado: string | null;
  nombre: string | null;
  apellido: string | null;
  dni: string | null;
};

export type ClaseProfesor = {
  id: number;
  fecha: string;
  hora: string;
  tipo: string | null;
  cupo: number | null;
  QR: string | null;
  puedeGenerarQr: boolean;
  ventanaDesde: string;
  ventanaHasta: string;
};

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(", ");
    }
    return data.message ?? "Ocurrió un error inesperado.";
  } catch {
    return "Ocurrió un error inesperado.";
  }
}

function authHeaders(authToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
}

export async function generarTokenAsistencia(
  claseId: number,
  authToken: string,
): Promise<GenerarTokenResponse> {
  const response = await fetch(`${API_BASE}/asistencia/generar-token`, {
    method: "POST",
    headers: authHeaders(authToken),
    body: JSON.stringify({ claseId }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function registrarAsistencia(
  token: string,
  authToken: string,
): Promise<RegistrarAsistenciaResponse> {
  const response = await fetch(`${API_BASE}/asistencia/registrar`, {
    method: "POST",
    headers: authHeaders(authToken),
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function getAsistenciaClase(
  claseId: number,
  authToken: string,
): Promise<{ claseId: number; inscriptos: InscriptoAsistencia[] }> {
  const response = await fetch(`${API_BASE}/asistencia/clase/${claseId}`, {
    headers: authHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function getClasesProfesor(authToken: string): Promise<ClaseProfesor[]> {
  const response = await fetch(`${API_BASE}/asistencia/profesor/clases`, {
    headers: authHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}
