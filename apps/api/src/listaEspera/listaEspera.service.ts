import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";

import { SupabaseService } from "../integrations/supabase/supabase.service";

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

  async findByClase(claseId: number) {
    const { data, error } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("id_cliente, fecha")
        .eq("id_clase", claseId);

    if (error) {
      throw new InternalServerErrorException(
        `Error lista: ${error.message}`
      );
    }

    if (!data || data.length === 0) return [];

    const clienteIds = data.map(d => d.id_cliente).filter(Boolean);

    const { data: personas, error: personasError } =
      await this.supabaseService.client
        .from("Persona")
        .select("id, nombre, apellido, dni, mail")
        .in("id", clienteIds);

    if (personasError) {
      throw new InternalServerErrorException(
        `Error personas: ${personasError.message}`
      );
    }

    return personas.map(p => ({
      nombre: p.nombre,
      apellido: p.apellido,
      dni: p.dni,
      email: p.mail,
    }));
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