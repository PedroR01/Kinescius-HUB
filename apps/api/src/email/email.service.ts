import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
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
        from: 'Kinescius HUB <onboarding@resend.dev>', // Recuerda que este es el mail por defecto para pruebas
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

  async enviarNuevaPassword(emailDestino: string, nuevaPassword: string) {
    try {
      const { error } = await this.resend.emails.send({
        from: 'Kinescius-HUB <onboarding@resend.dev>', // Usamos el correo de prueba de Resend
        to: emailDestino,
        subject: 'Recuperación de contraseña - Kinescius-HUB',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>¡Hola!</h2>
            <p>Se ha solicitado un restablecimiento de contraseña para tu cuenta.</p>
            <p>Tu nueva contraseña es: <strong>${nuevaPassword}</strong></p>
            <p>Te recomendamos iniciar sesión y cambiarla por una que recuerdes.</p>
            <br/>
            <p>Saludos,<br/>El equipo de Kinescius-HUB</p>
          </div>
        `,
      });

      if (error) {
        console.error('Error de Resend:', error);
        throw new InternalServerErrorException('Fallo al enviar el correo con Resend');
      }
    } catch (err) {
      throw new InternalServerErrorException('No se pudo enviar el correo de recuperación.');
    }
  }
}