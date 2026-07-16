import { Injectable, BadRequestException, InternalServerErrorException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from "../integrations/supabase/supabase.service";
import { RegistroDto } from './dto/registro.dto';
import { RegistroProfesorDto } from './dto/registro-profesor.dto';
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
  ) { }

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

    //Busco si el DNI o el Mail ya están en la base de datos
    const { data: usuariosExistentes, error: errorBusqueda } = await this.supabaseService.client
      .from('Persona_')
      .select('dni, mail')
      .or(`dni.eq.${datos.dni},mail.eq.${datos.email}`);
    if (errorBusqueda) {
      throw new InternalServerErrorException("Error al verificar la disponibilidad de los datos en el sistema.");
    }
    // Si el array trajo algún resultado, significa que al menos uno de los dos datos ya existe
    if (usuariosExistentes && usuariosExistentes.length > 0) {
      const dniOcupado = usuariosExistentes.some(usuario => usuario.dni === datos.dni);
      const mailOcupado = usuariosExistentes.some(usuario => usuario.mail === datos.email);

      if (dniOcupado && mailOcupado) {
        throw new BadRequestException("El DNI y el Email ingresados ya se encuentran registrados en otra cuenta.");
      } else if (dniOcupado) {
        throw new BadRequestException("El DNI ingresado ya se encuentra registrado. Por favor, verificá tus datos.");
      } else if (mailOcupado) {
        throw new BadRequestException("El Email ingresado ya pertenece a una cuenta existente.");
      }
    }

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

      //Recupero el ID generado para el nuevo usuario en Persona
      const { data: personaData, error } = await this.supabaseService.client
        .from('Persona_')
        .insert([
          {
            nombre: datos.nombre,
            apellido: datos.apellido,
            mail: datos.email,
            dni: datos.dni,
            rol: datos.rol,
            activo: true,
            telefono: datos.telefono || null //Si el teléfono viene vacío, se guarda como null
          }
        ])
        .select('id')
        .single();
      if (error || !personaData) {
        await this.supabaseService.client.auth.admin.deleteUser(authData.user.id); //Si no se pudo registrar el usuario en la DB, lo eliminamos del sistema Auth de supabase
        throw new BadRequestException(`No se pudieron registrar los datos personales: ${error?.message}`);
      }

      const { error: errorEstadoCliente } = await this.supabaseService.client
        .from('Estado_Cliente')
        .insert([
          {
            id: personaData.id
          }
        ]);
      if (errorEstadoCliente) {
        // Si falla la cración del estado del cliente, hacemos un "rollback" eliminando la cuenta de Auth para no dejar datos huérfanos
        await this.supabaseService.client.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException(`No se pudo asignar el id como abonado en la base de datos: ${errorEstadoCliente.message}`);
      }



      console.log(`----------¡ATENCIÓN! La contraseña generada para ${datos.email} es: ${passwordBase}----------`); //Esto es lo que se debería enviar por mail
      try {
        await this.emailService.enviarCorreo(
          datos.email, //Hay que usar el mail carlo.castro247390@alumnos.info.unlp.edu.ar para el testeo
          '¡Bienvenido a Kinescius-HUB!',
          `<h2>Gracias por registrarte</h2>
         <p>Tu cuenta ha sido creada con éxito, y tu contraseña es: <strong>${passwordBase}</strong></p>
         <p>Puedes cambiar tu contraseña cuando quieras luego de iniciar sesión en el sistema. Que tenga un buen día!</p>`
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

    //Uso el mail del usuario para buscar su id
    const { data: persona, error: errorPersona } = await this.supabaseService.client
      .from('Persona_')
      .select('id, activo')
      .eq('mail', datosIngresados.email)
      .single();

    if (errorPersona || !persona) {
      throw new InternalServerErrorException('Error al recuperar los datos internos del usuario.');
    }

    if (!persona.activo) { //si el cliente está suspendido, se le informa
      throw new UnauthorizedException('No puedes iniciar sesión, tu cuenta está suspendida. Para revocar la suspención debes ir presencialmente a Kinescius.');
    }

    const rolUsuario = await this.resolverRolUsuario(persona.id);

    //El token y el rol que devuelva al frontend va a validar al usuario como cliente o admin
    return {
      success: true,
      mensaje: "Inicio de sesión exitoso :)",
      token: data.session.access_token,
      usuarioId: persona.id,
      rol: rolUsuario
    };
  }

  // ----------------------Método para Recuperar Contraseña----------------------
  async recuperarPasswd(email: string) {

    //Buscamos el UUID del usuario con su email
    const { data, error: authListError } = await this.supabaseService.client
      .auth.admin.listUsers();
    const authUser = data?.users?.find((u: any) => u.email === email);
    if (!authUser) {
      return { success: true, mensaje: "El mail ingresado no está registrado en el sistema." };
    }

    try {
      //Generamos la nueva contraseña usando tu método existente
      const nuevaPassword = this.generarPasswordAleatoria(8);
      console.log(`----------¡ATENCIÓN! La nueva contraseña generada para ${email} es: ${nuevaPassword}----------`);

      //Forzamos el cambio de contraseña en Supabase
      const { error: updateError } = await this.supabaseService.client.auth.admin.updateUserById(
        authUser.id,
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

  async registrarProfesor(token: string, datos: RegistroProfesorDto) {
    await this.verificarEsAdmin(token);

    if (!datos.nombre?.trim() || !datos.apellido?.trim() || !datos.dni?.trim() || !datos.email?.trim()) {
      throw new BadRequestException('No se pudieron registrar los datos porque hay campos obligatorios vacíos.');
    }

    const { data: usuariosExistentes, error: errorBusqueda } = await this.supabaseService.client
      .from('Persona')
      .select('dni, mail')
      .or(`dni.eq.${datos.dni},mail.eq.${datos.email}`);

    if (errorBusqueda) {
      throw new InternalServerErrorException('Error al verificar la disponibilidad de los datos en el sistema.');
    }

    if (usuariosExistentes && usuariosExistentes.length > 0) {
      const dniOcupado = usuariosExistentes.some((usuario) => usuario.dni === datos.dni);
      const mailOcupado = usuariosExistentes.some((usuario) => usuario.mail === datos.email);

      if (dniOcupado && mailOcupado) {
        throw new BadRequestException('El DNI y el Email ingresados ya se encuentran registrados en otra cuenta.');
      }
      if (dniOcupado) {
        throw new BadRequestException('El DNI ingresado ya se encuentra registrado.');
      }
      if (mailOcupado) {
        throw new BadRequestException('El Email ingresado ya pertenece a una cuenta existente.');
      }
    }

    try {
      const passwordBase = this.generarPasswordAleatoria(8);

      const { data: authData, error: authError } = await this.supabaseService.client.auth.admin.createUser({
        email: datos.email,
        password: passwordBase,
        email_confirm: true,
        user_metadata: { rol: 'profesor' },
      });

      if (authError) {
        throw new BadRequestException(`Error en autenticación: ${authError.message}`);
      }

      const { data: personaData, error } = await this.supabaseService.client
        .from('Persona')
        .insert([
          {
            user_id: authData.user.id,
            nombre: datos.nombre,
            apellido: datos.apellido,
            mail: datos.email,
            dni: datos.dni,
            telefono: datos.telefono || null,
          },
        ])
        .select('id')
        .single();

      if (error || !personaData) {
        await this.supabaseService.client.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException(`No se pudieron registrar los datos personales: ${error?.message}`);
      }

      const { error: errorUsuario } = await this.supabaseService.client
        .from('Usuario')
        .insert([{ id: personaData.id }]);

      if (errorUsuario) {
        await this.supabaseService.client.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException(`No se pudo asignar el id como usuario: ${errorUsuario.message}`);
      }

      const { error: errorProfesor } = await this.supabaseService.client
        .from('Profesor')
        .insert([{ id: personaData.id }]);

      if (errorProfesor) {
        await this.supabaseService.client.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException(`No se pudo asignar el rol de profesor: ${errorProfesor.message}`);
      }

      try {
        await this.emailService.enviarCorreo(
          datos.email,
          'Cuenta de profesor en Kinescius-HUB',
          `<h2>Tu cuenta de profesor fue creada</h2>
           <p>Tu contraseña temporal es: <strong>${passwordBase}</strong></p>
           <p>Podés cambiarla luego de iniciar sesión.</p>`,
        );
      } catch (emailError) {
        console.error('El profesor se registró, pero falló el envío del correo:', emailError);
      }

      return {
        success: true,
        mensaje: 'Profesor registrado correctamente.',
      };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Error interno al registrar el profesor.');
    }
  }

  private async resolverRolUsuario(personaId: number): Promise<'admin' | 'profesor' | 'cliente' | 'cliente abonado'> {
    const { data: usuario, error: errorUsuario } = await this.supabaseService.client
      .from('Persona_')
      .select('rol')
      .eq('id', personaId)
      .maybeSingle();
    if (errorUsuario || !usuario) {
      throw new InternalServerErrorException('Error al buscar el rol del usuario.');
    }
    switch (usuario.rol) {
      case 0:
        return 'admin';
      case 1:
        return 'profesor';
      case 2:
        return 'cliente'
      case 3:
        return 'cliente abonado';
      default:
        return 'cliente';
    }

  }

  private async verificarEsAdmin(token: string): Promise<void> {
    const { data: userData, error: userError } = await this.supabaseService.client.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    const { data: persona, error: personaError } = await this.supabaseService.client
      .from('Persona')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (personaError || !persona) {
      throw new UnauthorizedException('No se encontró el perfil del usuario.');
    }

    const { data: admin } = await this.supabaseService.client
      .from('Administrador')
      .select('id')
      .eq('id', persona.id)
      .maybeSingle();

    if (!admin) {
      throw new ForbiddenException('Solo los administradores pueden realizar esta acción.');
    }
  }

  // ----------------------Método para Cambiar Contraseña----------------------
  async cambiarPasswd(token: string, passwdActual: string, passwdNueva: string) {
    //Leemos el token para saber qué usuario está haciendo la petición
    const { data: userData, error: userError } = await this.supabaseService.client.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException('La contraseña actual ingresada no es correcta.');
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

  async getUserProfile(token: string) {
    const { data: userData, error: userError } = await this.supabaseService.client.auth.getUser(token);
    if (userError || !userData.user) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    const { data: persona, error: personaError } = await this.supabaseService.client
      .from('Persona_')
      .select('id, nombre, apellido, mail, dni, telefono, rol')
      .eq('mail', userData.user.email)
      .single();

    if (personaError || !persona) {
      throw new UnauthorizedException('No se encontró el perfil del usuario.');
    }

    return {
      id: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      mail: persona.mail,
      dni: persona.dni,
      telefono: persona.telefono,
      rol: persona.rol,
    };
  }

  async getEstadoCliente(token: string) {
    const { data: userData, error: userError } = await this.supabaseService.client.auth.getUser(token);
    if (userError || !userData.user) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    const { data: persona, error: personaError } = await this.supabaseService.client
      .from('Persona_')
      .select('id')
      .eq('mail', userData.user.email)
      .single();

    if (personaError || !persona) {
      throw new UnauthorizedException('No se encontró el perfil del usuario.');
    }

    const { data: cuenta, error: cuentaError } = await this.supabaseService.client
      .from('Estado_Cliente')
      .select('monto_favor, id_pago_abonado, clases_favor, cancelado')
      .eq('id', persona.id)
      .single();

    if (cuentaError || !cuenta) {
      throw new UnauthorizedException('No se encontró el estado del cliente.');
    }

    if (cuenta.id_pago_abonado) {
      const { data: pagoInfo, error: pagoInfoError } = await this.supabaseService.client
        .from('Pago')
        .select('fecha')
        .eq('id_pago', cuenta.id_pago_abonado)
        .single();

      if (pagoInfoError || !pagoInfo) {
        throw new UnauthorizedException('No se encontró la información del pago.');
      }

      return {
        id: persona.id,
        monto_favor: cuenta.monto_favor,
        id_pago_abonado: cuenta.id_pago_abonado,
        fecha_pago: pagoInfo.fecha,
        fecha_fin: new Date(pagoInfo.fecha).setMonth(new Date(pagoInfo.fecha).getMonth() + 1),
        clases_utilizadas: cuenta.clases_favor,
        cancelado: Boolean(cuenta.cancelado),
      };
    } else {
      return {
        id: persona.id,
        monto_favor: cuenta.monto_favor,
        id_pago_abonado: null,
        fecha_pago: null,
        fecha_fin: null,
        clases_utilizadas: null,
        cancelado: Boolean(cuenta.cancelado),
      };
    }
  }

}