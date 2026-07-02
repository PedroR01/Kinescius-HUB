import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';

// Service donde está toda la lógica de negocio (consultas, validaciones, etc.)
import { LibroQuejasService } from './libroQuejas.service';

// DTO que define cómo viene el body del request
import { CreateQuejaDto } from './dto/crear-queja.dto';

@Controller('libro-quejas')
export class LibroQuejasController {
  constructor(
    // Inyecto el service para poder usar su lógica
    private readonly libroQuejasService: LibroQuejasService,
  ) {}

  // POST /libro-quejas
  // AC1: el cliente envía un comentario sobre una clase
  @Post()
  async registrarComentario(
    // Body con los datos del comentario
    @Body() dto: CreateQuejaDto,
  ) {
    // Llamo al service para guardar el comentario en la base de datos
    // Ojo: acá uso id_cliente e id_clase que vienen dentro del DTO
    return this.libroQuejasService.registrarComentario(
      dto.id_cliente,
      dto.id_clase,
      dto,
    );
  }

  // GET /libro-quejas/cliente/:id/historial
  // Devuelve el historial de clases pasadas de un cliente
  @Get('cliente/:id/historial')
  async obtenerHistorial(
    // ID del cliente que viene por parámetro en la URL
    @Param('id') id: string,
  ) {
    // Convierto el id a número porque viene como string
    const clienteId = Number(id);

    // Valido que realmente sea un número válido
    if (Number.isNaN(clienteId)) {
      throw new BadRequestException('Invalid cliente id');
    }

    // Llamo al service para traer el historial del cliente
    return this.libroQuejasService.obtenerHistorial(clienteId);
  }
}