-- Migration: Remove unwanted aulas
-- This migration removes specific aulas that are no longer needed
-- Date: 2025-11-16

-- ============================================
-- STEP 1: Remove references from clases table
-- ============================================
-- Set id_aula to NULL in clases table for the unwanted aulas
UPDATE clases
SET id_aula = NULL
WHERE id_aula IN (
  SELECT id_aula FROM aulas 
  WHERE nombre IN (
    'Aula 101',
    'Aula 102',
    'Aula 103',
    'Aula 104',
    'Aula 105',
    'Aula 201',
    'Aula 202',
    'Aula 203',
    'Auditorio',
    'Biblioteca',
    'Gimnasio'
  )
);

-- ============================================
-- STEP 2: Remove references from asignacion_aula_nivel_ingles
-- ============================================
DELETE FROM asignacion_aula_nivel_ingles
WHERE id_aula IN (
  SELECT id_aula FROM aulas 
  WHERE nombre IN (
    'Aula 101',
    'Aula 102',
    'Aula 103',
    'Aula 104',
    'Aula 105',
    'Aula 201',
    'Aula 202',
    'Aula 203',
    'Auditorio',
    'Biblioteca',
    'Gimnasio'
  )
);

-- ============================================
-- STEP 3: Remove references from horarios (if id_aula column exists)
-- ============================================
-- Check if horarios has id_aula column and update if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'horarios' AND column_name = 'id_aula'
  ) THEN
    UPDATE horarios
    SET id_aula = NULL
    WHERE id_aula IN (
      SELECT id_aula FROM aulas 
      WHERE nombre IN (
        'Aula 101',
        'Aula 102',
        'Aula 103',
        'Aula 104',
        'Aula 105',
        'Aula 201',
        'Aula 202',
        'Aula 203',
        'Auditorio',
        'Biblioteca',
        'Gimnasio'
      )
    );
  END IF;
END $$;

-- ============================================
-- STEP 4: Delete the unwanted aulas
-- ============================================
-- Delete the following aulas:
-- - Aula 101, 102, 103, 104, 105, 201, 202, 203
-- - Auditorio
-- - Biblioteca
-- - Gimnasio

DELETE FROM aulas 
WHERE nombre IN (
  'Aula 101',
  'Aula 102',
  'Aula 103',
  'Aula 104',
  'Aula 105',
  'Aula 201',
  'Aula 202',
  'Aula 203',
  'Auditorio',
  'Biblioteca',
  'Gimnasio'
);

