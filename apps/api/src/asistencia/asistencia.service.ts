import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { SupabaseService } from '../integrations/supabase/supabase.service';
import { getFrontendUrl } from '../config/frontend-url';
import { GenerarTokenDto } from './dto/generar-token.dto';
import { RegistrarAsistenciaDto } from './dto/registrar-asistencia.dto';
import { buildAttendanceWindow } from './asistencia-time.util';

@Injectable()
export class AsistenciaService {
  constructor(private readonly supabase: SupabaseService) {}

  async generarToken(bearerToken: string, dto: GenerarTokenDto) {
    const personaId = await this.obtenerPersonaId(bearerToken);
    await this.verificarProfesorDeClase(personaId, dto.claseId);

    const { data: clase, error: claseError } = await this.supabase.client
      .from('Clase')
      .select('id, fecha, hora')
      .eq('id', dto.claseId)
      .single();

    if (claseError || !clase) {
      throw new NotFoundException('La clase no existe.');
    }

    const now = new Date();
    const { validFrom, expiresAt } = buildAttendanceWindow(clase.fecha, clase.hora);
/*
    if (now < validFrom) {
      throw new BadRequestException(
        'El código QR solo puede generarse 5 minutos antes del inicio de la clase.',
      );
    }

    if (now > expiresAt) {
      throw new GoneException(
        'El tiempo para registrar asistencia de esta clase ya expiró.',
      );
    }
      */

    const { data: tokenRow, error: tokenError } = await this.supabase.client
      .from('Token_Qr')
      .insert({
        clase_id: dto.claseId,
        expires_at: expiresAt.toISOString(),
      })
      .select('token, expires_at')
      .single();

    if (tokenError || !tokenRow) {
      throw new InternalServerErrorException(
        'No se pudo generar el código QR de asistencia.',
      );
    }

    const qrUrl = `${getFrontendUrl()}/asistencia?token=${tokenRow.token}`;

    await this.supabase.client
      .from('Clase')
      .update({ QR: qrUrl })
      .eq('id', dto.claseId);

    return {
      token: tokenRow.token,
      expiresAt: tokenRow.expires_at,
      qrUrl,
    };
  }

  async registrarAsistencia(bearerToken: string, dto: RegistrarAsistenciaDto) {
    const clienteId = await this.obtenerPersonaId(bearerToken);
    await this.verificarEsCliente(clienteId);

    const { data: tokenRow, error: tokenError } = await this.supabase.client
      .from('Token_Qr')
      .select('token, clase_id, expires_at')
      .eq('token', dto.token)
      .single();

    if (tokenError || !tokenRow) {
      throw new NotFoundException('El código QR no es válido.' + dto.token);
    }

    const now = new Date();
    if (now > new Date(tokenRow.expires_at)) {
      throw new GoneException('El código QR expiró. Contactá al profesor.');
    }

    const { data: inscripcion, error: inscripcionError } = await this.supabase.client
      .from('Se_inscribe')
      .select('id_cliente, id_clase, estado')
      .eq('id_cliente', clienteId)
      .eq('id_clase', tokenRow.clase_id)
      .maybeSingle();

    if (inscripcionError) {
      throw new InternalServerErrorException(
        'No se pudo verificar la inscripción.',
      );
    }

    if (!inscripcion) {
      throw new ForbiddenException('No estás inscripto en esta clase.');
    }

 // 2. Verificar asistencia existente en Asistencia_Clase
 const { data: asistenciaExistente, error: asistenciaError } = await this.supabase.client
 .from('Asistencia_Clase')
 .select('id_cliente')
 .eq('id_cliente', clienteId)
 .eq('id_clase', tokenRow.clase_id)
 .maybeSingle();
 
 if (asistenciaError) {
 throw new InternalServerErrorException('No se pudo verificar la asistencia.');
 }
 
 if (asistenciaExistente) {
 throw new ConflictException('Ya registraste tu asistencia para esta clase.');
 }
 
 // 3. Registrar asistencia
 const { error: insertError } = await this.supabase.client
 .from('Asistencia_Clase')
 .insert({
   id_clase: tokenRow.clase_id,
   id_cliente: clienteId,
 });
    if (insertError) {
      throw new InternalServerErrorException(
        'No se pudo registrar la asistencia.',
      );
    }

    const { data: clase } = await this.supabase.client
      .from('Clase')
      .select('fecha, hora, tipo')
      .eq('id', tokenRow.clase_id)
      .single();

    return {
      message: 'Asistencia registrada correctamente.',
      clase: clase
        ? {
            fecha: clase.fecha,
            hora: clase.hora,
            tipo: clase.tipo,
          }
        : null,
    };
  }

