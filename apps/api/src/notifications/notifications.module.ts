import { Module } from '@nestjs/common';
import { RecordatoriosService } from './shifts-reminders.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [RecordatoriosService],
  exports: [RecordatoriosService]
})
export class NotificationsModule {}
