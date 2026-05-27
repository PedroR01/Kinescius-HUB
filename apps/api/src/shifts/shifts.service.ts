import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase.service';
import { CambiarTurnoDto } from './dto/cambiar-turno-dto';
import { CancelarTurnoDto } from './dto/cancelar-turno-dto';
import { CancelacionNoAbonadoStrategy } from './strategies/cancelacion-no-abonado.strategy';

@Injectable()
export class ShiftsService {
  constructor(private readonly supabase: SupabaseService) {}

  async cancelar(cancelarTurnoDto: CancelarTurnoDto) {
    const { clienteId, claseId } = cancelarTurnoDto;
  
    const { data: inscripcion, error: errorInscripcion } = await this.supabase.client
      .from('Se_inscribe')
      .select('*, clase:Clase (fecha, hora)') 
      .eq('id_cliente', clienteId)
      .eq('id_clase', claseId)
      .single();

  
    if (errorInscripcion || !inscripcion) {
      throw new NotFoundException('El cliente no está inscripto en la clase seleccionada.');
    }
      const datosTurno = {
      fecha: inscripcion.clase.fecha,
      hora: inscripcion.clase.hora,
    };
  
    const estrategia = new CancelacionNoAbonadoStrategy();
    const resultado = estrategia.evaluarReglas(datosTurno, cancelarTurnoDto);
  
    if (resultado.permitido) {

      const { error: errorDelete } = await this.supabase.client
        .from('Se_inscribe')
        .delete()
        .eq('id_cliente', clienteId)
        .eq('id_clase', claseId);
  
      if (errorDelete) {
        throw new InternalServerErrorException('No se pudo procesar la cancelación en la base de datos.');
      }
    }  
    return {
      message: resultado.mensaje,
      reembolso: resultado.reembolsoAplicado,
    };
  }
//-------------------------------------------------------------------------//
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

    // 1. Obtener datos básicos de la clase actual (c1)
    const { data: claseActual, error: errorC1 } = await this.supabase.client
      .from('Clase')
      .select('id, fecha, hora, cupo')
      .eq('id', claseActualId)
      .single();

    if (errorC1 || !claseActual) {
      throw new NotFoundException('La clase actual especificada no existe.');
    }

    // 2. Obtener datos básicos de la clase nueva (c2)
    const { data: claseNueva, error: errorC2 } = await this.supabase.client
      .from('Clase')
      .select('id, fecha, hora, cupo')
      .eq('id', claseNuevaId)
      .single();

    if (errorC2 || !claseNueva) {
      throw new NotFoundException('La clase nueva especificada no existe.');
    }

    // Cuántos clientes anotados tiene la clase destino
    const { count: inscritosClaseNueva, error: errorCount } = await this.supabase.client
      .from('Se_inscribe')
      .select('*', { count: 'exact', head: true })
      .eq('id_clase', claseNuevaId);

    if (errorCount) {
      throw new BadRequestException('No se pudo verificar la disponibilidad de la clase de destino.');
    }
    

    // Regla 1: Restricciones de horario
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
      throw new BadRequestException('No podés cambiarte a una clase que ya comenzó o ya terminó.');
    }


    //Regla 2: Clases de distintos días.
    if (claseActual.fecha !== claseNueva.fecha) {
      throw new BadRequestException('El cambio de turno solo se puede realizar entre clases del mismo día.');
    }


    // Regla 3: c2.cupoActual < c2.cupoMaximo (Usando el COUNT dinámico)
    if (inscritosClaseNueva != null && inscritosClaseNueva >= claseNueva.cupo) {
      throw new BadRequestException('La clase de destino no tiene cupos disponibles.');
    }

    const { error: errorInscripcion } = await this.supabase.client
      .from('Se_inscribe')
      .update({ id_clase: claseNuevaId })
      .eq('id_cliente', clienteId)
      .eq('id_clase', claseActualId);

    if (errorInscripcion) {
      throw new BadRequestException('No se pudo procesar la reasignación del turno.');
    }

    return { 
      status: 'success', 
      message: 'Turno cambiado exitosamente.' 
    };
  }
}