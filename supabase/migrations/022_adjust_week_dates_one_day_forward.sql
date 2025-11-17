-- Migration: Adjust all week dates one day forward
-- Date: 2025-11-16
-- Reason: All weeks need to be shifted one day forward (Monday to Friday)
-- Tomorrow is Monday, November 17, 2025 in Venezuela

-- ============================================
-- UPDATE LAPSOS DATES (Move start dates one day forward)
-- ============================================

-- I Lapso: Move from 2025-09-09 to 2025-09-08
UPDATE lapsos
SET fecha_inicio = '2025-09-08',
    fecha_fin = '2025-12-19',  -- Also move end date one day forward
    updated_at = NOW()
WHERE ano_escolar = '2025-2026' AND lapso = 'I Lapso';

-- II Lapso: Move from 2026-01-06 to 2026-01-05
UPDATE lapsos
SET fecha_inicio = '2026-01-05',
    fecha_fin = '2026-03-28',  -- Also move end date one day forward
    updated_at = NOW()
WHERE ano_escolar = '2025-2026' AND lapso = 'II Lapso';

-- III Lapso: Move from 2026-04-13 to 2026-04-12
UPDATE lapsos
SET fecha_inicio = '2026-04-12',
    fecha_fin = '2026-07-25',  -- Also move end date one day forward
    updated_at = NOW()
WHERE ano_escolar = '2025-2026' AND lapso = 'III Lapso';

-- ============================================
-- REGENERATE WEEKS FOR ALL LAPSOS
-- ============================================
-- The trigger will automatically regenerate weeks when dates are updated
-- But we'll also call the function explicitly to ensure it happens

DO $$
DECLARE
  lapso_rec RECORD;
BEGIN
  -- Regenerate weeks for all active lapsos
  FOR lapso_rec IN 
    SELECT id_lapso FROM lapsos 
    WHERE ano_escolar = '2025-2026' AND activo = true
  LOOP
    PERFORM generar_semanas_lapso(lapso_rec.id_lapso);
  END LOOP;
  
  RAISE NOTICE 'Semanas regeneradas para todos los lapsos del año 2025-2026';
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this migration, all weeks should be shifted one day forward
-- Example: Week 1 should now be 8-12 Sep, 2025 instead of 7-11 Sep, 2025
-- All weeks will be Monday to Friday

