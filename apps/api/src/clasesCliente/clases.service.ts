import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";
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

  async getMontoAFavor(clienteId: number) {
    const { data, error } = await this.supabaseService.client
      .from("Cliente")
      .select("monto_a_favor")
      .eq("id", clienteId)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        `Error al obtener monto a favor: ${error?.message}`
      );
    }

    return data;
  }

  async createTurno(claseId: number, dto: CreateTurnoDto) {
    const payload = {
      id_cliente: dto.clienteId,
      id_clase: claseId,
      estado: dto.estado ?? "pendiente",
    };

    const { data: existing, error: selectError } = await this.supabaseService.client
      .from("Se_inscribe")
      .select("id_cliente,id_clase")
      .eq("id_cliente", dto.clienteId)
      .eq("id_clase", claseId)
      .limit(1);

    if (selectError) {
      throw new InternalServerErrorException(
        `Error al verificar inscripción existente: ${selectError.message}`
      );
    }

    const alreadyInscribed = Array.isArray(existing)
      ? existing.length > 0
      : Boolean(existing);

    if (alreadyInscribed) {
      throw new ConflictException("Ya estás inscripto en esta clase.");
    }

    const { data, error } = await this.supabaseService.client
      .from("Se_inscribe")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (
        error.message?.includes("duplicate key value") ||
        error.code === "23505"
      ) {
        throw new ConflictException("Ya estás inscripto en esta clase.");
      }

      throw new InternalServerErrorException(
        `Error al crear inscripcion: ${error.message}`
      );
    }

    return data;
  }
}