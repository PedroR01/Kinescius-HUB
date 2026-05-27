import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { InicioDto } from './dto/inicio.dto';
import { RecuperarDto } from './dto/recuperar.dto';
import { CambioPasswordDto } from './dto/cambio-passwd.dto';

// 1. La ruta base del controlador será "/auth"
@Controller('auth')
export class AuthController {
  //agrego el archivo de servicios
  constructor(private readonly authService: AuthService) {}

  // 2. Al agregar @Post('registro'), el endpoint final es: POST /api/auth/registro
  @Post('registro')
  registrarUsuario(@Body() datosRegistro: RegistroDto) {
    // El controlador NO toma decisiones, solo recibe las peticiones y se las pasa al archivo con los servicios
    return this.authService.registrarUsuario(datosRegistro);
  }
  
  @Post('login')
  iniciarSesion(@Body() datosIngresados: InicioDto) { 
    return this.authService.iniciarSesion(datosIngresados);
  }

  @Post('recuperar')
  recuperarPasswd(@Body() datos: RecuperarDto){ //Si bien es un string, uso dto para validar el email
    return this.authService.recuperarPasswd(datos.email);
  }

  @Post('cambiar-password')
  cambiarPassword(
    @Headers('authorization') authHeader: string,
    @Body() datos: CambioPasswordDto
  ) {
    // El header viaja como "Bearer eyJhbGciOiJIUzI...", así que lo partimos para sacar solo el código
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No se proporcionó un token de autorización válido.');
    }
    const token = authHeader.split(' ')[1];

    // Le pasamos todo procesado al servicio de cambio de passwd
    return this.authService.cambiarPasswd(token, datos.passwdActual, datos.passwdNueva);
  }
}