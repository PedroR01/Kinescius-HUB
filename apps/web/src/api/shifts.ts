import { API_BASE } from '@/lib/constants';

export interface CancelarTurnoPayload {
  clienteId: number;
  claseId: number;
  tipoReembolso: 'REEMBOLSO' | 'A_FAVOR' | 'NINGUNO';
}

export interface CancelarTurnoResponse {
  message: string;
  reembolso: 'REEMBOLSO' | 'A_FAVOR' | 'NINGUNO';
  detalleReembolso?: {
    montoMp: number;
    montoSaldo: number;
  };
}

export interface CambiarTurnoPayload {
  clienteId: number;
  claseActualId: number;
  claseNuevaId: number;
}

export interface ClaseDisponible {
  id: number;
  fecha: string;
  hora: string;
  actividad: string;
  cuposDisponibles: number;
}

export const obtenerClasesDisponiblesRequest = async (): Promise<ClaseDisponible[]> => {
  const response = await fetch(`${API_BASE}/shifts`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('No se pudieron cargar las clases disponibles.');
  }

  return response.json();
};

export const cambiarTurnoRequest = async (payload: CambiarTurnoPayload) => {
  const response = await fetch(`${API_BASE}/shifts/cambiar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al cambiar el turno');
  }

  return response.json();
};

export const cancelarTurnoRequest = async (
  payload: CancelarTurnoPayload,
  authToken?: string | null,
): Promise<CancelarTurnoResponse> => {
  const token = authToken ?? localStorage.getItem('miToken');
  const response = await fetch(`${API_BASE}/shifts/cancelar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al cancelar el turno');
  }

  return response.json();
};