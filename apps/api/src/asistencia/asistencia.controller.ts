import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { GenerarTokenDto } from './dto/generar-token.dto';
import { RegistrarAsistenciaDto } from './dto/registrar-asistencia.dto';

@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Post('generar-token')
  @HttpCode(HttpStatus.OK)
  generarToken(
    @Headers('authorization') authHeader: string,
    @Body() dto: GenerarTokenDto,
  ) {
    return this.asistenciaService.generarToken(authHeader, dto);
  }

  @Post('registrar')
  @HttpCode(HttpStatus.OK)
  registrarAsistencia(
    @Headers('authorization') authHeader: string,
    @Body() dto: RegistrarAsistenciaDto,
  ) {
    return this.asistenciaService.registrarAsistencia(authHeader, dto);
  }

  @Get('clase/:claseId')
  obtenerAsistenciaPorClase(
    @Headers('authorization') authHeader: string,
    @Param('claseId', ParseIntPipe) claseId: number,
  ) {
    return this.asistenciaService.obtenerAsistenciaPorClase(authHeader, claseId);
  }

  @Get('profesor/clases')
  obtenerClasesProfesor(@Headers('authorization') authHeader: string) {
    return this.asistenciaService.obtenerClasesProfesor(authHeader);
  }
}
