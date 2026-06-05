-- Reemplaza monto_mp / monto_saldo por booleano de forma de pago por inscripción.
ALTER TABLE "Se_inscribe"
  DROP COLUMN IF EXISTS monto_mp,
  DROP COLUMN IF EXISTS monto_saldo;

ALTER TABLE "Se_inscribe"
  ADD COLUMN IF NOT EXISTS monto_a_favor boolean NOT NULL DEFAULT false;
