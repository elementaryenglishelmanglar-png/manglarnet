-- Migration: 046_refine_pedagogical_data.sql
-- Description: Refines pedagogical intelligence data structures based on user feedback.
--              1. Changes attendance from % to count of absences.
--              2. Changes indicator achievement level from 1-5 to A-E.

-- ============================================
-- 1. Refine resumen_evaluacion_alumno
-- ============================================

-- Drop the old percentage check constraint FIRST to avoid conflicts
ALTER TABLE resumen_evaluacion_alumno 
  DROP CONSTRAINT IF EXISTS resumen_evaluacion_alumno_asistencia_periodo_check;

-- Rename asistencia_periodo to inasistencias
-- Note: If the column was already renamed in a failed run, this might error if not handled.
-- But standard migration practice assumes linear success. 
-- We can check if column exists but for now standard alter is fine.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='resumen_evaluacion_alumno' AND column_name='asistencia_periodo') THEN
    ALTER TABLE resumen_evaluacion_alumno RENAME COLUMN asistencia_periodo TO inasistencias;
  END IF;
END $$;

-- Add new check constraint for inasistencias (must be >= 0)
-- Drop it first just in case it was partially created
ALTER TABLE resumen_evaluacion_alumno 
  DROP CONSTRAINT IF EXISTS resumen_evaluacion_alumno_inasistencias_check;

ALTER TABLE resumen_evaluacion_alumno 
  ADD CONSTRAINT resumen_evaluacion_alumno_inasistencias_check CHECK (inasistencias >= 0);

COMMENT ON COLUMN resumen_evaluacion_alumno.inasistencias IS 'Count of absences during the period';


-- ============================================
-- 2. Refine detalle_evaluacion_alumno
-- ============================================

-- CRITICAL FIX: Drop the old integer constraint (1-5) BEFORE changing type to TEXT
-- Otherwise Postgres tries to validate 'text' >= 1 which fails.
ALTER TABLE detalle_evaluacion_alumno 
  DROP CONSTRAINT IF EXISTS detalle_evaluacion_alumno_nivel_logro_check;

-- Change nivel_logro from INTEGER to TEXT to support 'A', 'B', 'C', 'D', 'E'
ALTER TABLE detalle_evaluacion_alumno 
  ALTER COLUMN nivel_logro TYPE TEXT;

-- Add new check constraint for valid grades
ALTER TABLE detalle_evaluacion_alumno 
  ADD CONSTRAINT detalle_evaluacion_alumno_nivel_logro_check CHECK (nivel_logro IN ('A', 'B', 'C', 'D', 'E'));

COMMENT ON COLUMN detalle_evaluacion_alumno.nivel_logro IS 'Achievement level: A, B, C, D, E';
