<<<<<<< HEAD
import { Module } from "@nestjs/common";
import { ClasesController } from "./clases.controller";
import { ClasesService } from "./clases.service";
import { SupabaseModule } from "../integrations/supabase.module";
=======
/*import { Module } from "@nestjs/common";
import { ClasesController } from "./clases.controller";
import { ClasesService } from "./clases.service";

@Module({
  controllers: [ClasesController],
  providers: [ClasesService]
})
export class ClasesModule {}*/

import { Module } from '@nestjs/common';
import { ClasesController } from './clases.controller';
import { ClasesService } from './clases.service';
import { SupabaseModule } from '../integrations/supabase.module';
>>>>>>> b614010c6b7d86a3ec1058a2e7dfc54b883ec493

@Module({
  imports: [SupabaseModule],
  controllers: [ClasesController],
<<<<<<< HEAD
  providers: [ClasesService]
=======
  providers: [ClasesService],
>>>>>>> b614010c6b7d86a3ec1058a2e7dfc54b883ec493
})
export class ClasesModule {}