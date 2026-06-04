import { Module } from "@nestjs/common";
import { PagosController } from "./pagos.controller";
import { PagosService } from "./pagos.service";
import { ReembolsoService } from "./reembolso.service";

@Module({
  controllers: [PagosController],
  providers: [PagosService, ReembolsoService],
  exports: [PagosService, ReembolsoService],
})
export class PagosModule { }
