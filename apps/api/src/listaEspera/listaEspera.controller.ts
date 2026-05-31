import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
} from "@nestjs/common";

import { ListaEsperaService } from "./listaEspera.service";

@Controller("listaEspera")
export class ListaEsperaController {
  constructor(
    private readonly listaEsperaService: ListaEsperaService
  ) {}

  @Get()
  async findAll() {
    return this.listaEsperaService.findAll();
  }

  @Get("clase/:id")
  async findByClase(@Param("id") id: string) {
    const claseId = Number(id);
    if (Number.isNaN(claseId)) {
      throw new BadRequestException("Invalid clase id");
    }
    return this.listaEsperaService.findByClase(claseId);
  }

  @Get("clase/:id/count")
  async countByClase(@Param("id") id: string) {
    const claseId = Number(id);
    if (Number.isNaN(claseId)) {
      throw new BadRequestException("Invalid clase id");
    }
    const count = await this.listaEsperaService.countByClase(claseId);
    return { claseId, count };
  }

  @Post("clase/:id/join")
  async joinListaEspera(
    @Param("id") id: string,
    @Body() body: { clienteId: number }
  ) {
    const claseId = Number(id);
    if (Number.isNaN(claseId)) {
      throw new BadRequestException("Invalid clase id");
    }
    return this.listaEsperaService.joinListaEspera(claseId, body.clienteId);
  }
}