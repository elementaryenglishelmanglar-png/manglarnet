-- Migration: Add lapso and ano_escolar to horarios table
-- This migration adds lapso and ano_escolar columns to link horarios with academic periods

-- ============================================
-- ADD COLUMNS TO horarios
-- ============================================
ALTER TABLE horarios
ADD COLUMN IF NOT EXISTS lapso TEXT CHECK (lapso IN ('I Lapso', 'II Lapso', 'III Lapso')),
ADD COLUMN IF NOT EXISTS ano_escolar TEXT;

-- ============================================
-- UPDATE EXISTING HORARIOS
-- ============================================
-- Actualizar horarios existentes con año escolar por defecto
-- Nota: Los horarios existentes no tendrán lapso asignado, se deberá asignar manualmente o mediante migración de datos
UPDATE horarios
SET ano_escolar = '2025-2026'
WHERE ano_escolar IS NULL;

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_horarios_ano_lapso_semana ON horarios(ano_escolar, lapso, semana);
CREATE INDEX IF NOT EXISTS idx_horarios_ano ON horarios(ano_escolar);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN horarios.lapso IS 'Lapso académico al que pertenece este horario (I Lapso, II Lapso, III Lapso)';
COMMENT ON COLUMN horarios.ano_escolar IS 'Año escolar al que pertenece este horario (ej: 2025-2026)';

