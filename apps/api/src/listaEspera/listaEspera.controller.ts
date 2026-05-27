import {
  Controller,
  Get,
  Param,
  BadRequestException,
} from "@nestjs/common";

import { ListaEsperaService } from "./listaEspera.service";

@Controller("listaEspera")
export class ListaEsperaController {
  constructor(
    private readonly listaEsperaService: ListaEsperaService
  ) {}

  // Obtener todas las listas de espera
  @Get()
  async findAll() {
    return this.listaEsperaService.findAll();
  }

  // Obtener personas de la lista de espera de una clase
  @Get("clase/:id")
  async findByClase(@Param("id") id: string) {
    const claseId = Number(id);

    if (Number.isNaN(claseId)) {
      throw new BadRequestException(
        "Invalid clase id"
      );
    }

    return this.listaEsperaService.findByClase(
      claseId
    );
  }

  // Obtener cantidad de personas en lista de espera
  @Get("clase/:id/count")
  async countByClase(@Param("id") id: string) {
    const claseId = Number(id);

    if (Number.isNaN(claseId)) {
      throw new BadRequestException(
        "Invalid clase id"
      );
    }

    const count =
      await this.listaEsperaService.countByClase(
        claseId
      );

    return {
      claseId,
      count,
    };
  }
}