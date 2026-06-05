/**
 * Diagnóstico MP: token, pagos recientes en BD y prueba de GET payment/refunds.
 * Uso: node scripts/diagnose-mp-refund.mjs [paymentId]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const token = process.env.MP_ACCESS_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function tokenKind(value) {
  if (!value) return 'MISSING';
  if (value.startsWith('TEST-')) return 'TEST_APP';
  if (value.startsWith('APP_USR-')) return 'APP_USR_PRODUCTION_FORMAT';
  return 'UNKNOWN';
}

function formatMpError(err) {
  if (!err || typeof err !== 'object') return String(err);
  return JSON.stringify(
    {
      message: err.message,
      status: err.status,
      error: err.error,
      cause: err.cause,
    },
    null,
    2,
  );
}

async function main() {
  const paymentIdArg = process.argv[2];

  console.log('--- MP diagnóstico ---');
  console.log('Token tipo:', tokenKind(token));
  console.log('Token prefijo:', token ? `${token.slice(0, 12)}...` : 'N/A');

  if (!token) {
    console.error('MP_ACCESS_TOKEN no definido en apps/api/.env');
    process.exit(1);
  }

  const client = new MercadoPagoConfig({ accessToken: token });

  try {
    const meRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();
    if (!meRes.ok) {
      console.log('\n/users/me FALLÓ:', meRes.status, JSON.stringify(me, null, 2));
    } else {
      console.log('\n/users/me OK');
      console.log('  user id:', me.id);
      console.log('  nickname:', me.nickname);
      console.log('  tags:', me.tags);
    }
  } catch (e) {
    console.log('\n/users/me error:', e.message);
  }

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('Se_inscribe')
      .select('id_cliente, id_clase, id_pago_mp, monto_a_favor, estado, reembolsado_at')
      .not('id_pago_mp', 'is', null)
      .order('id_clase', { ascending: false })
      .limit(5);

    if (error) {
      console.log('\nSupabase inscripciones:', error.message);
    } else {
      console.log('\nÚltimas inscripciones con id_pago_mp (máx 5):');
      for (const row of data ?? []) {
        console.log(
          `  clase=${row.id_clase} cliente=${row.id_cliente} mp=${row.id_pago_mp} a_favor=${row.monto_a_favor} estado=${row.estado}`,
        );
      }
    }
  }

  const paymentId =
    paymentIdArg ||
    (await (async () => {
      if (!supabaseUrl || !supabaseKey) return null;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from('Se_inscribe')
        .select('id_pago_mp')
        .not('id_pago_mp', 'is', null)
        .limit(1)
        .maybeSingle();
      return data?.id_pago_mp ?? null;
    })());

  if (!paymentId) {
    console.log('\nSin paymentId (pasá uno: node scripts/diagnose-mp-refund.mjs <id>)');
    return;
  }

  console.log('\n--- Pago', paymentId, '---');
  const paymentClient = new Payment(client);

  try {
    const payment = await paymentClient.get({ id: paymentId });
    console.log('GET payment OK');
    console.log('  status:', payment.status);
    console.log('  live_mode:', payment.live_mode);
    console.log('  transaction_amount:', payment.transaction_amount);
    console.log('  collector_id:', payment.collector_id);
  } catch (err) {
    console.log('GET payment FALLÓ:');
    console.log(formatMpError(err));
    return;
  }

  const refundClient = new PaymentRefund(client);
  try {
    const refunds = await refundClient.list({ payment_id: paymentId });
    console.log('LIST refunds OK, cantidad:', Array.isArray(refunds) ? refunds.length : refunds);
  } catch (err) {
    console.log('LIST refunds FALLÓ:');
    console.log(formatMpError(err));
  }

  try {
    const refund = await refundClient.create({
      payment_id: paymentId,
      body: { amount: 1 },
      requestOptions: { idempotencyKey: `diag-${Date.now()}` },
    });
    console.log('CREATE refund (1 ARS test) OK — id:', refund?.id);
    console.log('  (reembolso parcial mínimo para probar permisos; revisá en panel MP)');
  } catch (err) {
    console.log('CREATE refund FALLÓ:');
    console.log(formatMpError(err));
    if (getMercadoPagoCauseCode(err) === 7) {
      console.log(
        '\n→ Con cuenta test_user, MP bloquea reembolsos. En la API local se simulan automáticamente',
      );
      console.log(
        '  (ver MpAccountService / MP_SIMULATE_REFUNDS en apps/api/.env).',
      );
    }
  }
}

function getMercadoPagoCauseCode(err) {
  const raw = err?.cause?.[0]?.code;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
