import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PresentismoService } from './verPresentismo.service';

@Controller('presentismo')
export class PresentismoController {
  constructor(private readonly presentismoService: PresentismoService) {}

  @Get('clase/:claseId')
  async getPorClase(@Param('claseId', ParseIntPipe) claseId: number) {
    return this.presentismoService.findByClase(claseId);
  }
}