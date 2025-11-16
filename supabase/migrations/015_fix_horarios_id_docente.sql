-- Migration: Fix horarios with null id_docente
-- This migration corrects horarios that have id_docente null but should have it from the associated class

-- Corregir horarios que tienen id_docente null pero la clase tiene docente asignado
UPDATE horarios h
SET id_docente = c.id_docente_asignado
FROM clases c
WHERE h.id_clase = c.id_clase
  AND h.id_docente IS NULL
  AND c.id_docente_asignado IS NOT NULL;

-- Comentario explicativo
COMMENT ON COLUMN horarios.id_docente IS 'ID del docente asignado. Si es null, se debe verificar id_docente_asignado de la clase asociada.';

