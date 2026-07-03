import {
  Body, Controller, Get, Param, Post,
  BadRequestException, ForbiddenException, UnauthorizedException, Headers,
} from '@nestjs/common';
import { LibroQuejasService } from './libroQuejas.service';
import { CreateQuejaDto } from './dto/crear-queja.dto';
import { RecordatoriosService } from '../notifications/shifts-reminders.service'; // mismo servicio que usa ShiftsController

@Controller('libro-quejas')
export class LibroQuejasController {
  constructor(
    private readonly libroQuejasService: LibroQuejasService,
    private readonly recordatoriosService: RecordatoriosService,
  ) {}

  @Post()
  async registrarComentario(
    @Body() dto: CreateQuejaDto,
    @Headers('authorization') authHeader: string,
  ) {
    const clienteToken = await this.resolverClienteIdDesdeToken(authHeader);
    if (clienteToken.id !== dto.id_cliente) {
      throw new ForbiddenException('No podés comentar en nombre de otro cliente.');
    }
    return this.libroQuejasService.registrarComentario(
      dto.id_cliente,
      dto.id_clase,
      dto,
    );
  }

  @Get('cliente/:id/historial')
  async obtenerHistorial(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    const clienteId = Number(id);
    if (Number.isNaN(clienteId)) {
      throw new BadRequestException('Invalid cliente id');
    }
    const clienteToken = await this.resolverClienteIdDesdeToken(authHeader);
    if (clienteToken.id !== clienteId) {
      throw new ForbiddenException('No podés ver el historial de otro cliente.');
    }
    return this.libroQuejasService.obtenerHistorial(clienteId);
  }

  private async resolverClienteIdDesdeToken(authHeader: string) {
    if (!authHeader) throw new UnauthorizedException('Token no proporcionado');
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Formato de token inválido');
    return this.recordatoriosService.obtenerIdDeUsuario(token);
  }
}