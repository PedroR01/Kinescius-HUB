import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { SupabaseService } from "../integrations/supabase/supabase.service";
import { CreateTurnoDto } from "./dto/create-turno.dto";
import { InscribirConSaldoDto } from "./dto/inscribir-con-saldo.dto";
import { CLASS_UNIT_PRICE } from "../pagos/pagos.service";

@Injectable()
export class ClasesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const { data, error } = await this.supabaseService.client
      .from("Clase")
      .select("*")
      .gte("fecha", todayStr)
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

  async inscribirConSaldo(dto: InscribirConSaldoDto) {
    const { clienteId, clases, montoAFavorAplicado } = dto;

    if (!clases.length) {
      throw new BadRequestException("Debe incluir al menos una clase.");
    }

    const subtotal = clases.length * CLASS_UNIT_PRICE;
    if (montoAFavorAplicado < subtotal) {
      throw new BadRequestException(
        "El monto a favor debe cubrir el total para inscribir sin Mercado Pago."
      );
    }

    const { data: cliente, error: clienteError } = await this.supabaseService.client
      .from("Cliente")
      .select("monto_a_favor")
      .eq("id", clienteId)
      .single();

    if (clienteError || !cliente) {
      throw new InternalServerErrorException(
        `Error al obtener saldo del cliente: ${clienteError?.message}`
      );
    }

    const saldoActual = Number(cliente.monto_a_favor) || 0;
    if (saldoActual < montoAFavorAplicado) {
      throw new BadRequestException("Saldo a favor insuficiente.");
    }

    for (const clase of clases) {
      const { data: claseData, error: claseError } = await this.supabaseService.client
        .from("Clase")
        .select("id, cupo")
        .eq("id", clase.id)
        .single();

      if (claseError || !claseData) {
        throw new BadRequestException(`La clase ${clase.id} no existe.`);
      }

      const { count: inscriptos, error: countError } = await this.supabaseService.client
        .from("Se_inscribe")
        .select("*", { count: "exact", head: true })
        .eq("id_clase", clase.id);

      if (countError) {
        throw new InternalServerErrorException("No se pudo verificar cupos.");
      }

      if ((inscriptos ?? 0) >= (claseData.cupo ?? 0)) {
        throw new BadRequestException(`La clase ${clase.id} no tiene cupos disponibles.`);
      }

      const { data: existing, error: selectError } = await this.supabaseService.client
        .from("Se_inscribe")
        .select("id_cliente,id_clase")
        .eq("id_cliente", clienteId)
        .eq("id_clase", clase.id)
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
        throw new ConflictException(`Ya estás inscripto en la clase ${clase.id}.`);
      }
    }

    const inscripciones = clases.map((clase) => ({
      id_cliente: clienteId,
      id_clase: clase.id,
      estado: "pagado",
    }));

    const { data: inserted, error: insertError } = await this.supabaseService.client
      .from("Se_inscribe")
      .insert(inscripciones)
      .select();

    if (insertError) {
      if (
        insertError.message?.includes("duplicate key value") ||
        insertError.code === "23505"
      ) {
        throw new ConflictException("Ya estás inscripto en una de las clases seleccionadas.");
      }
      throw new InternalServerErrorException(
        `Error al crear inscripciones: ${insertError.message}`
      );
    }

    const saldoRestante = saldoActual - montoAFavorAplicado;
    const { error: updateError } = await this.supabaseService.client
      .from("Cliente")
      .update({ monto_a_favor: saldoRestante })
      .eq("id", clienteId);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error al descontar monto a favor: ${updateError.message}`
      );
    }

    return { inscripciones: inserted, saldoRestante };
  }
}