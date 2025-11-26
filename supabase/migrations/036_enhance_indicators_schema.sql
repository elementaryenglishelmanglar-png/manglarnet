-- Migration: Enhance Indicators Schema
-- Description: Adds support for Routines and Hierarchical structure (Competency -> Indicators)
-- Date: 2025-01-24

-- 1. Add new columns to maestra_indicadores
ALTER TABLE maestra_indicadores
ADD COLUMN IF NOT EXISTS rutina TEXT, -- Ejemplo: "USE OF ENGLISH", "LISTENING", etc.
ADD COLUMN IF NOT EXISTS id_padre UUID REFERENCES maestra_indicadores(id_indicador) ON DELETE CASCADE;

-- 2. Create index for parent lookup
CREATE INDEX IF NOT EXISTS idx_maestra_indicadores_padre ON maestra_indicadores(id_padre);

-- 3. Comment on columns
COMMENT ON COLUMN maestra_indicadores.rutina IS 'Pedagogical routine or domain (e.g., USE OF ENGLISH)';
COMMENT ON COLUMN maestra_indicadores.id_padre IS 'Reference to the parent Competency (for Indicators)';
