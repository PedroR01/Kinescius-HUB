import { Module } from '@nestjs/common';
import { RecordatoriosService } from './shifts-reminders.service';
import { RecordatoriosController } from './recordatorios.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [RecordatoriosController],
  providers: [RecordatoriosService],
  exports: [RecordatoriosService]
})
export class NotificationsModule {}
