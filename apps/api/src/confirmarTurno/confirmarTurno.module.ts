import { Module } from '@nestjs/common';
import { ConfirmarTurnoController } from './confirmar-turno.controller';
import { ConfirmarTurnoService } from './confirmar-turno.service';
import { NotificacionEsperaService } from './notificacion-espera.service';
import { SupabaseModule } from '../integrations/supabase/supabase.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SupabaseModule, EmailModule],
  controllers: [ConfirmarTurnoController],
  providers: [ConfirmarTurnoService, NotificacionEsperaService],
  exports: [NotificacionEsperaService], // exportar para usarlo en ShiftsModule
})
export class ConfirmarTurnoModule {}