-- Migration: Create tareas_coordinador table for to-do list functionality
-- This migration creates a table for coordinator tasks/to-do items

-- ============================================
-- TABLE: tareas_coordinador (Coordinator Tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS tareas_coordinador (
  id_tarea UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  completada BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_completada TIMESTAMPTZ,
  prioridad TEXT DEFAULT 'Normal' CHECK (prioridad IN ('Baja', 'Normal', 'Alta', 'Urgente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tareas_usuario ON tareas_coordinador(id_usuario);
CREATE INDEX IF NOT EXISTS idx_tareas_completada ON tareas_coordinador(completada);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_creacion ON tareas_coordinador(fecha_creacion);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE tareas_coordinador ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: tareas_coordinador
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own tasks" ON tareas_coordinador;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tareas_coordinador;
DROP POLICY IF EXISTS "Coordinadores can read all tasks" ON tareas_coordinador;

-- Users can read their own tasks
CREATE POLICY "Users can read their own tasks" ON tareas_coordinador
  FOR SELECT TO authenticated
  USING (id_usuario = auth.uid());

-- Users can manage their own tasks
CREATE POLICY "Users can manage their own tasks" ON tareas_coordinador
  FOR ALL TO authenticated
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

-- Coordinadores and directivos can read all tasks
CREATE POLICY "Coordinadores can read all tasks" ON tareas_coordinador
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- ============================================
-- TRIGGERS: Update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_tareas_coordinador_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.completada = true AND OLD.completada = false THEN
    NEW.fecha_completada = NOW();
  ELSIF NEW.completada = false THEN
    NEW.fecha_completada = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tareas_coordinador_updated_at ON tareas_coordinador;
CREATE TRIGGER update_tareas_coordinador_updated_at
  BEFORE UPDATE ON tareas_coordinador
  FOR EACH ROW
  EXECUTE FUNCTION update_tareas_coordinador_updated_at();

