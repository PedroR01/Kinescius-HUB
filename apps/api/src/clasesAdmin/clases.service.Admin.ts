import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import { SupabaseService } from "../integrations/supabase/supabase.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class ClasesAdminService {

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(startDate?: string, endDate?: string) {

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

    const profesorDnis = new Map<number, string | null>();

    if (profesorIds.length > 0) {
      const { data: personas, error: profesorError } =
        await this.supabaseService.client
          .from("Persona")
          .select("id,dni")
          .in("id", profesorIds);

      if (profesorError) {
        throw new InternalServerErrorException(
          `Error al obtener profesores: ${profesorError.message}`
        );
      }

      (personas ?? []).forEach((persona: { id: number; dni?: string | null }) => {
        profesorDnis.set(persona.id, persona.dni ?? null);
      });
    }

    return clases.map((clase) => ({
      ...clase,
      profesor_dni: clase.id_profesor
        ? profesorDnis.get(clase.id_profesor) ?? null
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
      .eq("hora", hora);

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
          .from("Persona")
          .select("id")
          .eq("dni", profesorDni)
          .single();

      if (personaError || !persona) {
        throw new BadRequestException(
          "No existe una persona con ese DNI"
        );
      }

      const { data: profesor, error: profesorError } =
        await this.supabaseService.client
          .from("Profesor")
          .select("id")
          .eq("id", persona.id)
          .single();

      if (profesorError || !profesor) {
        throw new BadRequestException(
          "La persona existe pero no es profesor"
        );
      }

      profesorId = profesor.id;

      const { count: profesorClasesCount, error: profesorClaseError } =
        await this.supabaseService.client
          .from("Clase")
          .select("id", { count: "exact", head: true })
          .eq("id_profesor", profesorId)
          .eq("fecha", fecha)
          .eq("hora", hora);

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

  async cancel(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException("El id de la clase debe ser mayor a 0");
    }

    const { data: clase, error: claseError } = await this.supabaseService.client
      .from("Clase")
      .select("id, fecha, hora, tipo")
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

    const { data: inscripciones, error: inscripcionesQueryError } =
      await this.supabaseService.client
        .from("Se_inscribe")
        .select("id_cliente, Cliente!inner(Usuario!inner(Persona(nombre, mail)))")
        .eq("id_clase", id);

    if (inscripcionesQueryError) {
      throw new InternalServerErrorException(
        `Error al obtener inscriptos: ${inscripcionesQueryError.message}`
      );
    }

    const { error: inscripcionesError } = await this.supabaseService.client
      .from("Se_inscribe")
      .delete()
      .eq("id_clase", id);

    if (inscripcionesError) {
      throw new InternalServerErrorException(
        `Error al cancelar inscripciones: ${inscripcionesError.message}`
      );
    }

    const { error: deleteError } = await this.supabaseService.client
      .from("Clase")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new InternalServerErrorException(
        `Error al cancelar la clase: ${deleteError.message}`
      );
    }

    const emailPromises = (inscripciones ?? []).map((entry: any) => {
      const persona = entry?.Cliente?.Usuario?.Persona;
      const mail: string | null = persona?.mail ?? null;
      const nombre: string = persona?.nombre ?? "Cliente";

      if (!mail) return Promise.resolve();

      return this.emailService.enviarClaseCancelada({
        to: mail,
        nombre,
        fecha: clase.fecha,
        hora: clase.hora,
        tipo: clase.tipo ?? null,
      });
    });

    await Promise.allSettled(emailPromises);

    return {
      message: `Clase cancelada correctamente. Se notificó a ${emailPromises.length} inscripto/s.`,
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
        `id_cliente, estado, Cliente!inner(Usuario!inner(Persona(nombre,apellido,dni,mail)))`
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
      nombre: entry?.Cliente?.Usuario?.Persona?.nombre ?? null,
      apellido: entry?.Cliente?.Usuario?.Persona?.apellido ?? null,
      dni: entry?.Cliente?.Usuario?.Persona?.dni ?? null,
      mail: entry?.Cliente?.Usuario?.Persona?.mail ?? null,
    }));

    return {
      message: `Se encontraron ${mapped.length} inscriptos`,
      clase,
      inscriptos: mapped,
    };
  }

  async getClientes() {
    const { data, error } = await this.supabaseService.client
      .from("Cliente")
      .select("id, Usuario!inner(Persona(nombre,apellido,dni,mail))");

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
      clienteId: entry.id,
      nombre: entry?.Usuario?.Persona?.nombre ?? null,
      apellido: entry?.Usuario?.Persona?.apellido ?? null,
      dni: entry?.Usuario?.Persona?.dni ?? null,
      mail: entry?.Usuario?.Persona?.mail ?? null,
    }));

    return {
      message: `Se encontraron ${clientes.length} clientes`,
      clientes,
    };
  }

  async getProfesores() {
    const { data: profesores, error: profesorError } = await this.supabaseService.client
      .from("Profesor")
      .select("id");

    if (profesorError) {
      throw new InternalServerErrorException(
        `Error al obtener profesores: ${profesorError.message}`
      );
    }

    if (!profesores || profesores.length === 0) {
      return { profesores: [] };
    }

    const ids = profesores.map((p: any) => p.id);

    const { data: usuarios, error: usuarioError } = await this.supabaseService.client
      .from("Usuario")
      .select("id, Persona(id, nombre, apellido, dni)")
      .in("id", ids);

    if (usuarioError) {
      throw new InternalServerErrorException(
        `Error al obtener datos de profesores: ${usuarioError.message}`
      );
    }

    const resultado = profesores.map((p: any) => {
      const usuario = (usuarios ?? []).find((u: any) => u.id === p.id);
      const persona = (usuario as any)?.Persona;
      return {
        id: p.id,
        nombre: persona?.nombre ?? null,
        apellido: persona?.apellido ?? null,
        dni: persona?.dni ?? null,
      };
    });

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
      .not("id_profesor", "is", null);

    if (clasesError) {
      throw new InternalServerErrorException(
        `Error al verificar disponibilidad: ${clasesError.message}`
      );
    }

    const idsOcupados = (clasesOcupadas ?? [])
      .map((c: any) => c.id_profesor)
      .filter(Boolean);

    const { data: todosProfesores, error: profesorError } = await this.supabaseService.client
      .from("Profesor")
      .select("id");

    if (profesorError) {
      throw new InternalServerErrorException(
        `Error al obtener profesores: ${profesorError.message}`
      );
    }

    const idsDisponibles = (todosProfesores ?? [])
      .map((p: any) => p.id)
      .filter((id: number) => !idsOcupados.includes(id));

    if (idsDisponibles.length === 0) {
      return { profesores: [] };
    }

    const { data: usuarios, error: usuarioError } = await this.supabaseService.client
      .from("Usuario")
      .select("id, Persona(id, nombre, apellido, dni)")
      .in("id", idsDisponibles);

    if (usuarioError) {
      throw new InternalServerErrorException(
        `Error al obtener datos de profesores: ${usuarioError.message}`
      );
    }

    const resultado = idsDisponibles.map((id: number) => {
      const usuario = (usuarios ?? []).find((u: any) => u.id === id);
      const persona = (usuario as any)?.Persona;
      return {
        id,
        nombre: persona?.nombre ?? null,
        apellido: persona?.apellido ?? null,
        dni: persona?.dni ?? null,
      };
    });

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
      .from("Profesor")
      .select("id")
      .eq("id", idProfesor)
      .maybeSingle();

    if (profesorError) {
      throw new InternalServerErrorException(
        `Error al buscar el profesor: ${profesorError.message}`
      );
    }

    if (!profesor) {
      throw new NotFoundException("No existe un profesor con ese id");
    }

    const { count, error: countError } = await this.supabaseService.client
      .from("Clase")
      .select("id", { count: "exact", head: true })
      .eq("id_profesor", idProfesor)
      .eq("fecha", clase.fecha)
      .eq("hora", clase.hora)
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
}