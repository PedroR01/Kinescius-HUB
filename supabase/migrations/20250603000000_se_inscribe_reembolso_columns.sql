ALTER TABLE "Se_inscribe"
  ADD COLUMN IF NOT EXISTS id_pago_mp text,
  ADD COLUMN IF NOT EXISTS monto_mp numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_saldo numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reembolsado_at timestamptz;
