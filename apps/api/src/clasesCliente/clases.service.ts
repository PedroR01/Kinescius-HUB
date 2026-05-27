import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
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
}