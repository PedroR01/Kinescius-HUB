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
        subject: 'Recuperación de contraseña de Kinescius-HUB',
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



  async enviarClaseCancelada(params: {
  to: string;
  nombre: string;
  fecha: string;
  hora: string;
  tipo: string | null;
}) {
  const { to, nombre, fecha, hora, tipo } = params;

  const fechaFormateada = new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const horaFormateada = hora.replace(/:00$/, 'hs');
  const actividad = tipo ?? 'clase';

  try {
    await this.enviarCorreo(
      to,
      `Cancelación de clase — ${actividad} del ${fechaFormateada}`,
      `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #0d1f18;">
          <h2 style="color: #2DBE7F;">Clase cancelada</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Te informamos que la siguiente clase fue <strong>cancelada</strong>:</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr>
              <td style="padding: 8px 12px; background: #f0faf5; font-weight: bold;">Actividad</td>
              <td style="padding: 8px 12px;">${actividad}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f0faf5; font-weight: bold;">Fecha</td>
              <td style="padding: 8px 12px;">${fechaFormateada}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f0faf5; font-weight: bold;">Hora</td>
              <td style="padding: 8px 12px;">${horaFormateada}</td>
            </tr>
          </table>
          <p>Lamentamos los inconvenientes. Podés reservar otra clase desde la aplicación.</p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">Este es un mensaje automático, por favor no respondas este email.</p>
        </div>
      `
    );
  } catch (error) {
    this.logger.error(`Error al enviar email de cancelación a ${to}: ${String(error)}`);
  }
}
}