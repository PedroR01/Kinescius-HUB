import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { SupabaseService } from "../integrations/supabase/supabase.service";
import { CreateTurnoDto } from "./dto/create-turno.dto";
import { InscribirConSaldoDto } from "./dto/inscribir-con-saldo.dto";
import { CLASS_UNIT_PRICE } from "../pagos/class-price.constant";
import { inscripcionSoloSaldo } from "../pagos/inscripcion-desglose.util";

// ID de la tabla "estado_clase" que corresponde a "Cancelada".
// Debe coincidir con ESTADO_CLASE_CANCELADA de clases-admin.service.ts
const ESTADO_CLASE_CANCELADA = 2;

@Injectable()
export class ClasesService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async findAll() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const { data, error } = await this.supabaseService.client
      .from("Clase")
      .select(
        "*, Se_inscribe(count), Profesor:Persona_!Clase_id_profesor_fkey(nombre, apellido)"
      )
      .gte("fecha", todayStr)
      // FIX: antes no se filtraba por "estado", entonces clases canceladas
      // (estado = 2) seguían apareciendo como disponibles para solicitar turno.
      // Se excluyen acá, igual que en clasesAdmin/clases.service.Admin.ts.
      .neq("estado", ESTADO_CLASE_CANCELADA)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener clases: ${error.message}`
      );
    }

    return data.map((clase) => {
      const inscriptos = Number(clase.Se_inscribe?.[0]?.count ?? 0);
      const persona = clase.Profesor as any;
      return {
        ...clase,
        cupo: (clase.cupo ?? 0) - inscriptos,
        profesor: persona ? `${persona.nombre} ${persona.apellido}` : null,
        Se_inscribe: undefined,
        Profesor: undefined,
      };
    });
  }

  async getMontoAFavor(clienteId: number) {
    const { data, error } = await this.supabaseService.client
      .from("Estado_Cliente")
      .select("monto_favor")
      .eq("id", clienteId)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        `Error al obtener monto a favor: ${error?.message}`
      );
    }

    return { monto_a_favor: data.monto_favor };
  }

  private async verificarConflictoHorario(clienteId: number, claseId: number): Promise<void> {
    const { data: claseNueva, error: claseError } = await this.supabaseService.client
      .from("Clase")
      .select("fecha, hora")
      .eq("id", claseId)
      .single();

    if (claseError || !claseNueva) {
      throw new BadRequestException(`La clase ${claseId} no existe.`);
    }

    const { data: inscripciones, error: inscError } = await this.supabaseService.client
      .from("Se_inscribe")
      .select("id_clase, Clase(fecha, hora)")
      .eq("id_cliente", clienteId);

    if (inscError) {
      throw new InternalServerErrorException("Error al verificar conflicto de horario.");
    }

    const conflicto = (inscripciones ?? []).some((insc: any) => {
      const c = insc.Clase;
      return c?.fecha === claseNueva.fecha && c?.hora === claseNueva.hora;
    });

    if (conflicto) {
      throw new ConflictException("Ya tenés una clase en ese horario.");
    }
  }

  async createTurno(claseId: number, dto: CreateTurnoDto) {
    // FIX: antes se permitía crear un turno para cualquier clase existente,
    // sin chequear si esa clase estaba cancelada. Ahora se valida el estado
    // de la clase antes de aceptar la inscripción, por si el request llega
    // directo al endpoint (sin pasar por el listado ya filtrado del frontend).
    const { data: claseData, error: claseError } = await this.supabaseService.client
      .from("Clase")
      .select("id, estado")
      .eq("id", claseId)
      .maybeSingle();

    if (claseError) {
      throw new InternalServerErrorException(
        `Error al verificar la clase: ${claseError.message}`
      );
    }

    if (!claseData) {
      throw new BadRequestException(`La clase ${claseId} no existe.`);
    }

    if (claseData.estado === ESTADO_CLASE_CANCELADA) {
      throw new BadRequestException("No se puede reservar turno: la clase está cancelada.");
    }

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

    await this.verificarConflictoHorario(dto.clienteId, claseId);

    const payload = {
      id_cliente: dto.clienteId,
      id_clase: claseId,
      estado: dto.estado ?? "pendiente",
    };

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
      .from("Estado_Cliente")
      .select("monto_favor")
      .eq("id", clienteId)
      .single();

    if (clienteError || !cliente) {
      throw new InternalServerErrorException(
        `Error al obtener saldo del cliente: ${clienteError?.message}`
      );
    }

    const saldoActual = Number(cliente.monto_favor) || 0;
    if (saldoActual < montoAFavorAplicado) {
      throw new BadRequestException("Saldo a favor insuficiente.");
    }

    for (const clase of clases) {
      const { data: claseData, error: claseError } = await this.supabaseService.client
        .from("Clase")
        .select("id, cupo, estado")
        .eq("id", clase.id)
        .single();

      if (claseError || !claseData) {
        throw new BadRequestException(`La clase ${clase.id} no existe.`);
      }

      // FIX: mismo chequeo que en createTurno, para que tampoco se pueda
      // inscribir con saldo a favor en una clase cancelada.
      if (claseData.estado === ESTADO_CLASE_CANCELADA) {
        throw new BadRequestException(`La clase ${clase.id} está cancelada.`);
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

      await this.verificarConflictoHorario(clienteId, clase.id);
    }

    const datosPago = inscripcionSoloSaldo();
    const inscripciones = clases.map((clase) => ({
      id_cliente: clienteId,
      id_clase: clase.id,
      estado: "pagado",
      id_pago_mp: datosPago.id_pago_mp,
      monto_a_favor: datosPago.monto_a_favor,
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
      .from("Estado_Cliente")
      .update({ monto_favor: saldoRestante })
      .eq("id", clienteId);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error al descontar monto a favor: ${updateError.message}`
      );
    }

    return { inscripciones: inserted, saldoRestante };
  }
}