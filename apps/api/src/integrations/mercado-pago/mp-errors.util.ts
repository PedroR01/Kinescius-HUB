import { BadGatewayException } from '@nestjs/common';

export type MercadoPagoApiErrorBody = {
  message?: string;
  status?: number;
  error?: string;
  cause?: Array<{ code?: number | string; description?: string }>;
};

export function isMercadoPagoApiError(value: unknown): value is MercadoPagoApiErrorBody {
  if (!value || typeof value !== 'object') return false;
  const err = value as MercadoPagoApiErrorBody;
  return typeof err.message === 'string' && typeof err.status === 'number';
}

export function getMercadoPagoCauseCode(error: MercadoPagoApiErrorBody): number | null {
  const raw = error.cause?.[0]?.code;
  if (raw === undefined || raw === null) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function buildMercadoPagoUserMessage(error: MercadoPagoApiErrorBody): string {
  const code = getMercadoPagoCauseCode(error);

  if (code === 7 || error.message?.includes('Unauthorized use of live credentials')) {
    return (
      'Mercado Pago no permite crear reembolsos con la cuenta de prueba del vendedor (test_user). ' +
      'Para probar en local, activá MP_SIMULATE_REFUNDS=true en apps/api/.env o usá credenciales de producción reales al ir a producción.'
    );
  }

  return error.message ?? 'Error al comunicarse con Mercado Pago.';
}

export function throwMercadoPagoHttpException(error: unknown): never {
  if (isMercadoPagoApiError(error)) {
    throw new BadGatewayException(buildMercadoPagoUserMessage(error));
  }

  const message = error instanceof Error ? error.message : 'Error desconocido de Mercado Pago.';
  throw new BadGatewayException(message);
}

export function createRefundIdempotencyKey(prefix: string, idPago: string): string {
  return `${prefix}-${idPago}-${Date.now()}`;
}
