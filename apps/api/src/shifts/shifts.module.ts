//nico esto no lo tenias, lo cree yo

import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { SupabaseModule } from '../integrations/supabase/supabase.module';
import { ConfirmarTurnoModule } from '../confirmarTurno/confirmarTurno.module';

@Module({
  imports: [
    SupabaseModule,
    ConfirmarTurnoModule,
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule {}