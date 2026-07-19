//es lo mismo de carlo, hice copy paste
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
  }

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  async enviarCorreo(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: to,
        subject: subject,
        html: html,
      });

      this.logger.log(`Correo enviado exitosamente con ID: ${info.messageId}`);
      return info;

    } catch (error) {
      this.logger.error('Error interno del servicio de correos', error);
      throw error;
    }
  }


  async enviarNuevaPassword(emailDestino: string, nuevaPassword: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.GMAIL_USER,
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

      this.logger.log(`Correo de recuperación de contraseña enviado exitosamente con ID: ${info.messageId}`);
      return info;

    } catch (error) {
      this.logger.error('Error interno del servicio de correos', error);
      throw error;
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

  /**
   * Notificación manual: un administrador elige un cliente y le
   * escribe un asunto y un mensaje libre, que se envía por Gmail.
   * A diferencia de enviarClaseCancelada, acá SI se propaga el error
   * hacia arriba, porque el admin necesita saber si el envío falló.
   */
  async enviarNotificacionManual(params: {
    to: string;
    nombre: string;
    asunto: string;
    mensaje: string;
  }) {
    const { to, nombre, asunto, mensaje } = params;

    try {
      const info = await this.enviarCorreo(
        to,
        asunto,
        `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #0d1f18;">
          <h2 style="color: #2DBE7F;">${asunto}</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <div style="white-space: pre-line; margin: 16px 0; line-height: 1.5;">${mensaje}</div>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">Este mensaje fue enviado por el equipo de Kinescius-HUB.</p>
        </div>
        `
      );

      this.logger.log(`Notificación manual enviada exitosamente a ${to}`);
      return info;

    } catch (error) {
      this.logger.error(`Error al enviar notificación manual a ${to}: ${String(error)}`);
      throw new InternalServerErrorException(
        'Error al enviar la notificación por correo'
      );
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