-- Migration: Add aula assignment to clases table
-- This allows each class to have an assigned classroom/aula

-- Add id_aula column to clases table
ALTER TABLE clases
ADD COLUMN IF NOT EXISTS id_aula UUID REFERENCES aulas(id_aula) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_clases_aula ON clases(id_aula);

-- Add comment to document the purpose
COMMENT ON COLUMN clases.id_aula IS 'Aula/salón asignado para esta clase. Puede ser null si no se ha asignado un aula específica.';

