import { Controller, Get, Post, Body, Param, Query, BadRequestException } from "@nestjs/common";
import { ClasesService } from "./clases.service";
import { CreateTurnoDto } from "./dto/create-turno.dto";
import { InscribirConSaldoDto } from "./dto/inscribir-con-saldo.dto";

@Controller("clases")
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) { }

  @Get()
  async findAll(@Query("pasadas") pasadas?: string) {
    return this.clasesService.findAll(pasadas === "true");
  }

  @Get("cliente/:id/monto-a-favor")
  async getMontoAFavor(@Param("id") id: string) {
    const clienteId = Number(id);
    if (Number.isNaN(clienteId)) {
      throw new BadRequestException("Invalid cliente id");
    }
    return this.clasesService.getMontoAFavor(clienteId);
  }

  @Post("inscribir-con-saldo")
  async inscribirConSaldo(@Body() dto: InscribirConSaldoDto) {
    return this.clasesService.inscribirConSaldo(dto);
  }

  @Post(":id/turnos")
  async createTurno(@Param("id") id: string, @Body() dto: CreateTurnoDto) {
    const claseId = Number(id);
    if (Number.isNaN(claseId)) {
      throw new BadRequestException("Invalid clase id");
    }
    return this.clasesService.createTurno(claseId, dto);
  }
}