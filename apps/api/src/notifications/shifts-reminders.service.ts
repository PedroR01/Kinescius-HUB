import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { EmailService } from '../email/email.service'; 

@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailService: EmailService,
  ) {}

  @Cron('0 30 15 * * *',{
    timeZone: 'America/Argentina/Buenos_Aires'
  })
  async enviarRecordatoriosDiarios() {
    this.logger.log('Iniciando proceso automático de envío de recordatorios...');

    const ahora = new Date();
    const offsetMinutos = ahora.getTimezoneOffset();
    const hoyArgentina = new Date(ahora.getTime() - (offsetMinutos * 60000));
    
    const manana = new Date(hoyArgentina);
    manana.setDate(manana.getDate() + 1);
    const fechaMananaStr = manana.toISOString().split('T')[0]; 

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
        await this.emailService.enviarCorreo(
          persona.mail, 
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