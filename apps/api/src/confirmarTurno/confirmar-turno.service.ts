import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase.service';
import { ConfirmarTurnoDto } from './dto/confirmar-turno.dto';

@Injectable()
export class ConfirmarTurnoService {
  private readonly logger = new Logger(ConfirmarTurnoService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Valida el token del email y devuelve la info necesaria para mostrar
   * la pantalla de confirmación/pago en el frontend.
   */
  async validarToken(token: string, claseId: number, clienteId: number) {
    const { data: tokenRow, error } = await this.supabase.client
      .from('tokens_confirmacion')
      .select('*')
      .eq('token', token)
      .eq('clase_id', claseId)
      .eq('cliente_id', clienteId)
      .single();

    if (error || !tokenRow) {
      throw new NotFoundException('El enlace de confirmación no es válido.');
    }

    if (tokenRow.usado) {
      throw new BadRequestException('Este enlace ya fue utilizado.');
    }

    const ahora = new Date();
    if (new Date(tokenRow.expires_at) < ahora) {
      throw new BadRequestException(
        'El enlace de confirmación expiró. Contactá con el centro.',
      );
    }

    // Verificar que aún haya cupo en la clase
    const { data: clase, error: claseError } = await this.supabase.client
      .from('Clase')
      .select('id, fecha, hora, tipo, cupo')
      .eq('id', claseId)
      .single();

    if (claseError || !clase) {
      throw new NotFoundException('La clase ya no existe.');
    }

    const { count: inscriptos } = await this.supabase.client
      .from('Se_inscribe')
      .select('*', { count: 'exact', head: true })
      .eq('id_clase', claseId);

    if ((inscriptos ?? 0) >= clase.cupo) {
      throw new BadRequestException(
        'Lo sentimos, el cupo fue tomado por otro cliente.',
      );
    }

    return {
      clase: {
        id: clase.id,
        tipo: clase.tipo,
        fecha: clase.fecha,
        hora: clase.hora,
      },
      clienteId,
      token,
    };
  }

  /**
   * Confirma el turno tras pago exitoso de la seña.
   * Escenario 2: pago OK → inscribir al cliente.
   * Escenario 3: pago KO → devolver error sin inscribir.
   */
  async confirmarTurno(dto: ConfirmarTurnoDto) {
    const { clienteId, claseId, token } = dto;

    // 1. Revalidar token (evita doble submit o ataques)
    const { data: tokenRow, error: tokenError } = await this.supabase.client
      .from('tokens_confirmacion')
      .select('*')
      .eq('token', token)
      .eq('clase_id', claseId)
      .eq('cliente_id', clienteId)
      .single();

    if (tokenError || !tokenRow) {
      throw new NotFoundException('El enlace de confirmación no es válido.');
    }
    if (tokenRow.usado) {
      throw new BadRequestException('Este enlace ya fue utilizado.');
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      throw new BadRequestException('El enlace de confirmación expiró.');
    }

    // 2. Verificar cupo aún disponible
    const { data: clase } = await this.supabase.client
      .from('Clase')
      .select('cupo')
      .eq('id', claseId)
      .single();

    const { count: inscriptos } = await this.supabase.client
      .from('Se_inscribe')
      .select('*', { count: 'exact', head: true })
      .eq('id_clase', claseId);

    if ((inscriptos ?? 0) >= (clase?.cupo ?? 0)) {
      throw new BadRequestException(
        'El cupo fue tomado por otro cliente mientras procesabas el pago.',
      );
    }

    // 3. Simular/integrar pasarela de pago
    //    Reemplazar esta sección con la integración real (MercadoPago, Stripe, etc.)
    const pagoExitoso = await this.procesarPagoSenia(clienteId, claseId);

    if (!pagoExitoso) {
      // Escenario 3: pago fallido
      throw new BadRequestException(
        'No se ha realizado el pago correctamente, el cliente no pudo confirmar el cupo.',
      );
    }

    // 4. Escenario 2: pago OK → inscribir al cliente en la clase
    const { error: inscripcionError } = await this.supabase.client
      .from('Se_inscribe')
      .insert({
        id_clase: claseId,
        id_cliente: clienteId,
        estado: 'confirmado',
      });

    if (inscripcionError) {
      this.logger.error(
        `Error al inscribir cliente ${clienteId} en clase ${claseId}: ${inscripcionError.message}`,
      );
      throw new InternalServerErrorException(
        'El pago fue procesado pero ocurrió un error al inscribirte. Contactá al centro.',
      );
    }

    // 5. Remover al cliente de la lista de espera
    await this.removerDeListaEspera(clienteId, claseId);

    // 6. Marcar el token como usado
    await this.supabase.client
      .from('tokens_confirmacion')
      .update({ usado: true })
      .eq('token', token);

    return { message: 'Turno solicitado' };
  }

  // ──────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────

  /**
   * Stub del procesamiento de pago.
   * Reemplazar con la integración real de la pasarela.
   * Debe retornar true si el pago fue aprobado, false si fue rechazado.
   */
  private async procesarPagoSenia(
    clienteId: number,
    claseId: number,
  ): Promise<boolean> {
    // TODO: integrar MercadoPago / Stripe / etc.
    // Por ahora siempre retorna true (pago aprobado en sandbox).
    // En producción, llamar a la API de la pasarela y devolver el resultado.
    this.logger.log(
      `Procesando seña para cliente ${clienteId}, clase ${claseId}`,
    );
    return true;
  }

  private async removerDeListaEspera(
    clienteId: number,
    claseId: number,
  ): Promise<void> {
    const { data: listaRow } = await this.supabase.client
      .from('Lista de espera')
      .select('id')
      .eq('id_clase', claseId)
      .single();

    if (!listaRow) return;

    await this.supabase.client
      .from('No abonado')
      .delete()
      .eq('id_cliente', clienteId)
      .eq('id_listaEspera', listaRow.id);
  }
}