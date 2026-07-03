import { Controller, Get, Patch, Body } from '@nestjs/common';
import { RecordatoriosService } from './shifts-reminders.service';
import { ActualizarHorarioDto } from './dto/actualizar-horario.dto';

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
}
