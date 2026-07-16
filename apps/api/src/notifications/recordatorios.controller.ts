import { Controller, Get, Patch, Body } from '@nestjs/common';
import { RecordatoriosService } from './shifts-reminders.service';
import { ActualizarHorarioDto } from './dto/actualizar-horario.dto';
import { ActualizarHorarioPagoDto } from './dto/actualizar-horario-pago.dto';

@Controller('recordatorios')
export class RecordatoriosController {
  constructor(private readonly recordatoriosService: RecordatoriosService) {}

  @Get('horarios')
  async obtenerHorarios() {
    return this.recordatoriosService.obtenerHorarios();
  }

  @Patch('horario')
  async actualizarHorario(@Body() dto: ActualizarHorarioDto) {
    return this.recordatoriosService.actualizarHorario(dto.hora, dto.minuto);
  }

  @Patch('horario-pago')
  async actualizarHorarioPago(@Body() dto: ActualizarHorarioPagoDto) {
    return this.recordatoriosService.actualizarHorarioPago(dto.hora, dto.minuto);
  }
}
