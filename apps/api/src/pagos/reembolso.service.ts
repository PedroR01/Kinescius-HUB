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
  monto_a_favor: boolean;
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

    const pagoConMontoAFavor = Boolean(inscripcion.monto_a_favor);

    if (tipo === TipoReembolso.REEMBOLSO) {
      if (pagoConMontoAFavor) {
        throw new BadRequestException(
          'Esta inscripción se abonó con monto a favor; solo podés solicitar reembolso como monto a favor.',
        );
      }
      if (!inscripcion.id_pago_mp) {
        throw new BadRequestException(
          'No hay pago de Mercado Pago asociado a esta inscripción.',
        );
      }
      await this.pagosService.createRefund(
        inscripcion.id_pago_mp,
      );
      return { montoMp: CLASS_UNIT_PRICE, montoSaldo: 0 };
    }

    await this.pagosService.acreditarMontoAFavor(
      inscripcion.id_cliente,
      CLASS_UNIT_PRICE,
    );
    return { montoMp: 0, montoSaldo: CLASS_UNIT_PRICE };
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
