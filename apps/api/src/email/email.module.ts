// email.module.ts
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService] // <-- ESTO ES CLAVE
})
export class EmailModule {}