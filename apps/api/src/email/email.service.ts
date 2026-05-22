import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Inicializamos Resend con la variable de entorno
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async enviarCorreo(to: string, subject: string, html: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Acme <carloigca@gmail.com>', // Recuerda que este es el mail por defecto para pruebas
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        this.logger.error(`Error al enviar correo a ${to}`, error);
        throw new Error('No se pudo enviar el correo');
      }

      this.logger.log(`Correo enviado exitosamente con ID: ${data.id}`);
      return data;
      
    } catch (error) {
      this.logger.error('Error interno del servicio de correos', error);
      throw error;
    }
  }
}