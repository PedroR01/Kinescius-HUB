import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  ParseIntPipe,
  BadRequestException
} from "@nestjs/common";

import { ClasesAdminService } from "./clases.service.Admin";
import { CreateClaseDto } from "./dto/create-clase..Admin.dto";

@Controller("admin/clases")
export class ClasesAdminController {
  constructor(private readonly clasesService: ClasesAdminService) {}

  @Get()
  async findAll(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.clasesService.findAll(startDate, endDate);
  }

  @Get("clientes")
  async findClientes() {
    return this.clasesService.getClientes();
  }

  @Get("inscriptos")
  async findInscriptos(
    @Query("fecha") fecha?: string,
    @Query("tipo") tipo?: string
  ) {
    if (!fecha || !tipo) {
      throw new BadRequestException(
        "Los parámetros fecha y clase son obligatorios"
      );
    }

    return this.clasesService.getInscriptos(fecha, tipo);
  }

  @Get("profesores")
  async findProfesores() {
    return this.clasesService.getProfesores();
  }

  @Post()
  async create(@Body() payload: CreateClaseDto) {
    return this.clasesService.create(payload as any);
  }

  @Patch(":id/cancelar")
  async cancel(@Param("id", ParseIntPipe) id: number) {
    return this.clasesService.cancel(id);
  }

  @Patch(":id/cambiar-profesor")
  async cambiarProfesor(
    @Param("id", ParseIntPipe) id: number,
    @Body("profesorId") profesorId: number
  ) {
    if (!profesorId) {
      throw new BadRequestException("El profesorId es obligatorio");
    }
    return this.clasesService.cambiarProfesor(id, profesorId);
  }
}