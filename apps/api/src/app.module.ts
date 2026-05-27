/*import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SupabaseModule } from "./integrations/supabase.module";
import { ClasesModule } from "./clasesCliente/clases.module";
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ListaEsperaModule } from "./listaEspera/listaEspera.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 60 }]
    }),
    SupabaseModule,
    ClasesModule,
    AuthModule,
    ClasesModule,
    EmailModule,
    ListaEsperaModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}*/

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SupabaseModule } from "./integrations/supabase.module";
import { ClasesModule } from "./clasesCliente/clases.module";
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ListaEsperaModule } from "./listaEspera/listaEspera.module";
import { ShiftsModule } from "./shifts/shifts.module";           // 👈
import { ConfirmarTurnoModule } from "./confirmarTurno/confirmarTurno.module"; // 👈

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 60 }]
    }),
    SupabaseModule,
    AuthModule,
    ClasesModule,
    EmailModule,
    ListaEsperaModule,
    ShiftsModule,           // 👈
    ConfirmarTurnoModule,   // 👈
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
