import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SupabaseModule } from "./integrations/supabase/supabase.module";
import { ClasesModule } from "./clases/clases.module";
import { PagosModule } from "./pagos/pagos.module";
import { MpCheckoutProModule } from "./integrations/mercado-pago/mp-checkoutPro.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 60 }]
    }),
    SupabaseModule,
    MpCheckoutProModule,
    ClasesModule,
    PagosModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
