import { Module } from "@nestjs/common";
import { ClasesAdminController } from "./clases.controller.Admin";
import { ClasesAdminService } from "./clases.service.Admin";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule],
  controllers: [ClasesAdminController],
  providers: [ClasesAdminService]
})
export class ClasesModule {}