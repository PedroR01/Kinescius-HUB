import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";

import { SupabaseService } from "../integrations/supabase/supabase.service";

// Rol de cliente abonado (confirmado en Supabase: 3 = cliente abonado)
const ROL_CLIENTE_ABONADO_ID = 3;

@Injectable()
export class ListaEsperaService {
  constructor(
    private readonly supabaseService: SupabaseService
  ) {}

  async findAll() {
    const hoy = new Date().toISOString().split("T")[0];

    const { data: clasesHoy, error: claseError } =
      await this.supabaseService.client
        .from("Clase")
        .select("id")
        .gte("fecha", hoy);

    if (claseError) {
      throw new InternalServerErrorException(
        `Error clases: ${claseError.message}`
      );
    }

    const claseIds = clasesHoy?.map(c => c.id) ?? [];
    if (claseIds.length === 0) return [];

    const { data, error } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("*")
        .in("id_clase", claseIds);

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener lista: ${error.message}`
      );
    }

    return data;
  }

  async countByClase(claseId: number) {
    const { count, error } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("*", { count: "exact", head: true })
        .eq("id_clase", claseId);

    if (error) {
      throw new InternalServerErrorException(
        `Error count: ${error.message}`
      );
    }

    return count ?? 0;
  }

  /**
   * Devuelve la lista de espera de una clase, ordenada con los
   * clientes abonados primero (prioridad de reserva) y, dentro de
   * cada grupo, por orden de llegada (fecha de inscripción a la
   * lista de espera, y luego por id como criterio de desempate).
   */
  async findByClase(claseId: number) {
    // traigo también el id para poder desempatar por orden de inserción
    const { data, error } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("id, id_cliente, fecha")
        .eq("id_clase", claseId);

    if (error) {
      throw new InternalServerErrorException(
        `Error lista: ${error.message}`
      );
    }

    if (!data || data.length === 0) return [];

    const clienteIds = data.map(d => d.id_cliente).filter(Boolean);

    // fix: la tabla es "Persona_", no "Persona"
    const { data: personas, error: personasError } =
      await this.supabaseService.client
        .from("Persona_")
        .select("id, nombre, apellido, dni, mail, rol")
        .in("id", clienteIds);

    if (personasError) {
      throw new InternalServerErrorException(
        `Error personas: ${personasError.message}`
      );
    }

    // armo mapa de persona por id para poder cruzar con la fecha/orden
    // de la fila de "Lista de espera"
    const personaPorId = new Map(
      (personas ?? []).map((p: any) => [p.id, p]),
    );

    const listaCompleta = data
      .map((fila: any) => {
        const persona = personaPorId.get(fila.id_cliente);
        if (!persona) return null;

        return {
          idListaEspera: fila.id,
          fecha: fila.fecha,
          nombre: persona.nombre,
          apellido: persona.apellido,
          dni: persona.dni,
          mail: persona.mail,
          esAbonado: persona.rol === ROL_CLIENTE_ABONADO_ID,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // ordeno: abonados primero, después por fecha de inscripción,
    // y como desempate final por id (orden de llegada real)
    return listaCompleta.sort((a, b) => {
      if (a.esAbonado !== b.esAbonado) {
        return a.esAbonado ? -1 : 1;
      }
      if (a.fecha !== b.fecha) {
        return a.fecha.localeCompare(b.fecha);
      }
      return a.idListaEspera - b.idListaEspera;
    });
  }

  async joinListaEspera(claseId: number, clienteId: number) {
    const { data: existing } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("id")
        .eq("id_clase", claseId)
        .eq("id_cliente", clienteId)
        .maybeSingle();

    if (existing) {
      throw new ConflictException("Ya estás en la lista de espera.");
    }

    const hoy = new Date().toISOString().split("T")[0];

    const { error: insertError } =
      await this.supabaseService.client
        .from("Lista de espera")
        .insert({
          id_clase: claseId,
          id_cliente: clienteId,
          fecha: hoy,
        });

    if (insertError) {
      console.error("Error al insertar en lista de espera:", insertError);
      throw new InternalServerErrorException(
        `Error al unirse a lista de espera: ${insertError.message}`
      );
    }

    return { message: "Fuiste agregado a la lista de espera." };
  }
}