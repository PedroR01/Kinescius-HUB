import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { ConfirmarTurnoDto } from './dto/confirmar-turno.dto';

@Injectable()
export class ConfirmarTurnoService {
  private readonly logger = new Logger(ConfirmarTurnoService.name);

  constructor(private readonly supabase: SupabaseService) { }

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

  async confirmarDesdeEmail(token: string, claseId: number, clienteId: number) {
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
    if (new Date(tokenRow.expires_at) < new Date()) {
      throw new BadRequestException('El enlace de confirmación expiró.');
    }

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
      throw new BadRequestException('El cupo fue tomado por otro cliente.');
    }

    const { error: inscripcionError } = await this.supabase.client
      .from('Se_inscribe')
      .insert({
        id_clase: claseId,
        id_cliente: clienteId,
        estado: 'confirmado',
      });

    if (inscripcionError) {
      if (inscripcionError.code === '23505') {
        throw new ConflictException('Ya estás inscripto en esta clase.');
      }
      throw new InternalServerErrorException(
        'Error al inscribirte. Contactá al centro.',
      );
    }

    await this.removerDeListaEspera(clienteId, claseId);

    await this.supabase.client
      .from('tokens_confirmacion')
      .update({ usado: true })
      .eq('token', token);

    return { message: 'Turno confirmado exitosamente.' };
  }

  async confirmarTurno(dto: ConfirmarTurnoDto) {
    const { clienteId, claseId, token } = dto;

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

    const pagoExitoso = await this.procesarPagoSenia(clienteId, claseId);

    if (!pagoExitoso) {
      throw new BadRequestException(
        'No se ha realizado el pago correctamente, el cliente no pudo confirmar el cupo.',
      );
    }

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

    await this.removerDeListaEspera(clienteId, claseId);

    await this.supabase.client
      .from('tokens_confirmacion')
      .update({ usado: true })
      .eq('token', token);

    return { message: 'Turno solicitado' };
  }

  private async procesarPagoSenia(
    clienteId: number,
    claseId: number,
  ): Promise<boolean> {
    this.logger.log(
      `Procesando seña para cliente ${clienteId}, clase ${claseId}`,
    );
    return true;
  }

  private async removerDeListaEspera(
    clienteId: number,
    claseId: number,
  ): Promise<void> {
    await this.supabase.client
      .from('Lista de espera')
      .delete()
      .eq('id_clase', claseId)
      .eq('id_cliente', clienteId);
  }
}