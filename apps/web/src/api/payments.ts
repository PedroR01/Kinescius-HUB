import { API_BASE } from "@/lib/constants";
import type { ClasePayload } from "@/lib/class-payload";

export type CreatePreferencePayload = {
  clases: ClasePayload[];
  clienteId: number;
  montoAFavorAplicado?: number;
};

export type InscribirConSaldoPayload = {
  clienteId: number;
  clases: { id: number }[];
  montoAFavorAplicado: number;
};

export type InscribirConSaldoResponse = {
  inscripciones: unknown[];
  saldoRestante: number;
};

export type CreateMensualidadPayload = {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono?: string;
  rol: number;
}

export async function createMercadoPagoPreference(
  payload: CreatePreferencePayload
): Promise<{ initPoint: string }> {
  const response = await fetch(`${API_BASE}/api/mercadopago`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });


  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
      `Error al crear la preferencia de pago: ${response.status}`
    );
  }

  const data = (await response.json()) as { initPoint: string };
  if (!data.initPoint?.startsWith("https://")) {
    throw new Error("La API no devolvió una URL de pago válida.");
  }

  return data;
}

export async function inscribirConSaldoAFavor(
  payload: InscribirConSaldoPayload
): Promise<InscribirConSaldoResponse> {
  const response = await fetch(`${API_BASE}/clases/inscribir-con-saldo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
      `Error al inscribir con saldo a favor: ${response.status}`
    );
  }

  return response.json();
}

export async function fetchMontoAFavor(clienteId: number): Promise<number> {
  const response = await fetch(`${API_BASE}/clases/cliente/${clienteId}/monto-a-favor`);
  if (!response.ok) return 0;
  const data = (await response.json()) as { monto_a_favor?: number };
  return Number(data.monto_a_favor) ?? 0;
}

export async function createMensualidadPreference(payload: CreateMensualidadPayload) {

  const response = await fetch(`${API_BASE}/api/mercadopago/mensualidad`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
      `Error al crear la preferencia para el pago de mensualidad: ${response.status}`
    );
  }
  const data = (await response.json()) as { initPoint: string };
  if (!data.initPoint?.startsWith("https://")) {
    throw new Error("La API no devolvió una URL de pago válida.")
  }
  return data;
}
