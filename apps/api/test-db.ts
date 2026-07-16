import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const idCliente = 5; 
  console.log(`Buscando clases para el cliente ${idCliente}...`);
  
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  console.log('Fecha límite (hoy en arg):', today);

  const { data, error } = await supabase
    .from('Se_inscribe')
    .select(`
      id_cliente,
      id_clase,
      historial_estado,
      monto_a_favor,
      estado,
      Clase!inner (
        id,
        fecha,
        hora,
        estado
      )
    `)
    .eq('id_cliente', idCliente)
    .or('historial_estado.eq.Activa,historial_estado.is.null,historial_estado.eq.Completada');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total de clases (Activa/null/Completada):', data.length);
  data.forEach((d: any) => console.log(`- Clase ${d.id_clase} (${d.Clase.fecha}): historial=${d.historial_estado}, Clase.estado=${d.Clase.estado}`));
}

test();
