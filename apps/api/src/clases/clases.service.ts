import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { SupabaseService } from "../integrations/supabase.service";
import { CreateTurnoDto } from "./dto/create-turno.dto";

@Injectable()
export class ClasesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from("Clase")
      .select("*")
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener clases: ${error.message}`
      );
    }

    return data;
  }

  async createTurno(claseId: number, dto: CreateTurnoDto) {
    const payload = {
      id_cliente: dto.clienteId,
      id_clase: claseId,
      estado: dto.estado ?? 'pendiente',
    };

    const { data, error } = await this.supabaseService.client
      .from("Se_inscribe")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error al crear inscripcion: ${error.message}`
      );
    }

    return data;
  }
}
