import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { CambiarTurnoDto } from './dto/cambiar-turno-dto';
import { CancelarTurnoDto, TipoReembolso } from './dto/cancelar-turno-dto';
import { CancelacionNoAbonadoStrategy } from './strategies/cancelacion-no-abonado.strategy';
import { CancelacionAbonadoStrategy } from './strategies/cancelacion-abonado.strategy';
import { EstrategiaCancelacion } from './strategies/estrategia-cancelacion.interface';
import { NotificacionEsperaService } from '../confirmarTurno/notificacion-espera.service';
import { InscripcionConClase, MisClasesResponseDto } from './dto/ver-clases-dto';
import { ReembolsoService, ResultadoReembolso } from '../pagos/reembolso.service';
import {
  construirMensajeReembolso,
  debeEjecutarReembolso,
} from './cancelacion-reembolso.util';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notificacionEspera: NotificacionEsperaService,
    private readonly reembolsoService: ReembolsoService,
  ) { }

  async cancelar(cancelarTurnoDto: CancelarTurnoDto) {
    const { clienteId, claseId, tipoReembolso } = cancelarTurnoDto;

    // 1. Obtener inscripción
    const { data: inscripcion, error: errorInscripcion } = await this.supabase.client
      .from('Se_inscribe')
      .select('*, clase:Clase (fecha, hora)')
      .eq('id_cliente', clienteId)
      .eq('id_clase', claseId)
      .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada')
      .single();

    if (errorInscripcion || !inscripcion) {
      throw new NotFoundException('El cliente no está inscripto en la clase seleccionada.');
    }

    // 2. Obtener rol del cliente desde Persona_
    const { data: persona, error: errorPersona } = await this.supabase.client
      .from('Persona_')
      .select('rol')
      .eq('id', clienteId)
      .single();

    if (errorPersona || !persona) {
      throw new NotFoundException('No se encontró la persona.');
    }

    // Chequear penalización temporal en Estado_Cliente
    const { data: estadoCliente } = await this.supabase.client
      .from('Estado_Cliente')
      .select('penalizado_hasta')
      .eq('id', clienteId)
      .single();

    const penalizacionActiva = estadoCliente?.penalizado_hasta
      && new Date(estadoCliente.penalizado_hasta) > new Date();
    const esAbonado = persona.rol === 3 && !penalizacionActiva;

    // Validación de reembolso solo para no-abonados (los abonados se validan en la strategy)
    if (
      !esAbonado &&
      inscripcion.estado !== 'pagado' &&
      tipoReembolso !== TipoReembolso.NINGUNO
    ) {
      throw new BadRequestException(
        'Solo los turnos pagados admiten reembolso o saldo a favor.',
      );
    }

    const datosTurno = {
      fecha: inscripcion.clase.fecha,
      hora: inscripcion.clase.hora,
    };

    // 3. Seleccionar estrategia
    let estrategia: EstrategiaCancelacion;

    if (esAbonado) {
      const mesClase = inscripcion.clase.fecha.slice(0, 7); // 'YYYY-MM'

      // Contar cancelaciones del abonado en el mes de la clase
      const { count: cancelacionesEnMes } = await this.supabase.client
        .from('Se_inscribe')
        .select('*, Clase!inner(fecha)', { count: 'exact', head: true })
        .eq('id_cliente', clienteId)
        .eq('historial_estado', 'turno cancelado')
        .gte('Clase.fecha', `${mesClase}-01`)
        .lte('Clase.fecha', `${mesClase}-31`);

      // Contar inscripciones activas del abonado en el mes de la clase
      const { count: clasesInscriptasEnMes } = await this.supabase.client
        .from('Se_inscribe')
        .select('*, Clase!inner(fecha)', { count: 'exact', head: true })
        .eq('id_cliente', clienteId)
        .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada')
        .gte('Clase.fecha', `${mesClase}-01`)
        .lte('Clase.fecha', `${mesClase}-31`);

      estrategia = new CancelacionAbonadoStrategy(
        cancelacionesEnMes ?? 0,
        clasesInscriptasEnMes ?? 0,
      );
    } else {
      estrategia = new CancelacionNoAbonadoStrategy();
    }

    const resultado = estrategia.evaluarReglas(datosTurno, cancelarTurnoDto);

    let detalleReembolso: ResultadoReembolso | null = null;

    if (resultado.permitido) {
      // 4. Ejecutar reembolso si corresponde (usar la decisión de la strategy, no del DTO)
      if (debeEjecutarReembolso(resultado.reembolsoAplicado, inscripcion.estado)) {
        detalleReembolso = await this.reembolsoService.ejecutarReembolso(
          inscripcion,
          resultado.reembolsoAplicado,
        );
        await this.reembolsoService.marcarReembolsado(clienteId, claseId);
      }

      // 5. Cancelar inscripción: soft-delete y setear historial_estado para todos
      const { error: errorUpdate } = await this.supabase.client
        .from('Se_inscribe')
        .update({
          historial_estado: 'turno cancelado'
        })
        .eq('id_cliente', clienteId)
        .eq('id_clase', claseId);

      if (errorUpdate) {
        throw new InternalServerErrorException('No se pudo procesar la cancelación en la base de datos.');
      }

      if (esAbonado && resultado.pierdeBeneficioAbonado) {
        // 6. Penalización temporal: pierde descuento por 30 días
        const penalizadoHasta = new Date();
        penalizadoHasta.setDate(penalizadoHasta.getDate() + 30);
        await this.supabase.client
          .from('Estado_Cliente')
          .update({ penalizado_hasta: penalizadoHasta.toISOString() })
          .eq('id', clienteId);
      }

      await this.notificacionEspera.notificarProximoEnEspera(claseId);
    }

    return {
      message: construirMensajeReembolso(
        resultado.mensaje,
        resultado.reembolsoAplicado,
        detalleReembolso,
      ),
      reembolso: resultado.reembolsoAplicado,
      detalleReembolso,
    };
  }

  async obtenerClasesDisponibles() {
    const { data, error } = await this.supabase.client
      .from('Clase')
      .select('*');

    if (error) {
      console.error('Supabase obtenerClasesDisponibles error:', error);
      throw new BadRequestException('No se pudieron cargar las clases disponibles.');
    }

    return (data ?? []).map((clase: any) => ({
      id: clase.id,
      fecha: clase.fecha,
      hora: clase.hora,
      actividad: clase.actividad ?? clase.nombre ?? clase.descripcion ?? clase.tipo ?? 'Clase',
      cuposDisponibles: clase.cupo ?? 0,
    }));
  }

  async procesarCambioTurno(dto: CambiarTurnoDto) {
    const { clienteId, claseActualId, claseNuevaId } = dto;

    const { data: claseActual, error: errorC1 } = await this.supabase.client
      .from('Clase')
      .select('id, fecha, hora, cupo')
      .eq('id', claseActualId)
      .single();

    if (errorC1 || !claseActual) {
      throw new NotFoundException('La clase actual especificada no existe.');
    }

    const { data: inscripcionOriginal, error: errorInsOrig } = await this.supabase.client
      .from('Se_inscribe')
      .select('*')
      .eq('id_cliente', clienteId)
      .eq('id_clase', claseActualId)
      .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada')
      .single();

    if (errorInsOrig || !inscripcionOriginal) {
      throw new BadRequestException('El cliente no está inscripto en la clase actual.');
    }

    const { data: claseNueva, error: errorC2 } = await this.supabase.client
      .from('Clase')
      .select('id, fecha, hora, cupo')
      .eq('id', claseNuevaId)
      .single();

    if (errorC2 || !claseNueva) {
      throw new NotFoundException('La clase nueva especificada no existe.');
    }

    const { count: inscritosClaseNueva, error: errorCount } = await this.supabase.client
      .from('Se_inscribe')
      .select('*', { count: 'exact', head: true })
      .eq('id_clase', claseNuevaId)
      .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada');

    if (errorCount) {
      throw new BadRequestException('No se pudo verificar la disponibilidad de la clase destino.');
    }

    const ahora = new Date();
    const offsetMinutos: number = ahora.getTimezoneOffset();
    const ahoraArgentina = new Date(ahora.getTime() - (offsetMinutos * 60000));
    const horaActualSistema = ahoraArgentina.toTimeString().slice(0, 5);
    const fechaActualSistema = ahoraArgentina.toISOString().slice(0, 10);

    if (
      fechaActualSistema > claseActual.fecha ||
      (fechaActualSistema === claseActual.fecha && horaActualSistema >= claseActual.hora.slice(0, 5))
    ) {
      throw new BadRequestException('No podés cambiarte de una clase que ya empezó o ya terminó.');
    }

    if (
      fechaActualSistema > claseNueva.fecha ||
      (fechaActualSistema === claseNueva.fecha && horaActualSistema >= claseNueva.hora.slice(0, 5))
    ) {
      throw new BadRequestException('No podés cambiarte a una clase que ya empezó o ya terminó.');
    }

    if (claseActual.fecha !== claseNueva.fecha) {
      throw new BadRequestException('El cambio de turno solo se puede realizar entre clases del mismo día.');
    }

    if (inscritosClaseNueva != null && inscritosClaseNueva >= claseNueva.cupo) {
      throw new BadRequestException('La clase destino no tiene cupos disponibles.');
    }

    // Marcar la original como Cambiada (soft-delete)
    const { error: errorUpdateOriginal } = await this.supabase.client
      .from('Se_inscribe')
      .update({ historial_estado: 'Cambiada' })
      .eq('id_cliente', clienteId)
      .eq('id_clase', claseActualId)
      .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada');

    if (errorUpdateOriginal) {
      throw new BadRequestException('No se pudo procesar la reasignación del turno original.');
    }

    // Insertar la nueva inscripción copiando los datos relevantes de pago
    const { error: errorInsertNueva } = await this.supabase.client
      .from('Se_inscribe')
      .insert({
        id_cliente: clienteId,
        id_clase: claseNuevaId,
        estado: inscripcionOriginal.estado,
        id_pago_mp: inscripcionOriginal.id_pago_mp,
        monto_a_favor: inscripcionOriginal.monto_a_favor,
        historial_estado: 'Activa'
      });

    if (errorInsertNueva) {
      throw new BadRequestException('No se pudo procesar la inscripción en la nueva clase.');
    }

    //Al cambiar turno también se libera un cupo en la clase original
    await this.notificacionEspera.notificarProximoEnEspera(claseActualId);

    return {
      status: 'success',
      message: 'Turno cambiado exitosamente.'
    };
  }

  async obtenerClasesPorCliente(idCliente: number): Promise<MisClasesResponseDto[]> {
    const { data, error } = await this.supabase.client
      .from('Se_inscribe')
      .select(`
        id_cliente,
        id_clase,
        monto_a_favor,
        estado,
        Clase!inner (
          id,
          fecha,
          hora,
          tipo,
          cupo,
          id_profesor
        )
      `)
      .eq('Clase.estado', 0)
      .eq('id_cliente', idCliente)
      .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada')
      .gte('Clase.fecha', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }));

    if (error) {
      throw new InternalServerErrorException('Error al recuperar las clases: ' + error.message);
    }


    const inscripciones = (data ?? []) as unknown as InscripcionConClase[];

    // --- LÓGICA PARA CALCULAR fuera_de_cuota ---
    let esAbonado = false;
    let countsPorMes: Record<string, number> = {};

    const { data: persona } = await this.supabase.client
      .from('Persona_')
      .select('rol')
      .eq('id', idCliente)
      .single();

    // Chequear penalización temporal en Estado_Cliente
    const { data: estadoClienteLista } = await this.supabase.client
      .from('Estado_Cliente')
      .select('penalizado_hasta')
      .eq('id', idCliente)
      .single();

    const penalizacionActivaLista = estadoClienteLista?.penalizado_hasta
      && new Date(estadoClienteLista.penalizado_hasta) > new Date();

    if (persona && persona.rol === 3 && !penalizacionActivaLista) {
      esAbonado = true;
      const primerDiaMesActual = new Date();
      primerDiaMesActual.setDate(1);
      const fechaInicio = primerDiaMesActual.toISOString().split('T')[0];

      const { data: todasInscripciones } = await this.supabase.client
        .from('Se_inscribe')
        .select('id_clase, Clase!inner(fecha)')
        .eq('id_cliente', idCliente)
        .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada')
        .gte('Clase.fecha', fechaInicio);

      if (todasInscripciones) {
        todasInscripciones.forEach((ins: any) => {
          const mes = ins.Clase.fecha.slice(0, 7);
          countsPorMes[mes] = (countsPorMes[mes] || 0) + 1;
        });
      }
    }
    // -------------------------------------------

    const profesorIds = [...new Set(
      inscripciones
        .map((item) => item.Clase?.id_profesor)
        .filter((id): id is number => typeof id === 'number'),
    )];
    const profesorNombres = new Map<number, string>();
    if (profesorIds.length > 0) {
      const { data: personas, error: profesorError } = await this.supabase.client
        .from('Persona_')
        .select('id, nombre, apellido')
        .in('id', profesorIds);
      if (profesorError) {
        throw new InternalServerErrorException(
          'Error al obtener profesores: ' + profesorError.message,
        );
      }
      (personas ?? []).forEach((persona: {
        id: number;
        nombre?: string | null;
        apellido?: string | null;
      }) => {
        const nombreCompleto = [persona.nombre, persona.apellido]
          .filter(Boolean)
          .join(' ');
        profesorNombres.set(persona.id, nombreCompleto || 'Sin profesor');
      });
    }
    return inscripciones.map((item) => {
      let fueraDeCuota = false;
      if (esAbonado) {
        const mes = item.Clase.fecha.slice(0, 7);
        fueraDeCuota = (countsPorMes[mes] || 0) > 3;
      }

      return {
        id_clase: item.id_clase,
        id_cliente: item.id_cliente,
        monto_a_favor: item.monto_a_favor,
        estado: item.estado,
        fuera_de_cuota: fueraDeCuota,
        Clase: {
          id: item.Clase.id,
          fecha: item.Clase.fecha,
          hora: item.Clase.hora,
          tipo: item.Clase.tipo,
          cupo: item.Clase.cupo,
          profesor: item.Clase.id_profesor
            ? profesorNombres.get(item.Clase.id_profesor) ?? 'Sin profesor'
            : 'Sin profesor',
        },
      };
    });
  }

  async obtenerHistorialPorCliente(idCliente: number) {
    const { data, error } = await this.supabase.client
      .from('Se_inscribe')
      .select(`
        id_cliente,
        id_clase,
        historial_estado,
        Clase!inner (
          id,
          fecha,
          hora,
          tipo,
          cupo,
          id_profesor,
          estado
        )
      `)
      .eq('id_cliente', idCliente);

    if (error) {
      throw new InternalServerErrorException('Error al recuperar el historial: ' + error.message);
    }

    // Filtrar localmente para traer clases pasadas (estado 1 o 2) O clases canceladas/cambiadas por el cliente
    const dataFiltrada = (data || []).filter((item: any) => {
      return (
        item.Clase.estado === 1 ||
        item.Clase.estado === 2 ||
        item.historial_estado === 'turno cancelado' ||
        item.historial_estado === 'Cambiada'
      );
    });

    const profesorIds = [...new Set(
      dataFiltrada
        .map((item: any) => item.Clase?.id_profesor)
        .filter((id): id is number => typeof id === 'number'),
    )];
    const profesorNombres = new Map<number, string>();
    if (profesorIds.length > 0) {
      const { data: personas, error: profesorError } = await this.supabase.client
        .from('Persona_')
        .select('id, nombre, apellido')
        .in('id', profesorIds);
      if (profesorError) {
        throw new InternalServerErrorException(
          'Error al obtener profesores: ' + profesorError.message,
        );
      }
      (personas ?? []).forEach((persona: any) => {
        const nombreCompleto = [persona.nombre, persona.apellido]
          .filter(Boolean)
          .join(' ');
        profesorNombres.set(persona.id, nombreCompleto || 'Sin profesor');
      });
    }

    //Map del estado
    const historialMapeado = dataFiltrada.map((item: any) => {
      let estadoMostrar: string;

      if (item.historial_estado === 'turno cancelado') {
        estadoMostrar = 'Cancelada por cliente';
      } else if (item.historial_estado === 'Cambiada') {
        estadoMostrar = 'Cambiada';
      } else if (item.Clase.estado === 1) {
        estadoMostrar = 'Completada';
      } else if (item.Clase.estado === 2) {
        estadoMostrar = 'Cancelada por admin';
      } else {
        estadoMostrar = item.historial_estado || 'Activa';
      }

      return {
        id_clase: item.id_clase,
        id_cliente: item.id_cliente,
        estado_historial: estadoMostrar,
        Clase: {
          id: item.Clase.id,
          fecha: item.Clase.fecha,
          hora: item.Clase.hora,
          tipo: item.Clase.tipo,
          profesor: item.Clase.id_profesor
            ? profesorNombres.get(item.Clase.id_profesor) ?? 'Sin profesor'
            : 'Sin profesor',
        },
      };
    });

    return historialMapeado
      .sort((a, b) => {
        const dateA = new Date(`${a.Clase.fecha}T${a.Clase.hora}`);
        const dateB = new Date(`${b.Clase.fecha}T${b.Clase.hora}`);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
  }

}