import { Module } from "@nestjs/common";
import { PagosController } from "./pagos.controller";
import { PagosService } from "./pagos.service";
import { ReembolsoService } from "./reembolso.service";
import { AuthModule } from "src/auth/auth.module";

@Module({
  controllers: [PagosController],
  providers: [PagosService, ReembolsoService],
  exports: [PagosService, ReembolsoService],
  imports: [AuthModule],
})
export class PagosModule { }
