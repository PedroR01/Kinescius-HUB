import { Controller, Get, Post, Body } from "@nestjs/common";
import { ClasesService } from "./clases.service";
import { CreateClaseDto } from "./dto/create-clase.dto";

@Controller("clases")
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Get()
  async findAll() {
    return this.clasesService.findAll();
  }

  @Post()
  async create(@Body() payload: CreateClaseDto) {
    return this.clasesService.create(payload as any);
  }
}
