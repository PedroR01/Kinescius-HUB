import { Module } from '@nestjs/common';
import { ConfirmarTurnoController } from './confirmar-turno.controller';
import { ConfirmarTurnoService } from './confirmar-turno.service';
import { NotificacionEsperaService } from './notificacion-espera.service';
import { SupabaseModule } from '../integrations/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ConfirmarTurnoController],
  providers: [ConfirmarTurnoService, NotificacionEsperaService],
  exports: [NotificacionEsperaService], // exportar para usarlo en ShiftsModule
})
export class ConfirmarTurnoModule {}