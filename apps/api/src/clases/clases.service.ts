import { Injectable, InternalServerErrorException, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { SupabaseService } from "../integrations/supabase/supabase.service";

@Injectable()
export class ClasesService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async findAll() {
    console.log('🔍 DEBUG findAll() EJECUTADO');

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

    console.log('🔍 DEBUG cantidad de clases devueltas:', data?.length);
    console.log('🔍 DEBUG primera fecha:', data?.[0]?.fecha);
    console.log('🔍 DEBUG última fecha:', data?.[data.length - 1]?.fecha);

    return data;
  }

  async obtenerClasesProfesor(bearerToken: string) {
    const personaId = await this.obtenerPersonaId(bearerToken);
    await this.verificarEsProfesor(personaId);

    const { data: clases, error } = await this.supabaseService.client
      .from('Clase')
      .select('id, fecha, hora, tipo, cupo, estado')
      .eq('id_profesor', personaId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });
    if (error) {
      throw new InternalServerErrorException('No se pudieron cargar las clases del profesor.');
    }
    return clases ?? [];
  }

  //----------------Métodos privados de autenticación-----------------
  //iguales a los de asistencia.service.ts
  private async obtenerPersonaId(bearerToken: string): Promise<number> {
    const token = this.extraerBearerToken(bearerToken);
    const { data: userData, error: userError } =
      await this.supabaseService.client.auth.getUser(token);
    if (userError || !userData.user) {
      throw new UnauthorizedException(
        'Sesión inválida o expirada.',
      );
    }
    const { data: persona, error: personaError } =
      await this.supabaseService.client
        .from('Persona')
        .select('id')
        .eq('user_id', userData.user.id)
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
  private async verificarEsProfesor(personaId: number): Promise<void> {
    const { data: profesor } = await this.supabaseService.client
      .from('Profesor')
      .select('id')
      .eq('id', personaId)
      .maybeSingle();
    if (!profesor) {
      throw new ForbiddenException(
        'Solo los profesores pueden acceder a este recurso.',
      );
    }
  }
}
