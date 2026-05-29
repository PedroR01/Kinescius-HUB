import { Module } from "@nestjs/common";
import { ClasesController } from "./clases.controller";
import { ClasesService } from "./clases.service";
import { SupabaseModule } from "../integrations/supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  controllers: [ClasesController],
  providers: [ClasesService]
})
export class ClasesModule {}