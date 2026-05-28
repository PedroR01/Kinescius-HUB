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
