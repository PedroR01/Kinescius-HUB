// Importo Module de NestJS para poder definir un módulo
import { Module } from '@nestjs/common';

// Controller y service propios del feature
import { LibroQuejasController } from './libroQuejas.controller';
import { LibroQuejasService } from './libroQuejas.service';

// Necesario para que LibroQuejasService pueda inyectar SupabaseService
import { SupabaseModule } from '../integrations/supabase/supabase.module';

// Necesario para que LibroQuejasController pueda inyectar RecordatoriosService
// (mismo patrón que usa ShiftsModule para el chequeo de auth)
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SupabaseModule,
    NotificationsModule,
  ],
  controllers: [LibroQuejasController],
  providers: [LibroQuejasService],
})
export class LibroQuejasModule {}