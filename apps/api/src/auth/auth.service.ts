import { Injectable, BadRequestException, InternalServerErrorException, UnauthorizedException} from '@nestjs/common';
import { SupabaseService } from "../integrations/supabase.service";
import { RegistroDto } from './dto/registro.dto';
import { InicioDto } from './dto/inicio.dto';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

// El decorador @Injectable() indica que esta clase tiene servicios que otros archivos pueden usar 
@Injectable()
export class AuthService {
  //Conexión a supabase y al servicio de emails
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly emailService: EmailService
  ) {}

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
    try {
      await this.emailService.enviarCorreo(
        datos.email, //Hay que usar el mail carlo.castro247390@alumnos.info.unlp.edu.ar para el testeo
        '¡Bienvenido a Kinescius-HUB!',
        `<h2>Gracias por registrarte</h2>
         <p>Tu cuenta ha sido creada con éxito.</p>
         <p>Tu contraseña temporal es: <strong>${passwordBase}</strong></p>`
      );
    } catch (emailError) {
      // Si el correo falla, lo anotamos en la consola, pero NO lanzamos el error
      // para que el proceso de registro pueda terminar exitosamente.
      console.error('El usuario se registró, pero falló el envío del correo de bienvenida:', emailError);
    }

    return {
      //con success y mensaje, Typescript arma el mensaje HTTP para devolver
      success: true,
      mensaje: "Datos registrados correctamente :)"
    };

  } catch (err) {
    // Si ya es un error de NestJS que lanzamos arriba, lo dejamos pasar
    if (err instanceof BadRequestException) {
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

  // ----------------------Método para Recuperar Contraseña----------------------
  async recuperarPasswd(email: string) {
    
    //Buscamos el UUID del usuario con su email
    const { data: persona, error: errorPersona } = await this.supabaseService.client
      .from('Persona')
      .select('user_id')
      .eq('mail', email)
      .single();

    if (errorPersona || !persona) {
      // Por convención de seguridad, no se avisa si el mail no existe para evitar que extraños 
      // averigüen quién es cliente, pero devolvemos un mensaje genérico de éxito.
      return { success: true, mensaje: "Si el correo está registrado, recibirás una nueva contraseña pronto." };
    }

    try {
      //Generamos la nueva contraseña usando tu método existente
      const nuevaPassword = this.generarPasswordAleatoria(8);

      //Forzamos el cambio de contraseña en Supabase
      const { error: updateError } = await this.supabaseService.client.auth.admin.updateUserById(
        persona.user_id,
        { password: nuevaPassword }
      );

      if (updateError) throw new Error(updateError.message);

      //Enviammos el correo con la nueva contraseña
      await this.emailService.enviarNuevaPassword(email, nuevaPassword);

      return { 
        success: true, 
        mensaje: "Si el correo está registrado, recibirás una nueva contraseña pronto." 
      };

    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException("Ocurrió un error al intentar procesar la recuperación de contraseña.");
    }
  }

  // ----------------------Método para Cambiar Contraseña----------------------
  async cambiarPasswd(token: string, passwdActual: string, passwdNueva: string) {
    //Leemos el token para saber qué usuario está haciendo la petición
    const { data: userData, error: userError } = await this.supabaseService.client.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException('Sesión inválida o expirada. Por favor, iniciá sesión nuevamente.');
    }

    const email = userData.user.email!; //El signo de exclamación le die a TypeScript que no va a venir un undefined
    //Valido que la contraseña actual sea correcta haciendo un logueo que no se muestra al usuario
    const { error: signInError } = await this.supabaseService.client.auth.signInWithPassword({
      email: email,
      password: passwdActual, //Supabase nos avisa si esto falla
    });

    if (signInError) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    //Si passwdActual es válida, mandamos la nueva a Supabase
    const { error: updateError } = await this.supabaseService.client.auth.admin.updateUserById(
      userData.user.id,
      { password: passwdNueva }
    );
    if (updateError) {
      throw new InternalServerErrorException(`No se pudo actualizar la contraseña: ${updateError.message}`);
    }

    return {
      success: true,
      mensaje: "¡Contraseña actualizada con éxito!"
    };
  }

}