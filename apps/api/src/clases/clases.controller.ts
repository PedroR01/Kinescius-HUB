import { Controller, Get, Post, Body, Query } from "@nestjs/common";
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

  @Post()
  async create(@Body() payload: CreateClaseDto) {
    return this.clasesService.create(payload as any);
  }
}
