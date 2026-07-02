import { Controller, Get, Patch, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CambiarTurnoDto } from './dto/cambiar-turno-dto';
import { ShiftsService } from './shifts.service';
import { CancelarTurnoDto } from './dto/cancelar-turno-dto';
import { MisClasesResponseDto } from './dto/ver-clases-dto';
import { RecordatoriosService } from '../notifications/shifts-reminders.service';
import { Headers, UnauthorizedException, ForbiddenException } from '@nestjs/common';
@Controller('shifts')
export class ShiftsController {

  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly recordatoriosService: RecordatoriosService,
  ) { }

  @Get()
  async obtenerClasesDisponibles() {
    return await this.shiftsService.obtenerClasesDisponibles();
  }

  @Get('cliente-id')
  async getClienteId(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Formato de token inválido');
    }
    const datos = await this.recordatoriosService.obtenerDatosDeUsuario(token);
    return { id_cliente: datos.id, rol: datos.rol };
  }

  @Patch('cambiar')
  async cambiarTurno(@Body() cambiarTurnoDto: CambiarTurnoDto) {
    return await this.shiftsService.procesarCambioTurno(cambiarTurnoDto);
  }

  @Patch('cancelar')
  async cancelarTurno(
    @Body() cancelarTurnoDto: CancelarTurnoDto,
    @Headers('authorization') authHeader: string,
  ) {
    const clienteIdToken = await this.resolverClienteIdDesdeToken(authHeader);
    if (clienteIdToken !== cancelarTurnoDto.clienteId) {
      throw new ForbiddenException('No podés cancelar turnos de otro cliente.');
    }
    return this.shiftsService.cancelar(cancelarTurnoDto);
  }

  private async resolverClienteIdDesdeToken(authHeader: string): Promise<number> {
    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Formato de token inválido');
    }
    return this.recordatoriosService.obtenerIdDeUsuario(token);
  }

  @Get('mis-clases/:idCliente')
  async getMisClases(
    @Param('idCliente', ParseIntPipe) idCliente: number
  ): Promise<MisClasesResponseDto[]> {
    return await this.shiftsService.obtenerClasesPorCliente(idCliente);
  }

  @Get('historial/:idCliente')
  async getHistorialClases(
    @Param('idCliente', ParseIntPipe) idCliente: number
  ) {
    return await this.shiftsService.obtenerHistorialPorCliente(idCliente);
  }




}
