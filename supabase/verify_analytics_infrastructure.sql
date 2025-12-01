-- Test Script: verify_analytics_infrastructure.sql
-- Description: Comprehensive tests for The Red Bull Suite analytics infrastructure
-- Run this after executing migrations 046 and 047

-- ============================================
-- TEST 1: Verify Tables Exist
-- ============================================
DO $$
DECLARE
  v_tables_missing TEXT[] := '{}';
  v_table TEXT;
BEGIN
  RAISE NOTICE '=== TEST 1: Verifying Tables ===';
  
  FOREACH v_table IN ARRAY ARRAY['historico_promedios', 'notificaciones_inteligentes', 'cache_analisis_sentimiento']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      v_tables_missing := array_append(v_tables_missing, v_table);
    END IF;
  END LOOP;
  
  IF array_length(v_tables_missing, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(v_tables_missing, ', ');
  ELSE
    RAISE NOTICE '✓ All tables exist';
  END IF;
END $$;

-- ============================================
-- TEST 2: Verify Function calculate_risk_score
-- ============================================
DO $$
DECLARE
  v_test_alumno UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '=== TEST 2: Testing calculate_risk_score Function ===';
  
  -- Get a test student
  SELECT id_alumno INTO v_test_alumno FROM alumnos LIMIT 1;
  
  IF v_test_alumno IS NULL THEN
    RAISE NOTICE '⚠ No students found in database, skipping test';
  ELSE
    -- Call the function
    SELECT * INTO v_result FROM calculate_risk_score(v_test_alumno, NULL, NULL);
    
    -- Verify return structure
    IF v_result.risk_score IS NULL THEN
      RAISE EXCEPTION 'Function returned NULL risk_score';
    END IF;
    
    IF v_result.risk_score < 0 OR v_result.risk_score > 100 THEN
      RAISE EXCEPTION 'risk_score out of range: %', v_result.risk_score;
    END IF;
    
    IF v_result.risk_level NOT IN ('Crítico', 'Alto', 'Medio', 'Bajo', 'Mínimo', 'Sin Datos') THEN
      RAISE EXCEPTION 'Invalid risk_level: %', v_result.risk_level;
    END IF;
    
    RAISE NOTICE '✓ Function works correctly';
    RAISE NOTICE '  Student: %', v_test_alumno;
    RAISE NOTICE '  Risk Score: %', v_result.risk_score;
    RAISE NOTICE '  Risk Level: %', v_result.risk_level;
  END IF;
END $$;

-- ============================================
-- TEST 3: Verify View vista_telemetria_academica
-- ============================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 3: Testing vista_telemetria_academica View ===';
  
  -- Check if view exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'vista_telemetria_academica'
  ) THEN
    RAISE EXCEPTION 'View vista_telemetria_academica does not exist';
  END IF;
  
  -- Try to query the view
  SELECT COUNT(*) INTO v_count FROM vista_telemetria_academica;
  
  RAISE NOTICE '✓ View exists and is queryable';
  RAISE NOTICE '  Records: %', v_count;
END $$;

-- ============================================
-- TEST 4: Test populate_historical_averages Function
-- ============================================
DO $$
DECLARE
  v_result RECORD;
  v_count_before INTEGER;
  v_count_after INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 4: Testing populate_historical_averages Function ===';
  
  -- Count existing records
  SELECT COUNT(*) INTO v_count_before FROM historico_promedios;
  
  -- Run population function
  SELECT * INTO v_result FROM populate_historical_averages();
  
  -- Count after
  SELECT COUNT(*) INTO v_count_after FROM historico_promedios;
  
  RAISE NOTICE '✓ Function executed successfully';
  RAISE NOTICE '  Records before: %', v_count_before;
  RAISE NOTICE '  Records created: %', v_result.records_created;
  RAISE NOTICE '  Records after: %', v_count_after;
  RAISE NOTICE '  Message: %', v_result.message;
END $$;

-- ============================================
-- TEST 5: Verify Indexes
-- ============================================
DO $$
DECLARE
  v_expected_indexes TEXT[] := ARRAY[
    'idx_historico_grado_materia',
    'idx_historico_ano_lapso',
    'idx_historico_mes',
    'idx_notif_inteligentes_tipo',
    'idx_notif_inteligentes_severidad',
    'idx_notif_inteligentes_estado',
    'idx_cache_sentimiento_minuta'
  ];
  v_index TEXT;
  v_missing TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TEST 5: Verifying Indexes ===';
  
  FOREACH v_index IN ARRAY v_expected_indexes
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = v_index
    ) THEN
      v_missing := array_append(v_missing, v_index);
    END IF;
  END LOOP;
  
  IF array_length(v_missing, 1) > 0 THEN
    RAISE WARNING 'Missing indexes: %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE '✓ All expected indexes exist';
  END IF;
END $$;

