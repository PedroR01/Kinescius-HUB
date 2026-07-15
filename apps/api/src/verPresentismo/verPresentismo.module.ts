import { Module } from '@nestjs/common';
import { PresentismoController } from './verPresentismo.controller';
import { PresentismoService } from './verPresentismo.service';

// SupabaseService se inyecta sin importar SupabaseModule acá porque
// SupabaseModule se importa una sola vez en AppModule y es @Global()
// (mismo patrón que ListaEsperaModule y AsistenciaModule).
@Module({
  controllers: [PresentismoController],
  providers: [PresentismoService],
})
export class PresentismoModule {}