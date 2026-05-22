import { Injectable, BadRequestException, InternalServerErrorException, UnauthorizedException} from '@nestjs/common';
import { SupabaseService } from "../integrations/supabase.service";
import { RegistroDto } from './dto/registro.dto';
import { InicioDto } from './dto/inicio.dto';
import * as crypto from 'crypto';

// El decorador @Injectable() indica que esta clase tiene servicios que otros archivos pueden usar 
@Injectable()
export class AuthService {
  //Conexión a supabase
  constructor(private readonly supabaseService: SupabaseService) {}

  //Generación de contraseña aleatoria para el registro
  private generarPasswordAleatoria(longitud: number = 8): string {
    return crypto.randomBytes(longitud).toString('hex').slice(0, longitud);
  }
  //-------------------------------------Método/servicio para registrar-------------------------------------
  async registrarUsuario(datos: RegistroDto) {
  console.log("Datos recibidos del frontend:", datos);

  //Reviso si alguno de los campos está vacío o con un espacio
  if (!datos.nombre?.trim() || !datos.apellido?.trim() || !datos.dni?.trim() || !datos.email?.trim()) {
    throw new BadRequestException("No se pudieron registrar los datos porque hay campos obligatorios vacíos.");
  }

  // Estructura de control para intentar la inserción segura en la base de datos y capturar cualquier falla imprevista
  try {
    //Genero la contraseña base para el registro
    const passwordBase = this.generarPasswordAleatoria(8);

    //Registro al usuario en supabase auth
    const { data: authData, error: authError } = await this.supabaseService.client.auth.admin.createUser({
        email: datos.email,
        password: passwordBase,
        email_confirm: true // Lo confirmamos automáticamente para evitar el paso del email de verificación por ahora
      });

    if (authError) { //Si supabase auth falla por algun error, informa
        throw new BadRequestException(`Error en autenticación: ${authError.message}`);
    }

    const { error } = await this.supabaseService.client
      .from('Persona') 
      .insert([
        {
          user_id: authData.user.id, //Acá se vincula la entrada de la tabla con el sistema de auth
          nombre: datos.nombre,
          apellido: datos.apellido,
          mail: datos.email,
          dni: datos.dni,
          telefono: datos.telefono || null //Si el teléfono viene vacío, se guarda como null
        }
      ]);

    if (error) {      
      await this.supabaseService.client.auth.admin.deleteUser(authData.user.id); //Si no se pudo registrar el usuario en la DB, lo eliminamos del sistema Auth de supabase
      throw new BadRequestException(`No se pudieron registrar los datos: ${error.message}`);
    }
    console.log(`¡ATENCIÓN! La contraseña generada para ${datos.email} es: ${passwordBase}`); //Esto es lo que se debería enviar por mail

    return {
      //con success y mensaje, Typescript arma el mensaje HTTP para devolver
      success: true,
      mensaje: "Datos registrados correctamente :)"
    };

  } catch (err) {
    // Si ya es un error de NestJS que lanzamos arriba, lo dejamos pasar
    if (err instanceof BadRequestException) {
      console.log(`Error encontrado! Linea 70 de auth.service`);
      throw err;
    }
    // Si es un error desconocido (se cayó el internet, etc), lanzamos un 500 (Internal Server Error)
    throw new InternalServerErrorException("Error interno al intentar comunicarse con la base de datos");
  }
 }

  //----------------------Método para iniciar sesión----------------------
  async iniciarSesion(datosIngresados: InicioDto) {
    
    // supabase Auth valida los datos
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email: datosIngresados.email,
      password: datosIngresados.passwd,
    });

    //Si hay algun error como que algún dato sea inválido
    if (error) {
      //Devuelve error 401 unauthorized
      throw new UnauthorizedException('El email o la contraseña son incorrectos.');
    }

    //El token que devuelva supabase es lo que va a validar al usuario
    return {
      success: true,
      mensaje: "Inicio de sesión exitoso :)",
      token: data.session.access_token, 
      usuarioId: data.user.id
    };
  }

}