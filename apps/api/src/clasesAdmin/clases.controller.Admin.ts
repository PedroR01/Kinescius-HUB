import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  BadRequestException
} from "@nestjs/common";

import { ClasesAdminService } from "./clases.service.Admin";
import { CreateClaseDto } from "./dto/create-clase..Admin.dto";
import { CreateProfesorDto } from "./dto/create-profesor.Admin.dto";

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

  @Get("profesores/con-disponibilidad")
  async findProfesoresConDisponibilidad() {
    return this.clasesService.getProfesoresConDisponibilidad();
  }

  @Get("profesores/disponibles")
  async findProfesoresDisponibles(
    @Query("fecha") fecha?: string,
    @Query("hora") hora?: string
  ) {
    if (!fecha || !hora) {
      throw new BadRequestException(
        "Los parámetros fecha y hora son obligatorios"
      );
    }
    return this.clasesService.getProfesoresDisponibles(fecha, hora);
  }

  @Get("profesores")
  async findProfesores() {
    return this.clasesService.getProfesores();
  }

  @Post()
  async create(@Body() payload: CreateClaseDto) {
    return this.clasesService.create(payload as any);
  }

  @Post("profesores")
  async cargarProfesor(@Body() payload: CreateProfesorDto) {
    return this.clasesService.cargarProfesor(payload);
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

  @Delete("profesores/:id")
  async eliminarProfesor(@Param("id", ParseIntPipe) id: number) {
    return this.clasesService.eliminarProfesor(id);
  }
}