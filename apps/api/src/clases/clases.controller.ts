import { Controller, Get, Headers } from "@nestjs/common";
import { ClasesService } from "./clases.service";

@Controller("clases")
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) { }

  @Get()
  async findAll() {
    return this.clasesService.findAll();
  }

  @Get('profesor/mis-clases')
  obtenerClasesProfesor(@Headers('authorization') authHeader: string) {
    return this.clasesService.obtenerClasesProfesor(authHeader);
  }
}
