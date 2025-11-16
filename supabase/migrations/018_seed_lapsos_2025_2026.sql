-- Migration: Seed lapsos for academic year 2025-2026
-- This migration creates the three lapsos for 2025-2026 with their dates and generates weeks

-- ============================================
-- INSERT LAPSOS FOR 2025-2026
-- ============================================
INSERT INTO lapsos (ano_escolar, lapso, fecha_inicio, fecha_fin, semanas_totales, activo)
VALUES
  ('2025-2026', 'I Lapso', '2025-09-09', '2025-12-18', 15, true),
  ('2025-2026', 'II Lapso', '2026-01-06', '2026-03-27', 12, true),
  ('2025-2026', 'III Lapso', '2026-04-13', '2026-07-24', 15, true)
ON CONFLICT (ano_escolar, lapso) DO UPDATE
SET fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_fin = EXCLUDED.fecha_fin,
    semanas_totales = EXCLUDED.semanas_totales,
    activo = EXCLUDED.activo,
    updated_at = NOW();

-- ============================================
-- GENERATE WEEKS FOR EACH LAPSO
-- ============================================
-- Las semanas se generarán automáticamente mediante el trigger
-- Pero podemos ejecutar manualmente para asegurar que se generen
DO $$
DECLARE
  lapso_id UUID;
BEGIN
  -- I Lapso
  SELECT id_lapso INTO lapso_id FROM lapsos WHERE ano_escolar = '2025-2026' AND lapso = 'I Lapso';
  IF lapso_id IS NOT NULL THEN
    PERFORM generar_semanas_lapso(lapso_id);
  END IF;
  
  -- II Lapso
  SELECT id_lapso INTO lapso_id FROM lapsos WHERE ano_escolar = '2025-2026' AND lapso = 'II Lapso';
  IF lapso_id IS NOT NULL THEN
    PERFORM generar_semanas_lapso(lapso_id);
  END IF;
  
  -- III Lapso
  SELECT id_lapso INTO lapso_id FROM lapsos WHERE ano_escolar = '2025-2026' AND lapso = 'III Lapso';
  IF lapso_id IS NOT NULL THEN
    PERFORM generar_semanas_lapso(lapso_id);
  END IF;
END $$;

