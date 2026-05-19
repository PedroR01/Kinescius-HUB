import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { InicioDto } from './dto/inicio.dto';

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
}