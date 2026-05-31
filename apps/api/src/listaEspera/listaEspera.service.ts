import {
  Injectable,
  InternalServerErrorException,
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
    const hoy = new Date().toISOString().split("T")[0];

    const { data: clase, error: claseError } =
      await this.supabaseService.client
        .from("Clase")
        .select("id")
        .eq("id", claseId)
        .gte("fecha", hoy)
        .single();

    if (claseError || !clase) return 0;

    const { count, error } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("id_clase", claseId);

    if (error) {
      throw new InternalServerErrorException(
        `Error count: ${error.message}`
      );
    }

    return count ?? 0;
  }

  async findByClase(claseId: number) {
    const hoy = new Date().toISOString().split("T")[0];

    const { data: clase, error: claseError } =
      await this.supabaseService.client
        .from("Clase")
        .select("id")
        .eq("id", claseId)
        .gte("fecha", hoy)
        .single();

    if (claseError || !clase) return [];

    const { data: listas, error: listaError } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("id")
        .eq("id_clase", claseId);

    if (listaError) {
      throw new InternalServerErrorException(
        `Error lista: ${listaError.message}`
      );
    }

    if (!listas || listas.length === 0) return [];

    const listaEsperaId = listas[0].id;

    const { data: clientesEnEspera, error: clientesError } =
      await this.supabaseService.client
        .from("No abonado")
        .select("id_cliente")
        .eq("id_listaEspera", listaEsperaId);

    if (clientesError) {
      throw new InternalServerErrorException(
        `Error clientes: ${clientesError.message}`
      );
    }

    if (!clientesEnEspera || clientesEnEspera.length === 0) return [];

    const clienteIds = clientesEnEspera.map(c => c.id_cliente);

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
    // 1. Buscar o crear la lista de espera para esa clase
    let { data: lista, error: listaError } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("id")
        .eq("id_clase", claseId)
        .single();

    if (listaError || !lista) {
      // No existe, la creamos
      const { data: nuevaLista, error: createError } =
        await this.supabaseService.client
          .from("Lista de espera")
          .insert({ id_clase: claseId })
          .select("id")
          .single();

      if (createError || !nuevaLista) {
        throw new InternalServerErrorException(
          `Error al crear lista de espera: ${createError?.message}`
        );
      }

      lista = nuevaLista;
    }

    // 2. Verificar si el cliente ya está en la lista
    const { data: existing } =
      await this.supabaseService.client
        .from("No abonado")
        .select("id")
        .eq("id_listaEspera", lista.id)
        .eq("id_cliente", clienteId)
        .single();

    if (existing) {
      return { message: "Ya estás en la lista de espera." };
    }

    // 3. Insertar en No abonado
    const { error: insertError } =
      await this.supabaseService.client
        .from("No abonado")
        .insert({
          id_listaEspera: lista.id,
          id_cliente: clienteId,
        });

    if (insertError) {
      throw new InternalServerErrorException(
        `Error al unirse a lista de espera: ${insertError.message}`
      );
    }

    return { message: "Fuiste agregado a la lista de espera." };
  }
}