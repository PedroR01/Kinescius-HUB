// Importo Module de NestJS para poder definir un módulo
// Un módulo en NestJS sirve para organizar controller + service + dependencias
import { Module } from '@nestjs/common';

// Importo el controller que maneja las rutas HTTP del libro de quejas
import { LibroQuejasController } from './libroQuejas.controller';

// Importo el service donde está toda la lógica de negocio
import { LibroQuejasService } from './libroQuejas.service';

// Si ya tenés un módulo compartido (por ejemplo IntegrationsModule)
// que exporta SupabaseService, lo ideal es importarlo acá en vez de redeclararlo
//
// import { IntegrationsModule } from '../integrations/integrations.module';

// Defino el módulo de Libro de Quejas
@Module({
  // imports: acá irían otros módulos que este necesita
  // por ejemplo un módulo de integraciones o config si usás Supabase centralizado
  // imports: [IntegrationsModule],

  // controllers: define qué controllers pertenecen a este módulo
  // son los que exponen las rutas HTTP
  controllers: [LibroQuejasController],

  // providers: acá van los services o providers que usa este módulo
  // Nest los inyecta automáticamente donde haga falta
  providers: [LibroQuejasService],
})

// Clase del módulo
// No tiene lógica propia, solo organiza la estructura del feature
export class LibroQuejasModule {}