/*import { Controller, Get, Post, Body, Param, BadRequestException } from "@nestjs/common";
import { ClasesService } from "./clases.service";
import { CreateTurnoDto } from "./dto/create-turno.dto";

@Controller("clases")
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Get()
  async findAll() {
    return this.clasesService.findAll();
  }

  @Get("cliente/:id/monto-a-favor")
  async getMontoAFavor(@Param("id") id: string) {
    const clienteId = Number(id);
    if (Number.isNaN(clienteId)) {
      throw new BadRequestException("Invalid cliente id");
    }
    return this.clasesService.getMontoAFavor(clienteId);
  }

  @Post(":id/turnos")
  async createTurno(@Param("id") id: string, @Body() dto: CreateTurnoDto) {
    const claseId = Number(id);
    if (Number.isNaN(claseId)) {
      throw new BadRequestException("Invalid clase id");
    }
    return this.clasesService.createTurno(claseId, dto);
  }
<<<<<<< HEAD
=======
}
*/

import { Controller, Get } from "@nestjs/common";
import { ClasesService } from "./clases.service";

@Controller("clases")
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Get()
  async findAll() {
    return this.clasesService.findAll();
  }
>>>>>>> b614010c6b7d86a3ec1058a2e7dfc54b883ec493
}