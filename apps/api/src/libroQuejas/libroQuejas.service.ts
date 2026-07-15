// Importo excepciones de NestJS para manejar errores de forma controlada
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// Servicio de Supabase para conectarme a la base de datos
import { SupabaseService } from '../integrations/supabase/supabase.service';

// DTO del request (comentario + calificación)
import { CreateQuejaDto } from './dto/crear-queja.dto';

// DTO de salida del historial
import { HistorialClaseDto } from './dto/historial-clase.dto';

// Estados de Se_inscribe que significan que la inscripción NO cuenta como asistida
const ESTADOS_NO_VALIDOS = [
  'Cancelada por cliente',
  'Cancelada por admin',
  'Cambiada',
];

// Marco la clase como Injectable para poder inyectarla en NestJS
@Injectable()
export class LibroQuejasService {
  constructor(
    // Inyecto Supabase para poder hacer consultas a la base de datos
    private readonly supabaseService: SupabaseService,
  ) {}

  // Getter para simplificar el acceso al cliente de Supabase
  private get db() {
    return this.supabaseService.client;
  }

  /**
   * AC1: registrar comentario de una clase
   * Reglas:
   * - el cliente debe haber estado inscripto en la clase
   * - la clase debe haber finalizado
   * - no puede comentar dos veces la misma clase
   */
  async registrarComentario(
    idCliente: number,
    idClase: number,
    dto: CreateQuejaDto,
  ) {
    // Valido que el cliente haya estado inscripto y la clase ya haya pasado
    await this.verificarClaseAsistidaYPasada(idCliente, idClase);

    // Valido que no exista un comentario previo
    await this.verificarNoExisteComentarioPrevio(idCliente, idClase);

    // Inserto el comentario en la tabla LibroDeQuejas
    const { data, error } = await this.db
      .from('LibroDeQuejas')
      .insert({
        id_cliente: idCliente,
        id_clase: idClase,
        comentario: dto.comentario,
        calificacion: dto.calificacion,
      })
      .select('id')
      .single();

    // Si falla la inserción en la base de datos, lanzo error controlado
    if (error) {
      throw new BadRequestException('No se pudo registrar el comentario');
    }

    // Devuelvo confirmación con el id del comentario creado
    return {
      id: data.id,
      mensaje: 'Gracias por su comentario',
    };
  }

  /**
   * Historial de clases pasadas del cliente
   * Incluye profesor, tipo de clase y calificación/comentario
   */
  async obtenerHistorial(
    idCliente: number,
  ): Promise<HistorialClaseDto[]> {
    // Fecha y hora actual para filtrar solo clases pasadas
    const ahoraFecha = new Date().toISOString().slice(0, 10);
    const ahoraHora = new Date().toISOString().slice(11, 19);

    // Traigo clases donde el cliente estuvo inscripto y no canceló/cambió
    const { data, error } = await this.db
      .from('Se_inscribe')
      .select(
        `
        id_clase,
        historial_estado,
        Clase!inner (
          id,
          fecha,
          hora,
          tipo,
          Persona_!Clase_id_profesor_fkey ( nombre, apellido )
        )
      `,
      )
      .eq('id_cliente', idCliente)
      // excluyo inscripciones canceladas o cambiadas
      .not(
        'historial_estado',
        'in',
        `(${ESTADOS_NO_VALIDOS.map((e) => `"${e}"`).join(',')})`,
      )
      // filtro solo clases que ya finalizaron
      .or(
        `fecha.lt.${ahoraFecha},and(fecha.eq.${ahoraFecha},hora.lt.${ahoraHora})`,
        { foreignTable: 'Clase' },
      );

    if (error) {
      throw new BadRequestException(
        'No se pudo obtener el historial de clases',
      );
    }

    // saco los ids de clases para buscar comentarios después
    const idsClases = (data ?? []).map((fila: any) => fila.Clase.id);

    // busco comentarios del cliente para esas clases
    const { data: quejas, error: errorQuejas } = await this.db
      .from('LibroDeQuejas')
      .select('id_clase, calificacion, comentario')
      .eq('id_cliente', idCliente)
      .in('id_clase', idsClases.length ? idsClases : [0]);

    if (errorQuejas) {
      throw new BadRequestException(
        'No se pudo obtener el historial de clases',
      );
    }

    // armo mapa para acceder rápido a comentarios por clase
    const quejasPorClase = new Map(
      (quejas ?? []).map((q: any) => [q.id_clase, q]),
    );

    // combino datos de clase + profesor + comentario
    return (data ?? [])
      .map((fila: any) => {
        const clase = fila.Clase;
        const profesor = clase.Persona_;
        const queja = quejasPorClase.get(clase.id);

        return {
          idClase: clase.id,
          fecha: clase.fecha,
          hora: clase.hora,
          tipo: clase.tipo,
          profesorNombre: profesor?.nombre ?? '',
          profesorApellido: profesor?.apellido ?? '',
          calificacion: queja?.calificacion ?? null,
          comentario: queja?.comentario ?? null,
        };
      })
      // ordeno por fecha/hora (más recientes primero)
      .sort((a, b) => (a.fecha + a.hora < b.fecha + b.hora ? 1 : -1));
  }

