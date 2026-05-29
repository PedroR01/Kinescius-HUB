import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfirmarTurnoService } from './confirmar-turno.service';
import { ConfirmarTurnoDto } from './dto/confirmar-turno.dto';
@Controller('confirmar-turno')
export class ConfirmarTurnoController {
  constructor(private readonly confirmarTurnoService: ConfirmarTurnoService) {}

  /**
   * GET /confirmar-turno/validar?token=...&claseId=...&clienteId=...
   *
   * El frontend llama a este endpoint cuando el cliente abre el link del email.
   * Valida el token y devuelve los datos de la clase para mostrar la pantalla de pago.
   */
  @Get('validar')
  async validarToken(
    @Query('token') token: string,
    @Query('claseId') claseId: string,
    @Query('clienteId') clienteId: string,
  ) {
    return this.confirmarTurnoService.validarToken(
      token,
      Number(claseId),
      Number(clienteId),
    );
  }

  /**
   * POST /confirmar-turno
   *
   * El frontend llama a este endpoint cuando el cliente presiona "Confirmar turno"
   * tras pasar por el flujo de pago.
   *
   * Escenario 2: pago exitoso → inscribe al cliente → { message: 'Turno solicitado' }
   * Escenario 3: pago fallido → 400 con mensaje de error de pago
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async confirmarTurno(@Body() dto: ConfirmarTurnoDto) {
    return this.confirmarTurnoService.confirmarTurno(dto);
  }
}