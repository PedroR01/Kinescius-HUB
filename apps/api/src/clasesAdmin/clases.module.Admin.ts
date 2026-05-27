import { Module } from "@nestjs/common";
import { ClasesController } from "./clases.controller.Admin";
import { ClasesService } from "./clases.service.Admin";

@Module({
  controllers: [ClasesController],
  providers: [ClasesService]
})
export class ClasesModule {}