  /**
   * Verifica que:
   * - el cliente esté inscripto en la clase
   * - la clase ya haya finalizado
   * - la inscripción no haya sido cancelada o cambiada
   */
  private async verificarClaseAsistidaYPasada(
    idCliente: number,
    idClase: number,
  ) {
    const { data, error } = await this.db
      .from('Se_inscribe')
      .select('id_clase, historial_estado, Clase!inner(fecha, hora)')
      .eq('id_cliente', idCliente)
      .eq('id_clase', idClase)
      .maybeSingle();

    if (error || !data) {
      throw new ForbiddenException(
        'Solo podés comentar clases a las que estuviste inscripto',
      );
    }

    // si canceló o cambió de turno, esa inscripción ya no cuenta como asistida
    if (ESTADOS_NO_VALIDOS.includes((data as any).historial_estado)) {
      throw new ForbiddenException(
        'No podés comentar una clase que cancelaste o cambiaste',
      );
    }

    const clase = (data as any).Clase;
    const ahora = new Date();
    const fechaHoraClase = new Date(`${clase.fecha}T${clase.hora}`);

    if (fechaHoraClase >= ahora) {
      throw new BadRequestException(
        'Solo podés comentar clases que ya finalizaron',
      );
    }
  }

  /**
   * Verifica que el cliente no haya comentado ya esta clase
   */
  private async verificarNoExisteComentarioPrevio(
    idCliente: number,
    idClase: number,
  ) {
    const { data } = await this.db
      .from('LibroDeQuejas')
      .select('id')
      .eq('id_cliente', idCliente)
      .eq('id_clase', idClase)
      .maybeSingle();

    if (data) {
      throw new ConflictException(
        'Ya registraste un comentario para esta clase',
      );
    }
  }
/**
 * Comprueba que la persona tenga rol administrador
 * (queda sin usar en el endpoint de admin/comentarios por ahora,
 * pero se deja disponible por si se necesita en otro lado)
 */
async verificarEsAdministrador(idPersona:number){

  const { data, error } = await this.db
    .from('Persona_')
    .select('rol')
    .eq('id', idPersona)
    .single();



  if(error || !data){

    throw new ForbiddenException(
      'Usuario no encontrado'
    );

  }



  // Según tu sistema:
  // rol 0 = administrador
  if(data.rol !== 0){

    throw new ForbiddenException(
      'No tenés permisos para ver el libro de quejas'
    );

  }

}
/**
 * AC (Administrador):
 * obtiene todos los comentarios del libro de quejas.
 * Incluye:
 * - cliente que escribió
 * - clase
 * - profesor
 * - calificación
 */
async obtenerTodosLosComentarios(idAdmin: number) {

  // verifico que sea administrador antes de mostrar información
  await this.verificarEsAdministrador(idAdmin);


  const { data, error } = await this.db
    .from('LibroDeQuejas')
    .select(`
      id,
      comentario,
      calificacion,
      fecha,

      Persona_!LibroDeQuejas_id_cliente_fkey (
        nombre,
        apellido
      ),

      Clase!inner (
        id,
        fecha,
        hora,
        tipo,

        Persona_!Clase_id_profesor_fkey (
          nombre,
          apellido
        )
      )
    `)
    .order('fecha', { ascending: false });


  if (error) {
    throw new BadRequestException(
      'No se pudieron obtener los comentarios'
    );
  }


  return this.mapComentarios(data);

}

/**
 * Igual que obtenerTodosLosComentarios pero sin exigir admin
 * (mismo criterio que ListaEsperaController: endpoint abierto)
 */
async obtenerTodosLosComentariosSinAuth() {

  const { data, error } = await this.db
    .from('LibroDeQuejas')
    .select(`
      id,
      comentario,
      calificacion,
      fecha,

      Persona_!LibroDeQuejas_id_cliente_fkey (
        nombre,
        apellido
      ),

      Clase!inner (
        id,
        fecha,
        hora,
        tipo,

        Persona_!Clase_id_profesor_fkey (
          nombre,
          apellido
        )
      )
    `)
    .order('fecha', { ascending: false });


  if (error) {
    throw new BadRequestException(
      'No se pudieron obtener los comentarios'
    );
  }


  return this.mapComentarios(data);

}

// helper compartido para no repetir el mapeo en los dos métodos de arriba
private mapComentarios(data: any[]) {

  return (data ?? []).map((fila:any)=>{

    const cliente = fila.Persona_;
    const clase = fila.Clase;
    const profesor = clase?.Persona_;


    return {

      idComentario: fila.id,

      comentario: fila.comentario,
      calificacion: fila.calificacion,
      fechaComentario: fila.fecha,


      clienteNombre: cliente?.nombre ?? '',
      clienteApellido: cliente?.apellido ?? '',


      idClase: clase?.id,
      fechaClase: clase?.fecha,
      horaClase: clase?.hora,
      tipoClase: clase?.tipo,


      profesorNombre: profesor?.nombre ?? '',
      profesorApellido: profesor?.apellido ?? '',

    };

  });

}

}