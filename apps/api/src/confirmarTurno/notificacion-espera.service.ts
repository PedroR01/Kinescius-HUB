import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { emailLugarDisponible } from './templates/email-lugar-disponible.template';
import { EmailService } from 'src/email/email.service';
import * as crypto from 'crypto';

const PRECIO_CLASE = 5000;
const PORCENTAJE_SENIA = 0.5;
const TOKEN_EXPIRY_HOURS = 24;

@Injectable()
export class NotificacionEsperaService {
  private readonly logger = new Logger(NotificacionEsperaService.name);
  private readonly baseUrl: string;

  constructor(private readonly supabase: SupabaseService, private readonly emailService: EmailService,) {
    this.baseUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async notificarProximoEnEspera(claseId: number): Promise<void> {
    const { data: enEspera, error: esperaError } = await this.supabase.client
      .from('Lista de espera')
      .select('id_cliente')
      .eq('id_clase', claseId)
      .order('id', { ascending: true })
      .limit(1);

    if (esperaError || !enEspera || enEspera.length === 0) {
      this.logger.log(`Lista de espera vacía para clase ${claseId}`);
      return;
    }

    const { id_cliente: clienteId } = enEspera[0];

    const { data: persona, error: personaError } = await this.supabase.client
      .from('Persona')
      .select('nombre, apellido, mail')
      .eq('id', clienteId)
      .single();

    if (personaError || !persona) {
      this.logger.error(`No se encontró persona para cliente ${clienteId}`);
      return;
    }

    const { data: clase, error: claseError } = await this.supabase.client
      .from('Clase')
      .select('fecha, hora, tipo')
      .eq('id', claseId)
      .single();

    if (claseError || !clase) {
      this.logger.error(`No se encontró la clase ${claseId}`);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + TOKEN_EXPIRY_HOURS);

    const { error: tokenError } = await this.supabase.client
      .from('tokens_confirmacion')
      .insert({
        cliente_id: clienteId,
        clase_id: claseId,
        token,
        expires_at: expiracion.toISOString(),
        usado: false,
      });

    if (tokenError) {
      this.logger.error(
        `No se pudo guardar el token de confirmación: ${tokenError.message}`,
      );
      throw new InternalServerErrorException(
        'Error generando token de confirmación.',
      );
    }

    const montosenia = PRECIO_CLASE * PORCENTAJE_SENIA;

    const html = emailLugarDisponible({
      nombre: persona.nombre,
      apellido: persona.apellido,
      tipoClase: clase.tipo ?? 'Clase',
      fecha: clase.fecha,
      hora: clase.hora,
      claseId,
      clienteId,
      token,
      baseUrl: this.baseUrl,
      montosenia,
    });

    try {
      await this.emailService.enviarCorreo(
        persona.mail,
        `¡Tu lugar está disponible! – ${clase.tipo ?? 'Clase'} del ${clase.fecha}`,
        html,
      );
      this.logger.log(
        `Email enviado a ${persona.mail} para clase ${claseId}`,
      );
    } catch (err) {
      this.logger.error(`Error enviando email con Resend: ${(err as Error).message}`);
    }
  }
}