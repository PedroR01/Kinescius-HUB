import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";

import { SupabaseService } from "../integrations/supabase.service";

@Injectable()
export class ClasesService {

  constructor(
    private readonly supabaseService: SupabaseService
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

    return data;
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
    // Usar cupo proporcionado o valor por defecto
    const claseCupo = cupo ?? 10;

    // Validar cupo máximo
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

    if ((count ?? 0) >= claseCupo) {
      throw new BadRequestException(
        `Error. Cupo máximo de clases por hora (${claseCupo}) completo`
      );
    }

    let profesorId = null;

    // Buscar profesor usando DNI
    if (profesorDni) {

      // Buscar persona por DNI
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

      // Verificar que sea profesor
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
    }

    // Crear clase
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

}