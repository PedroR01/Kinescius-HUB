import { Module } from "@nestjs/common";
import { ListaEsperaController } from "./listaEspera.controller";
import { ListaEsperaService } from "./listaEspera.service";

@Module({
  controllers: [ListaEsperaController],
  providers: [ListaEsperaService]
})
export class ListaEsperaModule {}