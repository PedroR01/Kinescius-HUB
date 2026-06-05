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

  @Get('confirmar')
  async confirmarDesdeEmail(
    @Query('token') token: string,
    @Query('claseId') claseId: string,
    @Query('clienteId') clienteId: string,
  ) {
    return this.confirmarTurnoService.confirmarDesdeEmail(
      token,
      Number(claseId),
      Number(clienteId),
    );
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async confirmarTurno(@Body() dto: ConfirmarTurnoDto) {
    return this.confirmarTurnoService.confirmarTurno(dto);
  }
}