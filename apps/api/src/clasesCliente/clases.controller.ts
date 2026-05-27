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

  @Post(":id/turnos")
  async createTurno(@Param("id") id: string, @Body() dto: CreateTurnoDto) {
    const claseId = Number(id);
    if (Number.isNaN(claseId)) {
      throw new BadRequestException("Invalid clase id");
    }

    return this.clasesService.createTurno(claseId, dto);
  }
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
}