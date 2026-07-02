import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { EmailService } from '../email/email.service';


@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailService: EmailService,
  ) { }


  async obtenerIdDeUsuario(token: string) {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException('Sesión inválida o expirada. Por favor, iniciá sesión nuevamente.');
    }

    const { data: persona, error: errorPersona } = await this.supabase.client
      .from('Persona_')
      .select('id')
      .eq('mail', userData.user.email)
      .single();

    if (errorPersona || !persona) {
      throw new UnauthorizedException('No se encontró el ID del cliente.');
    }

    return persona.id;
  }

  @Cron('0 45 15 * * *', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })
  async enviarRecordatoriosDiarios() {
    this.logger.log('Iniciando proceso automático de envío de recordatorios...');
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    const ahora = new Date();
    const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const fechaMananaStr = formatter.format(manana);

    console.log(`[Recordatorios] Buscando turnos para la fecha de mañana: ${fechaMananaStr}`);

    const { data: inscripciones, error } = await this.supabase.client
      .from('Se_inscribe')
      .select(`
      id_cliente,
      Cliente (
        Usuario (
          Persona ( mail, nombre )
        )
      ),
      Clase!inner ( id, fecha, hora, tipo )
    `)
      .eq('Clase.fecha', fechaMananaStr);

    if (error) {
      this.logger.error('Error en BD al buscar turnos para recordatorios:', error);
      return;
    }

    if (!inscripciones || inscripciones.length === 0) {
      this.logger.log(`No hay turnos programados para el ${fechaMananaStr}.`);
      return;
    }

    let enviados = 0;
    for (const inscripcion of inscripciones) {
      const clienteData = inscripcion.Cliente as any;

      const persona = clienteData?.Usuario?.Persona;
      const clase = inscripcion.Clase as any;

      if (persona?.mail) {
        try {
          // TODO: Para producción, reemplazar 'correoDestino' por 'persona.mail'
          // Por el momento se usa el correo verificado en Resend para la demostración.
          const correoDestino = persona.mail;

          await this.emailService.enviarCorreo(
            correoDestino, // <- En producción esto será: persona.mail
            'Recordatorio de tu turno en Kinescius',
            `<p>Hola ${persona.nombre},</p>
           <p>Te recordamos que mañana <strong>${clase.fecha}</strong> a las <strong>${clase.hora.slice(0, 5)} hs</strong> tenés tu sesión de ${clase.tipo}.</p>
           <p>¡Te esperamos!</p>`
          );
          enviados++;
        } catch (err) {
          this.logger.error(`Fallo al enviar recordatorio a ${persona.mail}`, err);
        }
      }
    }
  }
}