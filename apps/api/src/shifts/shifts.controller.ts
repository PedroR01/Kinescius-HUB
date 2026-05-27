
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CambiarTurnoDto } from './dto/cambiar-turno-dto';
import { ShiftsService } from './shifts.service';
import { CancelarTurnoDto } from './dto/cancelar-turno-dto';

@Controller('shifts')
export class ShiftsController {

  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  async obtenerClasesDisponibles() {
    return await this.shiftsService.obtenerClasesDisponibles();
  }

  @Patch('cambiar')
  async cambiarTurno(@Body() cambiarTurnoDto: CambiarTurnoDto) {
    return await this.shiftsService.procesarCambioTurno(cambiarTurnoDto);
  }

  @Patch('cancelar')
  async cancelarTurno(@Body() cancelarTurnoDto: CancelarTurnoDto) {
    return this.shiftsService.cancelar(cancelarTurnoDto);
}

}