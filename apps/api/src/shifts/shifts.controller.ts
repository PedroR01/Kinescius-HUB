import { Controller, Get, Patch, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CambiarTurnoDto } from './dto/cambiar-turno-dto';
import { ShiftsService } from './shifts.service';
import { CancelarTurnoDto } from './dto/cancelar-turno-dto';
import { MisClasesResponseDto } from './dto/ver-clases-dto';
import { RecordatoriosService } from '../notifications/shifts-reminders.service';
import { Headers, UnauthorizedException } from '@nestjs/common';
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
    const id = await this.recordatoriosService.obtenerIdDeUsuario(token);
    return { id_cliente: id };
  }

  @Patch('cambiar')
  async cambiarTurno(@Body() cambiarTurnoDto: CambiarTurnoDto) {
    return await this.shiftsService.procesarCambioTurno(cambiarTurnoDto);
  }

  @Patch('cancelar')
  async cancelarTurno(@Body() cancelarTurnoDto: CancelarTurnoDto) {
    return this.shiftsService.cancelar(cancelarTurnoDto);
  }

  @Get('mis-clases/:idCliente')
  async getMisClases(
    @Param('idCliente', ParseIntPipe) idCliente: number
  ): Promise<MisClasesResponseDto[]> {
    return await this.shiftsService.obtenerClasesPorCliente(idCliente);
  }




}
