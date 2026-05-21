import { Controller, Get, Post, Body, Query, BadRequestException } from "@nestjs/common";
import { ClasesService } from "./clases.service";
import { CreateClaseDto } from "./dto/create-clase.dto";

@Controller("clases")
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

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
      throw new BadRequestException("Los parámetros fecha y clase son obligatorios");
    }

    return this.clasesService.getInscriptos(fecha, tipo);
  }

  @Post()
  async create(@Body() payload: CreateClaseDto) {
    return this.clasesService.create(payload as any);
  }
}
