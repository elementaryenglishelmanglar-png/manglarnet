-- Migration: 045_create_pedagogical_intelligence_tables.sql
-- Description: Adds table for "Pedagogical Intelligence" data (qualitative/contextual).
--              Stores per-student summary data for each evaluation minute.

-- ============================================
-- TABLE: resumen_evaluacion_alumno
-- ============================================
-- Stores the "soft data" for a student in a specific evaluation minute
CREATE TABLE IF NOT EXISTS resumen_evaluacion_alumno (
  id_resumen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_minuta UUID NOT NULL REFERENCES minutas_evaluacion(id_minuta) ON DELETE CASCADE,
  id_alumno UUID NOT NULL REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  
  -- Quantitative Snapshot (Redundant but useful for fast querying/analytics without joining JSONB)
  nota TEXT, 
  
  -- Pedagogical Intelligence Fields
  asistencia_periodo INTEGER CHECK (asistencia_periodo BETWEEN 0 AND 100), -- % of absence
  nivel_independencia TEXT CHECK (nivel_independencia IN ('Autónomo', 'Apoyo Parcial', 'Apoyo Constante', 'No Logrado')),
  estado_emocional TEXT CHECK (estado_emocional IN ('Enfocado', 'Ansioso/Nervioso', 'Distraído', 'Apatía/Desinterés', 'Cansado', 'Participativo')),
  eficacia_accion_anterior TEXT CHECK (eficacia_accion_anterior IN ('Resuelto', 'En Proceso', 'Ineficaz', 'No Aplica')),
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one summary per student per minute
  UNIQUE(id_minuta, id_alumno)
);

CREATE INDEX IF NOT EXISTS idx_resumen_minuta ON resumen_evaluacion_alumno(id_minuta);
CREATE INDEX IF NOT EXISTS idx_resumen_alumno ON resumen_evaluacion_alumno(id_alumno);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
-- Since we disabled RLS globally in migration 044, we just create the table.
-- If RLS were active, we would add policies here. 
-- For consistency with future re-enabling, we can define them but they won't be enforced if table RLS is disabled.

ALTER TABLE resumen_evaluacion_alumno ENABLE ROW LEVEL SECURITY;

-- Policy: Allow ALL for authenticated users (matching current permissive state)
CREATE POLICY "Authenticated users can manage resumen_evaluacion_alumno" ON resumen_evaluacion_alumno
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_resumen_evaluacion_alumno_updated_at
  BEFORE UPDATE ON resumen_evaluacion_alumno
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE resumen_evaluacion_alumno IS 'Stores qualitative pedagogical data (attendance, independence, emotion) per student per evaluation';
