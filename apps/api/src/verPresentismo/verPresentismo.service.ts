import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase/supabase.service';

export type EstadoPresentismo = 'presente' | 'ausente';

const ESTADOS_CANCELADOS = ['cancelada', 'turno cancelado'];

@Injectable()
export class PresentismoService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByClase(claseId: number) {
    // 1. Inscriptos a la clase (se excluyen solo los cancelados; se incluyen
    // 'Activa', 'Completada', etc.)
    const { data: inscripciones, error: inscripcionesError } =
      await this.supabaseService.client
        .from('Se_inscribe')
        .select('id_cliente, historial_estado')
        .eq('id_clase', claseId);

    if (inscripcionesError) {
      throw new InternalServerErrorException(
        `Error al obtener inscriptos: ${inscripcionesError.message}`,
      );
    }

    if (!inscripciones || inscripciones.length === 0) return [];

    const inscriptosActivos = inscripciones.filter((i: any) => {
      const estado = (i.historial_estado ?? 'Activa').toLowerCase();
      return !ESTADOS_CANCELADOS.includes(estado);
    });

    if (inscriptosActivos.length === 0) return [];

    const clienteIds = inscriptosActivos.map((i: any) => i.id_cliente);

    // 2. Quiénes asistieron efectivamente (tienen fila en Asistencia_Clase)
    const { data: asistencias, error: asistenciasError } =
      await this.supabaseService.client
        .from('Asistencia_Clase')
        .select('id_cliente')
        .eq('id_clase', claseId);

    if (asistenciasError) {
      throw new InternalServerErrorException(
        `Error al obtener asistencia: ${asistenciasError.message}`,
      );
    }

    const presentes = new Set(
      (asistencias ?? []).map((a: any) => a.id_cliente),
    );

    // 3. Datos de las personas
    const { data: personas, error: personasError } =
      await this.supabaseService.client
        .from('Persona_')
        .select('id, nombre, apellido, dni')
        .in('id', clienteIds);

    if (personasError) {
      throw new InternalServerErrorException(
        `Error al obtener alumnos: ${personasError.message}`,
      );
    }

    const personaPorId = new Map((personas ?? []).map((p: any) => [p.id, p]));

    return clienteIds
      .map((id) => {
        const persona = personaPorId.get(id);
        if (!persona) return null;

        return {
          nombre: persona.nombre,
          apellido: persona.apellido,
          dni: persona.dni,
          estado: (presentes.has(id) ? 'presente' : 'ausente') as EstadoPresentismo,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.apellido.localeCompare(b.apellido));
  }
}