-- ============================================
-- TEST 6: Verify RLS Policies
-- ============================================
DO $$
DECLARE
  v_table TEXT;
  v_policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 6: Verifying RLS Policies ===';
  
  FOREACH v_table IN ARRAY ARRAY['historico_promedios', 'notificaciones_inteligentes', 'cache_analisis_sentimiento']
  LOOP
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = v_table;
    
    IF v_policy_count = 0 THEN
      RAISE WARNING 'No RLS policies found for table: %', v_table;
    ELSE
      RAISE NOTICE '✓ Table % has % policies', v_table, v_policy_count;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- TEST 7: Sample Data Queries
-- ============================================
DO $$
DECLARE
  v_hist_count INTEGER;
  v_hist_grades INTEGER;
  v_hist_subjects INTEGER;
  v_telem_count INTEGER;
  v_telem_avg_prom NUMERIC;
  v_telem_avg_asist NUMERIC;
BEGIN
  RAISE NOTICE '=== TEST 7: Sample Data Queries ===';
  
  -- Query 1: Historical data
  SELECT 
    COUNT(*),
    COUNT(DISTINCT grado),
    COUNT(DISTINCT materia)
  INTO v_hist_count, v_hist_grades, v_hist_subjects
  FROM historico_promedios;
  
  RAISE NOTICE '✓ Historical Data Sample';
  RAISE NOTICE '  Total records: %', v_hist_count;
  RAISE NOTICE '  Unique grades: %', v_hist_grades;
  RAISE NOTICE '  Unique subjects: %', v_hist_subjects;
  
  -- Query 2: Telemetry view
  SELECT 
    COUNT(*),
    ROUND(AVG(promedio_general), 2),
    ROUND(AVG(promedio_asistencia), 2)
  INTO v_telem_count, v_telem_avg_prom, v_telem_avg_asist
  FROM vista_telemetria_academica;
  
  RAISE NOTICE '✓ Telemetry View Sample';
  RAISE NOTICE '  Total records: %', v_telem_count;
  RAISE NOTICE '  Avg promedio: %', v_telem_avg_prom;
  RAISE NOTICE '  Avg asistencia: %', v_telem_avg_asist;
END $$;

-- Query 3: Risk scores for all students (sample)
DO $$
DECLARE
  v_students INTEGER;
  v_avg_risk NUMERIC;
  v_critico INTEGER;
  v_alto INTEGER;
  v_medio INTEGER;
  v_bajo INTEGER;
  v_minimo INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    ROUND(AVG(risk_score), 2),
    COUNT(*) FILTER (WHERE risk_level = 'Crítico'),
    COUNT(*) FILTER (WHERE risk_level = 'Alto'),
    COUNT(*) FILTER (WHERE risk_level = 'Medio'),
    COUNT(*) FILTER (WHERE risk_level = 'Bajo'),
    COUNT(*) FILTER (WHERE risk_level = 'Mínimo')
  INTO v_students, v_avg_risk, v_critico, v_alto, v_medio, v_bajo, v_minimo
  FROM (
    SELECT rs.* 
    FROM alumnos a
    CROSS JOIN LATERAL calculate_risk_score(a.id_alumno, NULL, NULL) rs
    LIMIT 50
  ) risk_data;
  
  RAISE NOTICE '✓ Risk Score Calculation';
  RAISE NOTICE '  Students analyzed: %', v_students;
  RAISE NOTICE '  Avg risk score: %', v_avg_risk;
  RAISE NOTICE '  Crítico: %, Alto: %, Medio: %, Bajo: %, Mínimo: %', 
    v_critico, v_alto, v_medio, v_bajo, v_minimo;
END $$;

-- ============================================
-- TEST 8: Trigger Verification
-- ============================================
DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 8: Verifying Triggers ===';
  
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
    AND trigger_name IN (
      'update_historico_promedios_updated_at',
      'update_notificaciones_inteligentes_updated_at',
      'trigger_update_historical_averages'
    );
  
  IF v_trigger_count < 3 THEN
    RAISE WARNING 'Expected 3 triggers, found %', v_trigger_count;
  ELSE
    RAISE NOTICE '✓ All triggers exist';
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ANALYTICS INFRASTRUCTURE TEST COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review any warnings above';
  RAISE NOTICE '2. Test the frontend components';
  RAISE NOTICE '3. Verify API integration';
  RAISE NOTICE '';
END $$;

-- ============================================
-- OPTIONAL: Performance Test
-- ============================================
-- Uncomment to test query performance

/*
EXPLAIN ANALYZE
SELECT * FROM vista_telemetria_academica
WHERE grado = '5to Grado';

EXPLAIN ANALYZE
SELECT * FROM calculate_risk_score(
  (SELECT id_alumno FROM alumnos LIMIT 1),
  '2024-2025',
  'I Lapso'
);

EXPLAIN ANALYZE
SELECT * FROM historico_promedios
WHERE grado = '5to Grado' AND materia = 'Matemáticas'
ORDER BY mes;
*/
