import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { EmailService } from '../email/email.service';

const CRON_TURNO_KEY = 'recordatorio-turno';
const CRON_PAGO_KEY = 'recordatorio-pago';
const DEFAULT_HORA = 15;
const DEFAULT_MINUTO = 45;
const DIAS_ABONO = 30;
const DIAS_GRACIA_AVISO = 9;
const UMBRAL_DIAS = DIAS_ABONO + DIAS_GRACIA_AVISO; // 39

@Injectable()
export class RecordatoriosService implements OnModuleInit {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailService: EmailService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) { }

  async onModuleInit() {
    const horarioTurno = await this.leerHorarioDesdeBD('turno');
    this.registrarCron(CRON_TURNO_KEY, horarioTurno.hora, horarioTurno.minuto, () => {
      void this.enviarRecordatoriosDiarios();
    });
    this.logger.log(`Cron de recordatorio de turno registrado a las ${horarioTurno.hora}:${String(horarioTurno.minuto).padStart(2, '0')}`);

    const horarioPago = await this.leerHorarioDesdeBD('pago');
    this.registrarCron(CRON_PAGO_KEY, horarioPago.hora, horarioPago.minuto, () => {
      void this.enviarRecordatoriosPago();
    });
    this.logger.log(`Cron de recordatorio de pago registrado a las ${horarioPago.hora}:${String(horarioPago.minuto).padStart(2, '0')}`);

    // Cron de suspensión: todos los días a las 00:05
    this.registrarCron('verificacion-mensualidad', 0, 5, () => {
      void this.verificarVencimientosMensualidad();
    });
    this.logger.log('Cron de verificación de vencimientos registrado a las 00:05');
  }

  // ── Configuración ──────────────────────────────────────────────

  async obtenerHorarios() {
    const turno = await this.leerHorarioDesdeBD('turno');
    const pago = await this.leerHorarioDesdeBD('pago');
    return {
      turno: { tipo: 'turno', hora: turno.hora, minuto: turno.minuto },
      pago: { tipo: 'pago', hora: pago.hora, minuto: pago.minuto },
    };
  }

  async actualizarHorario(hora: number, minuto: number) {
    const { error } = await this.supabase.client
      .from('Configuracion_Recordatorio')
      .update({ hora, minuto, updated_at: new Date().toISOString() })
      .eq('tipo', 'turno');

    if (error) {
      this.logger.error('Error al actualizar horario en BD:', error);
      throw new Error(`Error al actualizar horario: ${error.message}`);
    }

    this.eliminarCronSiExiste(CRON_TURNO_KEY);
    this.registrarCron(CRON_TURNO_KEY, hora, minuto, () => {
      void this.enviarRecordatoriosDiarios();
    });
    this.logger.log(`Horario de recordatorio de turno actualizado a ${hora}:${String(minuto).padStart(2, '0')}`);

    return { message: 'Horario cambiado con éxito' };
  }


  async actualizarHorarioPago(hora: number, minuto: number) {
    // Intentar actualizar; si no existe, insertar
    const { data, error } = await this.supabase.client
      .from('Configuracion_Recordatorio')
      .update({ hora, minuto, updated_at: new Date().toISOString() })
      .eq('tipo', 'pago')
      .select();

    if (error) {
      this.logger.error('Error al actualizar horario de pago en BD:', error);
      throw new Error(`Error al actualizar horario de pago: ${error.message}`);
    }

    // Si no había registro, insertarlo
    if (!data || data.length === 0) {
      const { error: insertError } = await this.supabase.client
        .from('Configuracion_Recordatorio')
        .insert({ tipo: 'pago', hora, minuto });

      if (insertError) {
        this.logger.error('Error al insertar horario de pago en BD:', insertError);
        throw new Error(`Error al insertar horario de pago: ${insertError.message}`);
      }
    }

    this.eliminarCronSiExiste(CRON_PAGO_KEY);
    this.registrarCron(CRON_PAGO_KEY, hora, minuto, () => {
      void this.enviarRecordatoriosPago();
    });
    this.logger.log(`Horario de recordatorio de pago actualizado a ${hora}:${String(minuto).padStart(2, '0')}`);

    return { message: 'Horario de recordatorio de pago cambiado con éxito' };
  }

  // ── Helpers de cron ────────────────────────────────────────────

  private registrarCron(key: string, hora: number, minuto: number, callback: () => void) {
    const cronExpression = `0 ${minuto} ${hora} * * *`;

    const job = new CronJob(
      cronExpression,
      callback,
      null,
      true,
      'America/Argentina/Buenos_Aires',
    );

    this.eliminarCronSiExiste(key);
    this.schedulerRegistry.addCronJob(key, job);
  }

  private eliminarCronSiExiste(name: string) {
    try {
      this.schedulerRegistry.deleteCronJob(name);
    } catch {
      // No existe todavía, está bien
    }
  }

  private async leerHorarioDesdeBD(tipo: string): Promise<{ hora: number; minuto: number }> {
    const { data, error } = await this.supabase.client
      .from('Configuracion_Recordatorio')
      .select('hora, minuto')
      .eq('tipo', tipo)
      .single();

    if (error || !data) {
      this.logger.warn(`No se encontró configuración de horario para '${tipo}', usando default ${DEFAULT_HORA}:${String(DEFAULT_MINUTO).padStart(2, '0')}`);
      return { hora: DEFAULT_HORA, minuto: DEFAULT_MINUTO };
    }

    return { hora: data.hora, minuto: data.minuto };
  }

  // ── Lógica de autenticación (reutilizada por otros módulos) ──

  async obtenerIdDeUsuario(token: string) {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser(token);

    if (userError || !userData.user) {

      throw new UnauthorizedException('Sesión inválida o expirada. Por favor, iniciá sesión nuevamente.');
    }

    const { data: persona, error: errorPersona } = await this.supabase.client
      .from('Persona_')
      .select('id, rol')
      .eq('mail', userData.user.email)
      .single();

    if (errorPersona || !persona) {
      throw new UnauthorizedException('No se encontró el ID del cliente.');
    }

    return { id: persona.id, rol: persona.rol };
  }

  // ── Envío de recordatorios de turno ───────────────────────────

  async enviarRecordatoriosDiarios() {
    this.logger.log('Iniciando proceso automático de envío de recordatorios de turno...');
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

    // Obtener datos de los clientes desde Persona_
    const clienteIds = [...new Set(inscripciones.map((i: any) => i.id_cliente))];
    const { data: personas, error: personaError } = await this.supabase.client
      .from('Persona_')
      .select('id, mail, nombre')
      .in('id', clienteIds);

    if (personaError) {
      this.logger.error('Error al obtener datos de personas:', personaError);
      return;
    }

    const personaMap = new Map((personas ?? []).map((p: any) => [p.id, p]));

    let enviados = 0;
    for (const inscripcion of inscripciones) {
      const persona = personaMap.get(inscripcion.id_cliente) as any;
      const clase = inscripcion.Clase as any;

      if (persona?.mail) {
        try {
          const correoDestino = persona.mail;

          await this.emailService.enviarCorreo(
            correoDestino,
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

  // ── Envío de recordatorios de pago ────────────────────────────

  async enviarRecordatoriosPago() {
    this.logger.log('Iniciando proceso automático de envío de recordatorios de pago...');

    // 1. Obtener todos los abonados (rol = 3)
    const { data: abonados, error: errorAbonados } = await this.supabase.client
      .from('Persona_')
      .select('id, nombre, mail')
      .eq('rol', 3);

    console.log('[Punto 1] Abonados encontrados:', abonados);

    if (errorAbonados) {
      this.logger.error('Error al obtener abonados:', errorAbonados);
      return;
    }

    if (!abonados || abonados.length === 0) {
      this.logger.log('No hay abonados registrados.');
      return;
    }

    const abonadoIds = abonados.map((a: any) => a.id);

    // 2. Obtener Estado_Cliente con id_pago_abonado para cada abonado
    const { data: estadosCliente, error: errorEstados } = await this.supabase.client
      .from('Estado_Cliente')
      .select('id, id_pago_abonado')
      .in('id', abonadoIds)
      .not('id_pago_abonado', 'is', null);

    console.log('[Punto 2] Estados_Cliente encontrados:', estadosCliente);

    if (errorEstados) {
      this.logger.error('Error al obtener Estado_Cliente:', errorEstados);
      return;
    }

    if (!estadosCliente || estadosCliente.length === 0) {
      this.logger.log('Ningún abonado tiene un pago de abono registrado.');
      return;
    }

    // 3. Obtener los pagos correspondientes
    const pagoIds = estadosCliente.map((e: any) => e.id_pago_abonado);
    const { data: pagos, error: errorPagos } = await this.supabase.client
      .from('Pago')
      .select('id_pago, fecha')
      .in('id_pago', pagoIds);

    console.log('[Punto 3] Pagos encontrados:', pagos);

    if (errorPagos) {
      this.logger.error('Error al obtener pagos:', errorPagos);
      return;
    }

    const pagoMap = new Map((pagos ?? []).map((p: any) => [p.id_pago, p]));
    const abonadoMap = new Map(abonados.map((a: any) => [a.id, a]));

    // 4. Calcular diferencia de días y enviar recordatorios
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let enviados = 0;

    for (const estado of estadosCliente) {
      const pago = pagoMap.get(estado.id_pago_abonado);
      if (!pago || !pago.fecha) continue;

      const fechaPago = new Date(pago.fecha);
      fechaPago.setHours(0, 0, 0, 0);

      const diffMs = hoy.getTime() - fechaPago.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24)) - 1;

      console.log(`[Punto 4] Abonado ID ${estado.id} | Fecha Pago DB: ${pago.fecha} | Días transcurridos: ${diffDias}`);

      if (diffDias === UMBRAL_DIAS) {
        const abonado = abonadoMap.get(estado.id);
        if (!abonado?.mail) continue;

        try {
          await this.emailService.enviarCorreo(
            abonado.mail,
            'Recordatorio de pago — Kinescius',
            `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #0d1f18;">
              <h2 style="color: #2DBE7F;">Recordatorio de pago</h2>
              <p>Hola <strong>${abonado.nombre}</strong>,</p>
              <p>Te informamos que tu abono venció hace <strong>${diffDias - DIAS_ABONO} días</strong>.</p>
              <p>Si no realizás el pago <strong>antes de mañana</strong>, tu cuenta será suspendida y perderás los beneficios de abonado.</p>
              <p>Podés abonar desde la aplicación.</p>
              <p style="color: #888; font-size: 12px; margin-top: 32px;">Este es un mensaje automático, por favor no respondas este email.</p>
            </div>
            `
          );
          enviados++;
          this.logger.log(`Recordatorio de pago enviado a ${abonado.nombre} (${abonado.mail}) — ${diffDias} días desde último pago`);
        } catch (err) {
          this.logger.error(`Fallo al enviar recordatorio de pago a ${abonado.mail}`, err);
        }
      }
    }
    this.logger.log(`Proceso de recordatorios de pago finalizado. Enviados: ${enviados}`);
  }

  // ── Suspención de abonados por falta de pago ────────────────────────────

  async verificarVencimientosMensualidad() {
    // 1. Traer clientes abonados activos con su pago
    //    JOIN: Estado_Cliente → Pago (via id_pago_abonado)
    const { data: clientes } = await this.supabase.client
      .from('Estado_Cliente')
      .select('id, id_pago_abonado, Pago!inner(fecha)')
      .not('id_pago_abonado', 'is', null);

    // 2. Para cada cliente, calcular días desde el último pago
    const hoy = new Date();
    const clientesAVencer = [];

    for (const cliente of clientes!) {
      const fechaPago = new Date((cliente as any).Pago.fecha);
      const diasTranscurridos = (hoy.getTime() - fechaPago.getTime()) / (1000 * 60 * 60 * 24);

      if (diasTranscurridos > 40) {
        clientesAVencer.push(cliente.id);
      }
    }

    // 3. Suspender todos los vencidos de una vez
    if (clientesAVencer.length > 0) {
      await this.supabase.client
        .from('Persona_')
        .update({ activo: false })
        .in('id', clientesAVencer);
    }
  }

}