  async obtenerAsistenciaPorClase(bearerToken: string, claseId: number) {
    const personaId = await this.obtenerPersonaId(bearerToken);
    await this.verificarAccesoClase(personaId, claseId);

    const { data: inscriptos, error } = await this.supabase.client
      .from('Se_inscribe')
      .select(`
        id_cliente,
        asistio,
        asistio_at,
        estado,
        Cliente (
          Usuario (
            Persona ( nombre, apellido, dni )
          )
        )
      `)
      .eq('id_clase', claseId);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener la lista de asistencia.',
      );
    }

    const lista = (inscriptos ?? []).map((row: Record<string, unknown>) => {
      const cliente = row.Cliente as {
        Usuario?: { Persona?: { nombre?: string; apellido?: string; dni?: string } };
      } | null;
      const persona = cliente?.Usuario?.Persona;

      return {
        id_cliente: row.id_cliente,
        asistio: row.asistio,
        asistio_at: row.asistio_at,
        estado: row.estado,
        nombre: persona?.nombre ?? null,
        apellido: persona?.apellido ?? null,
        dni: persona?.dni ?? null,
      };
    });

    return { claseId, inscriptos: lista };
  }

  async obtenerClasesProfesor(bearerToken: string) {
    const personaMail = await this.obtenerPersonaMail(bearerToken);
    const personaId = await this.obtenerPersonaId(bearerToken);
    await this.verificarEsProfesorMail(personaMail);

    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const { data: clases, error } = await this.supabase.client
      .from('Clase')
      .select('id, fecha, hora, tipo, cupo, QR')
      .eq('id_profesor', personaId)
      .gte('fecha', hoy)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudieron cargar las clases del profesor.',
      );
    }

    const now = new Date();

    return (clases ?? []).map((clase) => {
      const { validFrom, expiresAt } = buildAttendanceWindow(clase.fecha, clase.hora);
      const puedeGenerarQr = now >= validFrom && now <= expiresAt;

      return {
        ...clase,
        puedeGenerarQr,
        ventanaDesde: validFrom.toISOString(),
        ventanaHasta: expiresAt.toISOString(),
      };
    });
  }

  private async obtenerPersonaMail(bearerToken: string): Promise<string> {
    const token = this.extraerBearerToken(bearerToken);

    const { data: userData, error: userError } =
      await this.supabase.client.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException(
        'Sesión inválida o expirada. Por favor, iniciá sesión nuevamente.',
      );
    }

    const { data: persona, error: personaError } = await this.supabase.client
      .from('Persona_')
      .select('mail')
      .eq('mail', userData.user.email)
      .single();

    if (personaError || !persona) {
      throw new UnauthorizedException('No se encontró el perfil del usuario.');
    }
    return persona.mail;
  }

  private async obtenerPersonaId(bearerToken: string): Promise<number> {
    const token = this.extraerBearerToken(bearerToken);

    const { data: userData, error: userError } =
      await this.supabase.client.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException(
        'Sesión inválida o expirada. Por favor, iniciá sesión nuevamente.',
      );
    }

    const { data: persona, error: personaError } = await this.supabase.client
      .from('Persona_')
      .select('id')
      .eq('mail', userData.user.email)
      .single();

    if (personaError || !persona) {
      throw new UnauthorizedException('No se encontró el perfil del usuario.');
    }
    return persona.id;
  }


  private extraerBearerToken(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'No se proporcionó un token de autorización válido.',
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Formato de token inválido.');
    }

    return token;
  }

  private async verificarEsProfesorMail(personaMail: string): Promise<void> {
    const { data: profesor } = await this.supabase.client
      .from('Persona_')
      .select('id')
      .eq('mail', personaMail)
      .eq('rol', 1)
      .maybeSingle();

    if (!profesor) {
      throw new ForbiddenException('Solo los profesores pueden acceder a este recurso.');
    }
  }

  private async verificarEsProfesor(personaId: number): Promise<void> {
    const { data: profesor } = await this.supabase.client
      .from('Persona_')
      .select('id')
      .eq('id', personaId)
      .eq('rol', 1)
      .maybeSingle();

    if (!profesor) {
      throw new ForbiddenException('Solo los profesores pueden acceder a este recurso.');
    }
  }

  private async verificarEsCliente(personaId: number): Promise<void> {
    const { data: cliente } = await this.supabase.client
      .from('Persona_')
      .select('id')
      .eq('id', personaId)
      .maybeSingle();

    if (!cliente) {
      throw new ForbiddenException(
        'Solo los clientes inscriptos pueden registrar asistencia.',
      );
    }
  }

  private async verificarEsAdmin(personaId: number): Promise<boolean> {
    const { data: admin } = await this.supabase.client
      .from('Administrador')
      .select('id')
      .eq('id', personaId)
      .maybeSingle();

    return Boolean(admin);
  }

  private async verificarProfesorDeClase(
    personaId: number,
    claseId: number,
  ): Promise<void> {
    await this.verificarEsProfesor(personaId);

    const { data: clase, error } = await this.supabase.client
      .from('Clase')
      .select('id_profesor')
      .eq('id', claseId)
      .single();

    if (error || !clase) {
      throw new NotFoundException('La clase no existe.');
    }

    if (clase.id_profesor !== personaId) {
      throw new ForbiddenException('No sos el profesor asignado a esta clase.');
    }
  }

  private async verificarAccesoClase(
    personaId: number,
    claseId: number,
  ): Promise<void> {
    const esAdmin = await this.verificarEsAdmin(personaId);
    if (esAdmin) {
      return;
    }

    await this.verificarProfesorDeClase(personaId, claseId);
  }
}
