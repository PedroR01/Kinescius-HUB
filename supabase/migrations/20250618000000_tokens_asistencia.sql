CREATE TABLE tokens_asistencia (
  token       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase    integer NOT NULL REFERENCES "Clase"(id) ON DELETE CASCADE,
  valid_from  timestamptz NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX tokens_asistencia_id_clase_idx ON tokens_asistencia (id_clase);
