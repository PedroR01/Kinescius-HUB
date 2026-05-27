import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from '../integrations/supabase.service'; // Asegurate de que la ruta sea correcta
import { EmailModule } from 'src/email/email.module';

//Acá declaramos los controladores y archivos de servicios que vamos a usar para que NestJS los reconozca
@Module({
  imports: [EmailModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService],
})
export class AuthModule {}