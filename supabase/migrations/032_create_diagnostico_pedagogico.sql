-- Migration: Create Clinical-Pedagogical Diagnostic System
-- This migration adds tables for detailed indicator-based student assessment
-- without breaking existing evaluation functionality

-- ============================================
-- TABLE: maestra_indicadores (Master Indicators)
-- ============================================
-- Stores specific indicators for each subject/class
-- Example: "Utiliza técnicas de cálculo mental", "Resuelve problemas de lógica"
CREATE TABLE IF NOT EXISTS maestra_indicadores (
  id_indicador UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase UUID NOT NULL REFERENCES clases(id_clase) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('Competencia', 'Indicador')),
  descripcion TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maestra_indicadores_clase ON maestra_indicadores(id_clase);
CREATE INDEX IF NOT EXISTS idx_maestra_indicadores_activo ON maestra_indicadores(activo);

-- ============================================
-- TABLE: detalle_evaluacion_alumno (Student Evaluation Detail)
-- ============================================
-- Stores the "clinical x-ray" of each student's performance per indicator
CREATE TABLE IF NOT EXISTS detalle_evaluacion_alumno (
  id_detalle UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_minuta UUID NOT NULL REFERENCES minutas_evaluacion(id_minuta) ON DELETE CASCADE,
  id_alumno UUID NOT NULL REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  id_indicador UUID NOT NULL REFERENCES maestra_indicadores(id_indicador) ON DELETE CASCADE,
  nivel_logro INTEGER NOT NULL CHECK (nivel_logro BETWEEN 1 AND 5),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_minuta, id_alumno, id_indicador)
);

CREATE INDEX IF NOT EXISTS idx_detalle_minuta ON detalle_evaluacion_alumno(id_minuta);
CREATE INDEX IF NOT EXISTS idx_detalle_alumno ON detalle_evaluacion_alumno(id_alumno);
CREATE INDEX IF NOT EXISTS idx_detalle_indicador ON detalle_evaluacion_alumno(id_indicador);

-- ============================================
-- EXTEND: minutas_evaluacion (Add "soft data" fields)
-- ============================================
-- Add columns for attitude and adaptation data
-- These are NULL-safe to maintain backward compatibility
ALTER TABLE minutas_evaluacion 
  ADD COLUMN IF NOT EXISTS nivel_independencia TEXT CHECK (nivel_independencia IN ('Autónomo', 'Apoyo Parcial', 'Apoyo Total', NULL)),
  ADD COLUMN IF NOT EXISTS estado_emocional TEXT CHECK (estado_emocional IN ('Enfocado', 'Ansioso', 'Distraído', 'Participativo', NULL)),
  ADD COLUMN IF NOT EXISTS eficacia_accion_anterior TEXT CHECK (eficacia_accion_anterior IN ('Resuelto', 'En Proceso', 'Ineficaz', NULL));

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE maestra_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_evaluacion_alumno ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: maestra_indicadores
-- ============================================
CREATE POLICY "Authenticated users can read maestra_indicadores" ON maestra_indicadores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage maestra_indicadores" ON maestra_indicadores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  );

-- ============================================
-- RLS POLICIES: detalle_evaluacion_alumno
-- ============================================
CREATE POLICY "Authenticated users can read detalle_evaluacion_alumno" ON detalle_evaluacion_alumno
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage detalle_evaluacion_alumno" ON detalle_evaluacion_alumno
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  );

-- ============================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_maestra_indicadores_updated_at
  BEFORE UPDATE ON maestra_indicadores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detalle_evaluacion_alumno_updated_at
  BEFORE UPDATE ON detalle_evaluacion_alumno
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE maestra_indicadores IS 'Master table of pedagogical indicators for each class/subject';
COMMENT ON TABLE detalle_evaluacion_alumno IS 'Detailed assessment of student performance per indicator (1-5 scale for radar charts)';
COMMENT ON COLUMN minutas_evaluacion.nivel_independencia IS 'Student independence level: Autonomous, Partial Support, Total Support';
COMMENT ON COLUMN minutas_evaluacion.estado_emocional IS 'Student emotional state during evaluation';
COMMENT ON COLUMN minutas_evaluacion.eficacia_accion_anterior IS 'Effectiveness of previous pedagogical actions';
