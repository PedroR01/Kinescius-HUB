import { Injectable, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { SupabaseService } from "../integrations/supabase.service";

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

  async create({ fecha, hora, tipo, profesorDni }: { fecha: string; hora: string; tipo?: string | null; profesorDni?: string | null }) {
    // Count existing clases at the same fecha and hora
    const countQuery = this.supabaseService.client
      .from("Clase")
      .select("id", { count: "exact", head: true })
      .eq("fecha", fecha)
      .eq("hora", hora);

    const { count, error: countError } = await countQuery;
    if (countError) {
      throw new InternalServerErrorException(`Error al contar clases: ${countError.message}`);
    }

    if ((count ?? 0) >= 10) {
      throw new BadRequestException("Error. Cupo máximo de clases por hora completo");
    }

    const insertPayload: any = {
      fecha,
      hora,
      tipo: tipo ?? null,
      profesor_dni: profesorDni ?? null,
    };

    const { data, error } = await this.supabaseService.client
      .from("Clase")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Error al crear clase: ${error.message}`);
    }

    return { message: "Clase creada correctamente", clase: data };
  }
}
