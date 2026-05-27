export class ConfirmarTurnoDto {
  clienteId!: number;
  claseId!: number;
  token!: string;
}

export class ProcesarPagoDto {
  clienteId!: number;
  claseId!: number;
  metodoPago!: 'tarjeta' | 'billetera';
  monto!: number;
}