ALTER TABLE "Se_inscribe"
  ADD COLUMN IF NOT EXISTS asistio     boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asistio_at  timestamptz;
