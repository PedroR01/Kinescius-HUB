import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { TipoReembolso } from '../shifts/dto/cancelar-turno-dto';
import { CLASS_UNIT_PRICE } from './class-price.constant';
import { PagosService } from './pagos.service';

export type InscripcionReembolso = {
  id_cliente: number;
  id_clase: number;
  monto_mp: number | string | null;
  monto_saldo: number | string | null;
  id_pago_mp: string | null;
  reembolsado_at: string | null;
};

export type ResultadoReembolso = {
  montoMp: number;
  montoSaldo: number;
};

@Injectable()
export class ReembolsoService {
  constructor(
    private readonly pagosService: PagosService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async ejecutarReembolso(
    inscripcion: InscripcionReembolso,
    tipo: TipoReembolso,
  ): Promise<ResultadoReembolso> {
    if (inscripcion.reembolsado_at) {
      throw new ConflictException('Esta inscripción ya fue reembolsada.');
    }

    if (tipo === TipoReembolso.NINGUNO) {
      return { montoMp: 0, montoSaldo: 0 };
    }

    const montoMp = Number(inscripcion.monto_mp) || 0;
    const montoSaldo = Number(inscripcion.monto_saldo) || 0;

    if (tipo === TipoReembolso.A_FAVOR) {
      await this.pagosService.acreditarMontoAFavor(
        inscripcion.id_cliente,
        CLASS_UNIT_PRICE,
      );
      return { montoMp: 0, montoSaldo: CLASS_UNIT_PRICE };
    }

    const saldoAcreditar = montoSaldo;
    if (saldoAcreditar > 0) {
      await this.pagosService.acreditarMontoAFavor(
        inscripcion.id_cliente,
        saldoAcreditar,
      );
    }

    if (montoMp > 0) {
      if (!inscripcion.id_pago_mp) {
        throw new BadRequestException(
          'No hay pago de Mercado Pago asociado a esta inscripción.',
        );
      }
      await this.pagosService.createPartialRefund(
        inscripcion.id_pago_mp,
        montoMp,
      );
    }

    return { montoMp, montoSaldo: saldoAcreditar };
  }

  async marcarReembolsado(clienteId: number, claseId: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('Se_inscribe')
      .update({ reembolsado_at: new Date().toISOString() })
      .eq('id_cliente', clienteId)
      .eq('id_clase', claseId)
      .is('reembolsado_at', null);

    if (error) {
      throw new ConflictException(
        `No se pudo registrar el reembolso: ${error.message}`,
      );
    }
  }
}
