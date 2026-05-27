import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import { SupabaseService } from "../integrations/supabase.service";

@Injectable()
export class ListaEsperaService {
  constructor(
    private readonly supabaseService: SupabaseService
  ) {}

  async findAll() {
    const { data, error } =
      await this.supabaseService.client
        .from("Lista de espera")
        .select("*");

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener lista: ${error.message}`
      );
    }

    return data;
  }

  // ✅ Tu countByClase original, sin cambios
  async countByClase(claseId: number) {
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

  // ✅ findByClase actualizado para devolver datos de persona
  async findByClase(claseId: number) {
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
}