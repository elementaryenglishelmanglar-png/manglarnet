-- Migration: Create calendar events table
-- This migration creates the table for calendar events in ManglarNet

-- ============================================
-- TABLE: eventos_calendario (Calendar Events)
-- ============================================
CREATE TABLE IF NOT EXISTS eventos_calendario (
  id_evento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('Actividades Generales', 'Actos Cívicos', 'Entregas Administrativas', 'Reuniones de Etapa')),
  nivel_educativo TEXT[] DEFAULT '{}', -- Array: ['Preescolar', 'Primaria', 'Bachillerato']
  color TEXT, -- Color hexadecimal para el evento
  todo_dia BOOLEAN DEFAULT false,
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos_calendario(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_fin ON eventos_calendario(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos_calendario(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_creado_por ON eventos_calendario(creado_por);

-- Enable RLS (Row Level Security)
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read events
CREATE POLICY "Allow authenticated users to read calendar events"
  ON eventos_calendario
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow directivos and coordinadores to insert events
CREATE POLICY "Allow directivos and coordinadores to insert events"
  ON eventos_calendario
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE authorized_users.email = auth.jwt() ->> 'email'
      AND authorized_users.role IN ('directivo', 'coordinador')
    )
  );

-- Allow directivos and coordinadores to update events
CREATE POLICY "Allow directivos and coordinadores to update events"
  ON eventos_calendario
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE authorized_users.email = auth.jwt() ->> 'email'
      AND authorized_users.role IN ('directivo', 'coordinador')
    )
  );

-- Allow directivos and coordinadores to delete events
CREATE POLICY "Allow directivos and coordinadores to delete events"
  ON eventos_calendario
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE authorized_users.email = auth.jwt() ->> 'email'
      AND authorized_users.role IN ('directivo', 'coordinador')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_eventos_calendario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_eventos_calendario_updated_at
  BEFORE UPDATE ON eventos_calendario
  FOR EACH ROW
  EXECUTE FUNCTION update_eventos_calendario_updated_at();

