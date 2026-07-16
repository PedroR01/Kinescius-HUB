import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import * as crypto from "crypto";

import { SupabaseService } from "../integrations/supabase/supabase.service";
import { EmailService } from "../email/email.service";

// IDs de la tabla "rol" (confirmados en Supabase: 0=admin, 1=profesor, 2=cliente, 3=cliente abonado)
const ROL_ADMIN_ID = 0;
const ROL_PROFESOR_ID = 1;
const ROL_CLIENTE_ID = 2;
const ROL_CLIENTE_ABONADO_ID = 3;

// IDs de la tabla "estado_clase"
const ESTADO_CLASE_CANCELADA = 2;

// Valores de la columna "historial_estado" en "Se_inscribe"
const HISTORIAL_ESTADO_CANCELADA = "Cancelada";

// Monto a favor que se acredita a cada cliente inscripto cuando se cancela su clase
const MONTO_A_FAVOR_CANCELACION = 5000;
//PARA ESTADISTICAS WACHIN
const REGEX_MES = /^\d{4}-\d{2}$/;


@Injectable()
export class ClasesAdminService {

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly emailService: EmailService,
  ) { }

  async findAll(startDate?: string, endDate?: string, incluirCanceladas = false) {

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(
        "La fecha inicial no puede ser posterior a la fecha final"
      );
    }

    let query = this.supabaseService.client
      .from("Clase")
      .select("*")
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    if (startDate) {
      query = query.gte("fecha", startDate);
    }

    if (endDate) {
      query = query.lte("fecha", endDate);
    }

    if (!incluirCanceladas) {
      query = query.neq("estado", ESTADO_CLASE_CANCELADA);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener clases: ${error.message}`
      );
    }

    const clases = (data ?? []) as Array<{
      id: number;
      id_profesor?: number | null;
      [key: string]: unknown;
    }>;

    const profesorIds = [...new Set(
      clases
        .map((clase) => clase.id_profesor)
        .filter((id): id is number => typeof id === "number")
    )];

    const profesorNombres = new Map<number, string | null>();

    if (profesorIds.length > 0) {
      const { data: personas, error: profesorError } =
        await this.supabaseService.client
          .from("Persona_")
          .select("id,nombre,apellido")
          .in("id", profesorIds);

      if (profesorError) {
        throw new InternalServerErrorException(
          `Error al obtener profesores: ${profesorError.message}`
        );
      }

      // DIAGNÓSTICO: si esto imprime menos filas de las esperadas (o 0),
      // es casi seguro un problema de RLS en la tabla "Persona_" bloqueando
      // la lectura de otras personas desde este cliente de Supabase, y NO
      // un problema de este archivo. Revisar Authentication > Policies de
      // "Persona_" en Supabase, o confirmar que supabaseService.client usa
      // la service_role key (no la anon/authenticated key) en el backend.
      if ((personas ?? []).length !== profesorIds.length) {
        console.warn(
          `[findAll] Se pidieron ${profesorIds.length} profesor(es) (ids: ${profesorIds.join(", ")}) ` +
          `pero Persona_ devolvió solo ${personas?.length ?? 0}. Revisar RLS en la tabla Persona_.`
        );
      }

      (personas ?? []).forEach((persona: { id: number; nombre?: string | null; apellido?: string | null }) => {
        const nombre = [persona.nombre, persona.apellido].filter(Boolean).join(' ')
        profesorNombres.set(persona.id, nombre || null);
      });
    }

    // OJO: el frontend (verClases.tsx, cambiarProfesor.tsx, etc.) lee "clase.profesor",
    // no "clase.profesor_nombre". Por eso siempre aparecía "Sin profesor" aunque la
    // clase sí tuviera un id_profesor asignado.
    //
    // FIX: antes se usaba "clase.id_profesor ? ... : null", que es un chequeo "truthy".
    // Si un profesor tiene id_profesor = 0 (posible, ya que 0 es un id válido en
    // Persona_), JavaScript lo evalúa como falso y la clase quedaba mostrando
    // "Sin profesor" a pesar de tener uno asignado. Se reemplaza por un chequeo
    // explícito de tipo (typeof === "number"), consistente con el filtro de
    // profesorIds de más arriba.
    return clases.map((clase) => ({
      ...clase,
      profesor:
        typeof clase.id_profesor === "number"
          ? profesorNombres.get(clase.id_profesor) ?? null
          : null,
    }));
  }

  async create({
    fecha,
    hora,
    tipo,
    profesorDni,
    cupo,
  }: {
    fecha: string;
    hora: string;
    tipo?: string | null;
    profesorDni?: string | null;
    cupo?: number;
  }) {
    const MAX_CLASES_POR_DIA_Y_HORARIO = 10;
    const MAX_CUPO = 50;
    const DEFAULT_CUPO = 10;

    const claseCupo = cupo ?? DEFAULT_CUPO;

    if (!Number.isInteger(claseCupo) || claseCupo < 1 || claseCupo > MAX_CUPO) {
      throw new BadRequestException("El cupo debe estar entre 1 y 50");
    }

    const countQuery = this.supabaseService.client
      .from("Clase")
      .select("id", { count: "exact", head: true })
      .eq("fecha", fecha)
      .eq("hora", hora)
      .neq("estado", ESTADO_CLASE_CANCELADA);

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new InternalServerErrorException(
        `Error al contar clases: ${countError.message}`
      );
    }

    if ((count ?? 0) >= MAX_CLASES_POR_DIA_Y_HORARIO) {
      throw new BadRequestException(
        "Ya hay 10 clases programadas para ese día y horario"
      );
    }

    let profesorId = null;

    if (profesorDni) {
      const { data: persona, error: personaError } =
        await this.supabaseService.client
          .from("Persona_")
          .select("id, rol")
          .eq("dni", profesorDni)
          .maybeSingle();

      if (personaError) {
        throw new InternalServerErrorException(
          `Error al buscar la persona: ${personaError.message}`
        );
      }

      if (!persona) {
        throw new BadRequestException(
          "No existe una persona con ese DNI"
        );
      }

      if (persona.rol !== ROL_PROFESOR_ID) {
        throw new BadRequestException(
          "La persona existe pero no es profesor"
        );
      }

      profesorId = persona.id;

      const { count: profesorClasesCount, error: profesorClaseError } =
        await this.supabaseService.client
          .from("Clase")
          .select("id", { count: "exact", head: true })
          .eq("id_profesor", profesorId)
          .eq("fecha", fecha)
          .eq("hora", hora)
          .neq("estado", ESTADO_CLASE_CANCELADA);

      if (profesorClaseError) {
        throw new InternalServerErrorException(
          `Error al verificar el profesor: ${profesorClaseError.message}`
        );
      }

      if ((profesorClasesCount ?? 0) > 0) {
        throw new BadRequestException(
          "El profesor ya tiene una clase programada para ese día y horario"
        );
      }
    }

    const insertPayload = {
      fecha,
      hora,
      tipo: tipo ?? null,
      id_profesor: profesorId,
      cupo: claseCupo,
    };

    const { data, error } = await this.supabaseService.client
      .from("Clase")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error al crear clase: ${error.message}`
      );
    }

    return {
      message: "Clase creada correctamente",
      clase: data,
    };
  }

  /**
   * Baja lógica de una clase: no se borra el registro, se marca
   * "estado" en 2 (Cancelada) en la tabla Clase. Las inscripciones
   * asociadas NO se eliminan: se conservan para historial, marcando
   * su columna "historial_estado" en "Cancelada". Los tokens de
   * confirmación sí se eliminan, para evitar confirmaciones sobre
   * una clase que ya no dicta.
   */
  async cancel(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException("El id de la clase debe ser mayor a 0");
    }

    const { data: clase, error: claseError } = await this.supabaseService.client
      .from("Clase")
      .select("id, fecha, hora, tipo, estado")
      .eq("id", id)
      .maybeSingle();

    if (claseError) {
      throw new InternalServerErrorException(
        `Error al buscar la clase: ${claseError.message}`
      );
    }

    if (!clase) {
      throw new NotFoundException("No existe una clase con ese id");
    }

    if (clase.estado === ESTADO_CLASE_CANCELADA) {
      throw new BadRequestException("La clase ya se encuentra cancelada");
    }

    // 1. Obtener IDs de clientes inscriptos
    const { data: inscripciones, error: inscripcionesQueryError } =
      await this.supabaseService.client
        .from("Se_inscribe")
        .select("id_cliente")
        .eq("id_clase", id);

    if (inscripcionesQueryError) {
      throw new InternalServerErrorException(
        `Error al obtener inscriptos: ${inscripcionesQueryError.message}`
      );
    }

    const clienteIds = (inscripciones ?? []).map((i: any) => i.id_cliente as number);

    // 2. Obtener datos de contacto desde Persona_
    let emailData: { mail: string | null; nombre: string }[] = [];

    if (clienteIds.length > 0) {
      const { data: personas, error: personasError } =
        await this.supabaseService.client
          .from("Persona_")
          .select("id, nombre, mail")
          .in("id", clienteIds);

      if (personasError) {
        console.error("Error al obtener datos de personas para notificación:", personasError.message);
      } else {
        emailData = (personas ?? []).map((p: any) => ({
          nombre: (p.nombre as string) ?? "Cliente",
          mail: (p.mail as string | null) ?? null,
        }));
      }
    }

    console.log(`[cancel] Clase ${id} - inscriptos encontrados: ${clienteIds.length}`);
    console.log(`[cancel] Emails a notificar:`, emailData);

    // 3. Marcar las inscripciones como "Cancelada" en su historial (no se borran)
    const { error: inscripcionesError } = await this.supabaseService.client
      .from("Se_inscribe")
      .update({ historial_estado: HISTORIAL_ESTADO_CANCELADA })
      .eq("id_clase", id);

    if (inscripcionesError) {
      throw new InternalServerErrorException(
        `Error al actualizar el historial de inscripciones: ${inscripcionesError.message}`
      );
    }

    // 3.1. Acreditar monto a favor a cada cliente inscripto
    if (clienteIds.length > 0) {
      const { data: estadosExistentes, error: estadosError } =
        await this.supabaseService.client
          .from("Estado_Cliente")
          .select("id, monto_favor")
          .in("id", clienteIds);

      if (estadosError) {
        throw new InternalServerErrorException(
          `Error al obtener el estado de los clientes: ${estadosError.message}`
        );
      }

      const montoFavorPorCliente = new Map<number, number>();
      (estadosExistentes ?? []).forEach((estado: any) => {
        montoFavorPorCliente.set(estado.id, Number(estado.monto_favor) ?? 0);
      });

      const clientesAActualizar = clienteIds.filter((clienteId) =>
        montoFavorPorCliente.has(clienteId)
      );
      const clientesAInsertar = clienteIds.filter(
        (clienteId) => !montoFavorPorCliente.has(clienteId)
      );

      const updatePromises = clientesAActualizar.map((clienteId) => {
        const nuevoMonto =
          (montoFavorPorCliente.get(clienteId) ?? 0) + MONTO_A_FAVOR_CANCELACION;

        return this.supabaseService.client
          .from("Estado_Cliente")
          .update({ monto_favor: nuevoMonto })
          .eq("id", clienteId);
      });

      const updateResults = await Promise.all(updatePromises);
      const updateError = updateResults.find((result) => result.error)?.error;

      if (updateError) {
        throw new InternalServerErrorException(
          `Error al acreditar el monto a favor: ${updateError.message}`
        );
      }

      if (clientesAInsertar.length > 0) {
        const { error: insertError } = await this.supabaseService.client
          .from("Estado_Cliente")
          .insert(
            clientesAInsertar.map((clienteId) => ({
              id: clienteId,
              monto_favor: MONTO_A_FAVOR_CANCELACION,
            }))
          );

        if (insertError) {
          throw new InternalServerErrorException(
            `Error al acreditar el monto a favor: ${insertError.message}`
          );
        }
      }

      console.log(
        `[cancel] Clase ${id} - monto a favor de $${MONTO_A_FAVOR_CANCELACION} acreditado a ${clienteIds.length} cliente/s`
      );
    }

    // 3.5. Eliminar tokens de confirmación que referencian la clase
    // FIX: la tabla real en el schema se llama "Token_Qr" (con esa
    // capitalización), no "tokens_confirmacion". Ese nombre no existe
    // en Supabase, por eso tiraba: "Could not find the table
    // 'public.tokens_confirmacion' in the schema cache".
    const { error: tokenError } = await this.supabaseService.client
      .from("Token_Qr")
      .delete()
      .eq("clase_id", id);

    if (tokenError) {
      throw new InternalServerErrorException(
        `Error al eliminar tokens de confirmación: ${tokenError.message}`
      );
    }

    // 4. Baja lógica de la clase: se marca como cancelada, no se borra
    const { error: updateError } = await this.supabaseService.client
      .from("Clase")
      .update({ estado: ESTADO_CLASE_CANCELADA })
      .eq("id", id);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error al cancelar la clase: ${updateError.message}`
      );
    }

    // 5. Enviar emails de notificación
    const emailPromises = emailData.map(({ mail, nombre }) => {
      if (!mail) return Promise.resolve();

      return this.emailService.enviarClaseCancelada({
        to: mail,
        nombre,
        fecha: clase.fecha,
        hora: clase.hora,
        tipo: clase.tipo ?? null,
      });
    });

    const results = await Promise.allSettled(emailPromises);

    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`[cancel] Error enviando email a ${emailData[i]?.mail}:`, result.reason);
      } else {
        console.log(`[cancel] Email enviado correctamente a ${emailData[i]?.mail}`);
      }
    });

    const enviados = results.filter((r) => r.status === "fulfilled").length;

    return {
      message: `Clase cancelada correctamente. Se notificó a ${enviados} inscripto/s y se acreditó $${MONTO_A_FAVOR_CANCELACION} a favor de ${clienteIds.length} cliente/s.`,
      id,
    };
  }

  async getInscriptos(fecha: string, tipo: string) {
    if (!fecha || !tipo) {
      throw new BadRequestException("Fecha y clase son requeridos");
    }

    const { data: classesOnDate, error: dateError } = await this.supabaseService.client
      .from("Clase")
      .select("id")
      .eq("fecha", fecha);

    if (dateError) {
      throw new InternalServerErrorException(
        `Error al consultar clases: ${dateError.message}`
      );
    }

    if (!classesOnDate || classesOnDate.length === 0) {
      return {
        message: "No hay clases en el día ingresado",
        inscriptos: [] as any[],
      };
    }

    const { data: clases, error: claseError } = await this.supabaseService.client
      .from("Clase")
      .select("id, fecha, hora, tipo")
      .eq("fecha", fecha)
      .eq("tipo", tipo)
      .neq("estado", ESTADO_CLASE_CANCELADA)
      .order("hora", { ascending: true })
      .limit(1);

    if (claseError) {
      throw new InternalServerErrorException(
        `Error al buscar la clase: ${claseError.message}`
      );
    }

    const clase = clases?.[0];

    if (!clase) {
      return {
        message: "No existe esa clase en el día ingresado",
        inscriptos: [] as any[],
      };
    }

    const { data: enrollments, error: enrollmentError } = await this.supabaseService.client
      .from("Se_inscribe")
      .select(
        `id_cliente, estado, Persona_!inner(nombre,apellido,dni,mail)`
      )
      .eq("id_clase", clase.id);

    if (enrollmentError) {
      throw new InternalServerErrorException(
        `Error al obtener los inscriptos: ${enrollmentError.message}`
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return {
        message: "No hay inscriptos en esa clase",
        inscriptos: [] as any[],
      };
    }

    const mapped = enrollments.map((entry: any) => ({
      clienteId: entry.id_cliente,
      estado: entry.estado,
      nombre: entry?.Persona_?.nombre ?? null,
      apellido: entry?.Persona_?.apellido ?? null,
      dni: entry?.Persona_?.dni ?? null,
      mail: entry?.Persona_?.mail ?? null,
    }));

    return {
      message: `Se encontraron ${mapped.length} inscriptos`,
      clase,
      inscriptos: mapped,
    };
  }

  async getClientes() {
    const { data, error } = await this.supabaseService.client
      .from('Persona_')
      .select('id, nombre, apellido, dni, mail')
      .in('rol', [2, 3])
      .eq('activo', true);

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener clientes: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      return {
        message: "No hay clientes inscriptos",
        clientes: [] as any[],
      };
    }

    const clientes = data.map((entry: any) => ({
      id: entry.id,
      nombre: entry.nombre,
      apellido: entry.apellido,
      dni: entry.dni,
      mail: entry.mail,
    }));



    return {
      message: `Se encontraron ${clientes.length} clientes`,
      clientes,
    };
  }

  async getProfesores() {
    const { data: profesores, error: profesorError } =
      await this.supabaseService.client
        .from("Persona_")
        .select("id, nombre, apellido, dni")
        .eq("rol", ROL_PROFESOR_ID);

    if (profesorError) {
      throw new InternalServerErrorException(
        `Error al obtener profesores: ${profesorError.message}`
      );
    }

    const resultado = (profesores ?? []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre ?? null,
      apellido: p.apellido ?? null,
      dni: p.dni ?? null,
    }));

    return { profesores: resultado };
  }

  async getProfesoresActivos() {
    const { data: profesores, error: profesorError } =
      await this.supabaseService.client
        .from("Persona_")
        .select("id, nombre, apellido, dni")
        .eq("rol", ROL_PROFESOR_ID)
        .eq("activo", true);

    if (profesorError) {
      throw new InternalServerErrorException(
        `Error al obtener profesores: ${profesorError.message}`
      );
    }

    const resultado = (profesores ?? []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre ?? null,
      apellido: p.apellido ?? null,
      dni: p.dni ?? null,
    }));

    return { profesores: resultado };
  }

  async getProfesoresDisponibles(fecha: string, hora: string) {
    if (!fecha || !hora) {
      throw new BadRequestException("Fecha y hora son requeridos");
    }

    const { data: clasesOcupadas, error: clasesError } = await this.supabaseService.client
      .from("Clase")
      .select("id_profesor")
      .eq("fecha", fecha)
      .eq("hora", hora)
      .neq("estado", ESTADO_CLASE_CANCELADA)
      .not("id_profesor", "is", null);

    if (clasesError) {
      throw new InternalServerErrorException(
        `Error al verificar disponibilidad: ${clasesError.message}`
      );
    }

    const idsOcupados = (clasesOcupadas ?? [])
      .map((c: any) => c.id_profesor)
      .filter(Boolean);

    const { data: todosProfesores, error: profesorError } =
      await this.supabaseService.client
        .from("Persona_")
        .select("id, nombre, apellido, dni")
        .eq("rol", ROL_PROFESOR_ID)
        .eq("activo", true);

    if (profesorError) {
      throw new InternalServerErrorException(
        `Error al obtener profesores: ${profesorError.message}`
      );
    }

    const resultado = (todosProfesores ?? [])
      .filter((p: any) => !idsOcupados.includes(p.id))
      .map((p: any) => ({
        id: p.id,
        nombre: p.nombre ?? null,
        apellido: p.apellido ?? null,
        dni: p.dni ?? null,
      }));

    return { profesores: resultado };
  }

  async cambiarProfesor(idClase: number, idProfesor: number) {
    if (!Number.isInteger(idClase) || idClase <= 0) {
      throw new BadRequestException("El id de la clase debe ser mayor a 0");
    }

    if (!Number.isInteger(idProfesor) || idProfesor <= 0) {
      throw new BadRequestException("El id del profesor debe ser mayor a 0");
    }

    const { data: clase, error: claseError } = await this.supabaseService.client
      .from("Clase")
      .select("id, fecha, hora")
      .eq("id", idClase)
      .maybeSingle();

    if (claseError) {
      throw new InternalServerErrorException(
        `Error al buscar la clase: ${claseError.message}`
      );
    }

    if (!clase) {
      throw new NotFoundException("No existe una clase con ese id");
    }

    const { data: profesor, error: profesorError } = await this.supabaseService.client
      .from("Persona_")
      .select("id, rol")
      .eq("id", idProfesor)
      .maybeSingle();

    if (profesorError) {
      throw new InternalServerErrorException(
        `Error al buscar el profesor: ${profesorError.message}`
      );
    }

    if (!profesor || profesor.rol !== ROL_PROFESOR_ID) {
      throw new NotFoundException("No existe un profesor con ese id");
    }

    const { count, error: countError } = await this.supabaseService.client
      .from("Clase")
      .select("id", { count: "exact", head: true })
      .eq("id_profesor", idProfesor)
      .eq("fecha", clase.fecha)
      .eq("hora", clase.hora)
      .neq("estado", ESTADO_CLASE_CANCELADA)
      .neq("id", idClase);

    if (countError) {
      throw new InternalServerErrorException(
        `Error al verificar disponibilidad: ${countError.message}`
      );
    }

    if ((count ?? 0) > 0) {
      throw new BadRequestException(
        "El profesor ya tiene una clase en ese día y horario"
      );
    }

    const { error: updateError } = await this.supabaseService.client
      .from("Clase")
      .update({ id_profesor: idProfesor })
      .eq("id", idClase);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error al cambiar el profesor: ${updateError.message}`
      );
    }

    return {
      message: "Profesor actualizado correctamente",
      idClase,
      idProfesor,
    };
  }

  /**
   * Genera una contraseña temporal aleatoria (mismo patrón que auth.service.ts).
   */
  private generarPasswordAleatoria(longitud: number = 8): string {
    return crypto.randomBytes(longitud).toString('hex').slice(0, longitud);
  }

  async crearProfesor({
    dni,
    mail,
    nombre,
    apellido,
  }: {
    dni: string;
    mail: string;
    nombre: string;
    apellido: string;
  }) {
    if (!dni || !mail || !nombre || !apellido) {
      throw new BadRequestException(
        "El DNI, el mail, el nombre y el apellido son obligatorios"
      );
    }

    const { data: personaExistente, error: personaBusquedaError } =
      await this.supabaseService.client
        .from("Persona_")
        .select("id, dni, mail")
        .or(`dni.eq.${dni},mail.eq.${mail}`)
        .maybeSingle();

    if (personaBusquedaError) {
      throw new InternalServerErrorException(
        `Error al verificar persona existente: ${personaBusquedaError.message}`
      );
    }

    if (personaExistente) {
      const campo = personaExistente.dni === dni ? "DNI" : "mail";
      throw new BadRequestException(
        `Ya existe una persona registrada con ese ${campo}`
      );
    }

    // Generamos una contraseña temporal, igual que en el registro de clientes
    const passwordBase = this.generarPasswordAleatoria(8);

    // Creamos el usuario en Supabase Auth
    const { data: authData, error: authError } =
      await this.supabaseService.client.auth.admin.createUser({
        email: mail,
        password: passwordBase,
        email_confirm: true,
      });

    if (authError) {
      throw new InternalServerErrorException(
        `Error en autenticación: ${authError.message}`
      );
    }

    const { data: persona, error: personaError } =
      await this.supabaseService.client
        .from("Persona_")
        .insert({
          dni,
          mail,
          nombre,
          apellido,
          rol: ROL_PROFESOR_ID,
          activo: true,
        })
        .select("id")
        .single();

    if (personaError || !persona) {
      // Rollback: si falla la inserción en Persona_, borramos el usuario de Auth
      await this.supabaseService.client.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException(
        `Error al crear el profesor: ${personaError?.message}`
      );
    }

    console.log(
      `----------¡ATENCIÓN! La contraseña generada para ${mail} es: ${passwordBase}----------`
    );

    try {
      await this.emailService.enviarCorreo(
        mail,
        "Cuenta de profesor en Kinescius-HUB",
        `<h2>Tu cuenta de profesor fue creada</h2>
         <p>Tu contraseña temporal es: <strong>${passwordBase}</strong></p>
         <p>Podés cambiarla luego de iniciar sesión.</p>`
      );
    } catch (emailError) {
      // Si falla el mail, no rompemos el flujo: el profesor ya quedó creado
      console.error("El profesor se creó, pero falló el envío del correo:", emailError);
    }

    return {
      message: "Profesor creado correctamente",
      profesor: { id: persona.id, dni, mail, nombre, apellido },
    };
  }

  /**
   * Baja lógica de un profesor: no se borra el registro, se marca
   * "activo" en false en la tabla Persona_.
   */
  async eliminarProfesor(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException("El id del profesor debe ser mayor a 0");
    }

    const { data: persona, error: personaError } = await this.supabaseService.client
      .from("Persona_")
      .select("id, rol, activo, nombre, apellido")
      .eq("id", id)
      .maybeSingle();

    if (personaError) {
      throw new InternalServerErrorException(
        `Error al buscar el profesor: ${personaError.message}`
      );
    }

    if (!persona) {
      throw new NotFoundException("No existe una persona con ese id");
    }

    if (persona.rol !== ROL_PROFESOR_ID) {
      throw new BadRequestException("La persona existe pero no es profesor");
    }

    if (persona.activo === false) {
      throw new BadRequestException("El profesor ya se encuentra dado de baja");
    }

    // No permitir la baja si el profesor tiene clases pendientes (futuras y no canceladas)
    const hoy = new Date().toISOString().split("T")[0];

    const { count: clasesPendientes, error: clasesPendientesError } =
      await this.supabaseService.client
        .from("Clase")
        .select("id", { count: "exact", head: true })
        .eq("id_profesor", id)
        .gte("fecha", hoy)
        .neq("estado", ESTADO_CLASE_CANCELADA);

    if (clasesPendientesError) {
      throw new InternalServerErrorException(
        `Error al verificar clases pendientes: ${clasesPendientesError.message}`
      );
    }

    if ((clasesPendientes ?? 0) > 0) {
      throw new BadRequestException(
        `No se puede dar de baja al profesor porque tiene ${clasesPendientes} clase/s pendiente/s. Cancelalas o reasigná el profesor antes de continuar.`
      );
    }

    const { error: updateError } = await this.supabaseService.client
      .from("Persona_")
      .update({ activo: false })
      .eq("id", id);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error al dar de baja al profesor: ${updateError.message}`
      );
    }

    return {
      message: "Profesor dado de baja correctamente",
      id,
    };
  }

  async cambiarEstadoUsuario(id: number, activo: boolean) {
    const { data, error } = await this.supabaseService.client
      .from('Persona_')
      .update({ activo })
      .eq('id', id);
    return { success: true, mensaje: activo ? "Suspención revocada con éxito." : "Cliente suspendido con éxito." };
  }

  async getClientesSuspendidos() {
    const { data, error } = await this.supabaseService.client
      .from('Persona_')
      .select('id, nombre, apellido, dni, mail')
      .in('rol', [2, 3])
      .eq('activo', false);

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener clientes: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      return {
        message: "No hay clientes inscriptos",
        clientes: [] as any[],
      };
    }

    const clientes = data.map((entry: any) => ({
      id: entry.id,
      nombre: entry.nombre,
      apellido: entry.apellido,
      dni: entry.dni,
      mail: entry.mail,
    }));

    return {
      message: `Se encontraron ${clientes.length} clientes`,
      clientes,
    };
  }

  async getEstadoSuscripcion() {
    const { data, error } = await this.supabaseService.client
      .from('Persona_')
      .select('id, nombre, apellido, dni, mail, rol')
      .in('rol', [ROL_CLIENTE_ID, ROL_CLIENTE_ABONADO_ID])
      .eq('activo', true);

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener el estado de suscripción: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      return {
        message: "No hay usuarios registrados",
        abonados: [] as any[],
        noAbonados: [] as any[],
      };
    }

    const mapPersona = (entry: any) => ({
      id: entry.id,
      nombre: entry.nombre,
      apellido: entry.apellido,
      dni: entry.dni,
      mail: entry.mail,
    });

    const abonados = data
      .filter((p: any) => p.rol === ROL_CLIENTE_ABONADO_ID)
      .map(mapPersona);

    const noAbonados = data
      .filter((p: any) => p.rol === ROL_CLIENTE_ID)
      .map(mapPersona);

    return {
      message: `Se encontraron ${abonados.length} abonados y ${noAbonados.length} no abonados`,
      abonados,
      noAbonados,
    };
  }

// ...

/**
 * Estadísticas generales del mes: cuántos abonados pagaron (según lo que
 * ya carga el webhook de Mercado Pago en "Pago"), cuáles faltan, y qué
 * actividad tuvo más inscriptos reales. No modifica ninguna tabla, solo lee.
 */
async getEstadisticasGenerales(mes?: string) {
  const mesTarget = mes ?? new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  if (!REGEX_MES.test(mesTarget)) {
    throw new BadRequestException("El mes debe tener el formato YYYY-MM");
  }

  const [anio, mesNumero] = mesTarget.split("-").map(Number);
  const primerDia = `${mesTarget}-01`;
  const ultimoDiaNum = new Date(anio, mesNumero, 0).getDate();
  const ultimoDia = `${mesTarget}-${String(ultimoDiaNum).padStart(2, "0")}`;

  // 1. Abonados activos
  const { data: abonados, error: abonadosError } = await this.supabaseService.client
    .from("Persona_")
    .select("id, nombre, apellido, mail")
    .eq("rol", ROL_CLIENTE_ABONADO_ID)
    .eq("activo", true);

  if (abonadosError) {
    throw new InternalServerErrorException(
      `Error al obtener abonados: ${abonadosError.message}`
    );
  }

  const abonadosIds = (abonados ?? []).map((a: any) => a.id);

  // 2. Pagos ya existentes en el mes para esos abonados (solo lectura)
  let idsPagaron = new Set<number>();

  if (abonadosIds.length > 0) {
    const { data: pagos, error: pagosError } = await this.supabaseService.client
      .from("Pago")
      .select("id_cliente, fecha")
      .in("id_cliente", abonadosIds)
      .gte("fecha", primerDia)
      .lte("fecha", ultimoDia);

    if (pagosError) {
      throw new InternalServerErrorException(
        `Error al obtener pagos: ${pagosError.message}`
      );
    }

    idsPagaron = new Set((pagos ?? []).map((p: any) => p.id_cliente));
  }

  const pagaron = (abonados ?? []).filter((a: any) => idsPagaron.has(a.id));
  const faltantes = (abonados ?? []).filter((a: any) => !idsPagaron.has(a.id));

  // 3. Actividad más concurrida del mes (Se_inscribe + Clase)
  const { data: clasesDelMes, error: clasesError } = await this.supabaseService.client
    .from("Clase")
    .select("id, tipo")
    .gte("fecha", primerDia)
    .lte("fecha", ultimoDia)
    .neq("estado", ESTADO_CLASE_CANCELADA);

  if (clasesError) {
    throw new InternalServerErrorException(
      `Error al obtener clases del mes: ${clasesError.message}`
    );
  }

  const tipoPorClaseId = new Map<number, string>();
  (clasesDelMes ?? []).forEach((c: any) => {
    tipoPorClaseId.set(c.id, c.tipo ?? "Sin tipo");
  });

  const claseIdsDelMes = [...tipoPorClaseId.keys()];
  const conteoPorTipo = new Map<string, number>();
  [...new Set(tipoPorClaseId.values())].forEach((tipo) => {
  conteoPorTipo.set(tipo, 0);
});

  if (claseIdsDelMes.length > 0) {
    const { data: inscripciones, error: inscripcionesError } = await this.supabaseService.client
      .from("Se_inscribe")
      .select("id_clase")
      .in("id_clase", claseIdsDelMes);

    if (inscripcionesError) {
      throw new InternalServerErrorException(
        `Error al obtener inscripciones del mes: ${inscripcionesError.message}`
      );
    }

    (inscripciones ?? []).forEach((i: any) => {
      const tipo = tipoPorClaseId.get(i.id_clase) ?? "Sin tipo";
      conteoPorTipo.set(tipo, (conteoPorTipo.get(tipo) ?? 0) + 1);
    });
  }

  const actividadPorConcurrencia = [...conteoPorTipo.entries()]
    .map(([tipo, inscriptos]) => ({ tipo, inscriptos }))
    .sort((a, b) => b.inscriptos - a.inscriptos);

  return {
    mes: mesTarget,
    pagos: {
      totalAbonados: abonados?.length ?? 0,
      pagaron: pagaron.map((p: any) => ({
        id: p.id, nombre: p.nombre, apellido: p.apellido, mail: p.mail,
      })),
      faltantes: faltantes.map((p: any) => ({
        id: p.id, nombre: p.nombre, apellido: p.apellido, mail: p.mail,
      })),
    },
    actividadPorConcurrencia,
  };
}
  async getEstadisticas(claseId: number) {
    if (!Number.isInteger(claseId) || claseId <= 0) {
      throw new BadRequestException("El id de la clase debe ser mayor a 0");
    }

    const { data: clase, error: claseError } = await this.supabaseService.client
      .from("Clase")
      .select("id, fecha, hora, tipo, cupo")
      .eq("id", claseId)
      .maybeSingle();

    if (claseError) {
      throw new InternalServerErrorException(
        `Error al buscar la clase: ${claseError.message}`
      );
    }

    if (!clase) {
      throw new NotFoundException("No existe una clase con ese id");
    }

    if (!clase.tipo) {
      return {
        message: "No hay estadísticas de clases previas para esta clase",
        hayEstadisticas: false,
      };
    }

    const hoy = new Date().toISOString().split("T")[0];

    // Clases previas del mismo tipo (excluyendo la actual)
    const { data: clasesPrevias, error: previasError } = await this.supabaseService.client
      .from("Clase")
      .select("id, fecha, hora, cupo")
      .eq("tipo", clase.tipo)
      .lt("fecha", hoy)
      .neq("id", claseId);

    if (previasError) {
      throw new InternalServerErrorException(
        `Error al obtener clases previas: ${previasError.message}`
      );
    }

    if (!clasesPrevias || clasesPrevias.length === 0) {
      return {
        message: "No hay estadísticas de clases previas para esta clase",
        hayEstadisticas: false,
      };
    }

    const claseIds = clasesPrevias.map((c: any) => c.id);

    const { data: inscripciones, error: inscripcionesError } = await this.supabaseService.client
      .from("Se_inscribe")
      .select("id_clase")
      .in("id_clase", claseIds);

    if (inscripcionesError) {
      throw new InternalServerErrorException(
        `Error al obtener inscripciones: ${inscripcionesError.message}`
      );
    }

    const conteoPorClase = new Map<number, number>();
    claseIds.forEach((id: number) => conteoPorClase.set(id, 0));
    (inscripciones ?? []).forEach((i: any) => {
      conteoPorClase.set(i.id_clase, (conteoPorClase.get(i.id_clase) ?? 0) + 1);
    });

    const detalle = clasesPrevias.map((c: any) => {
      const inscriptos = conteoPorClase.get(c.id) ?? 0;
      const cupo = c.cupo ?? null;
      const ocupacion = cupo ? Math.round((inscriptos / cupo) * 100) : null;
      return { id: c.id, fecha: c.fecha, hora: c.hora, cupo, inscriptos, ocupacion };
    });

    const totalClasesPrevias = detalle.length;
    const promedioInscriptos =
      detalle.reduce((sum, d) => sum + d.inscriptos, 0) / totalClasesPrevias;

    const ocupacionesValidas = detalle
      .filter((d) => d.ocupacion !== null)
      .map((d) => d.ocupacion as number);
    const promedioOcupacion =
      ocupacionesValidas.length > 0
        ? Math.round(
            ocupacionesValidas.reduce((a, b) => a + b, 0) / ocupacionesValidas.length
          )
        : null;

    const claseMasConcurrida = [...detalle].sort((a, b) => b.inscriptos - a.inscriptos)[0];
    const claseMenosConcurrida = [...detalle].sort((a, b) => a.inscriptos - b.inscriptos)[0];

    return {
      message: `Se encontraron estadísticas de ${totalClasesPrevias} clases previas`,
      hayEstadisticas: true,
      tipo: clase.tipo,
      totalClasesPrevias,
      promedioInscriptos: Math.round(promedioInscriptos * 10) / 10,
      promedioOcupacion,
      claseMasConcurrida,
      claseMenosConcurrida,
      detalle: [...detalle].sort((a, b) => a.fecha.localeCompare(b.fecha)), // ordenado por fecha
    };
  }


  /**
   * Envía una notificación manual (asunto + mensaje libre) por mail
   * a un cliente puntual, elegido por el administrador.
   */
  async enviarNotificacionManual({
    clienteId,
    asunto,
    mensaje,
  }: {
    clienteId: number;
    asunto: string;
    mensaje: string;
  }) {
    if (!Number.isInteger(clienteId) || clienteId <= 0) {
      throw new BadRequestException("El id del cliente debe ser mayor a 0");
    }

    if (!asunto || !asunto.trim()) {
      throw new BadRequestException("El asunto es obligatorio");
    }

    if (!mensaje || !mensaje.trim()) {
      throw new BadRequestException("El mensaje es obligatorio");
    }

    const { data: persona, error: personaError } = await this.supabaseService.client
      .from("Persona_")
      .select("id, nombre, apellido, mail")
      .eq("id", clienteId)
      .maybeSingle();

    if (personaError) {
      throw new InternalServerErrorException(
        `Error al buscar el cliente: ${personaError.message}`
      );
    }

    if (!persona) {
      throw new NotFoundException("No existe un cliente con ese id");
    }

    if (!persona.mail) {
      throw new BadRequestException("El cliente no tiene un mail registrado");
    }

    const nombreCompleto =
      [persona.nombre, persona.apellido].filter(Boolean).join(" ") || "Cliente";

    await this.emailService.enviarNotificacionManual({
      to: persona.mail,
      nombre: nombreCompleto,
      asunto: asunto.trim(),
      mensaje: mensaje.trim(),
    });

    return {
      message: `Notificación enviada correctamente a ${nombreCompleto}`,
    };
  }
}