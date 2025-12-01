-- Migration: 047_seed_historical_data.sql
-- Description: Seeds initial historical data for benchmarking (Ghost Car)
--              This creates baseline data from existing evaluations

-- ============================================
-- FUNCTION: populate_historical_averages
-- ============================================
-- Populates historico_promedios from existing minutas_evaluacion data
CREATE OR REPLACE FUNCTION populate_historical_averages()
RETURNS TABLE (
  records_created INTEGER,
  message TEXT
) AS $$
DECLARE
  v_records_created INTEGER := 0;
BEGIN
  -- Insert historical averages from existing evaluation data
  INSERT INTO historico_promedios (
    ano_escolar,
    lapso,
    mes,
    grado,
    materia,
    promedio_general,
    promedio_asistencia,
    total_estudiantes,
    metadata
  )
  SELECT
    me.ano_escolar,
    me.lapso,
    EXTRACT(MONTH FROM me.fecha_creacion)::INTEGER as mes,
    me.grado,
    me.materia,
    ROUND(AVG(
      CASE 
        WHEN rea.nota ~ '^[0-9]+\.?[0-9]*$' THEN rea.nota::NUMERIC
        WHEN rea.nota = 'A' THEN 19
        WHEN rea.nota = 'B' THEN 16
        WHEN rea.nota = 'C' THEN 13
        WHEN rea.nota = 'D' THEN 10
        ELSE NULL
      END
    ), 2) as promedio_general,
    ROUND(AVG(100 - COALESCE(rea.inasistencias, 0)), 2) as promedio_asistencia,
    COUNT(DISTINCT rea.id_alumno) as total_estudiantes,
    jsonb_build_object(
      'mediana', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
        CASE 
          WHEN rea.nota ~ '^[0-9]+\.?[0-9]*$' THEN rea.nota::NUMERIC
          WHEN rea.nota = 'A' THEN 19
          WHEN rea.nota = 'B' THEN 16
          WHEN rea.nota = 'C' THEN 13
          WHEN rea.nota = 'D' THEN 10
          ELSE NULL
        END
      ),
      'desviacion_estandar', STDDEV(
        CASE 
          WHEN rea.nota ~ '^[0-9]+\.?[0-9]*$' THEN rea.nota::NUMERIC
          WHEN rea.nota = 'A' THEN 19
          WHEN rea.nota = 'B' THEN 16
          WHEN rea.nota = 'C' THEN 13
          WHEN rea.nota = 'D' THEN 10
          ELSE NULL
        END
      ),
      'total_evaluaciones', COUNT(*)
    ) as metadata
  FROM minutas_evaluacion me
  JOIN resumen_evaluacion_alumno rea ON rea.id_minuta = me.id_minuta
  WHERE me.fecha_creacion IS NOT NULL
  GROUP BY 
    me.ano_escolar,
    me.lapso,
    EXTRACT(MONTH FROM me.fecha_creacion),
    me.grado,
    me.materia
  ON CONFLICT (ano_escolar, lapso, mes, grado, materia) 
  DO UPDATE SET
    promedio_general = EXCLUDED.promedio_general,
    promedio_asistencia = EXCLUDED.promedio_asistencia,
    total_estudiantes = EXCLUDED.total_estudiantes,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  GET DIAGNOSTICS v_records_created = ROW_COUNT;

  RETURN QUERY SELECT 
    v_records_created,
    format('Successfully populated %s historical records', v_records_created);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Execute the population (commented out for safety)
-- ============================================
-- Uncomment the line below to populate historical data:
-- SELECT * FROM populate_historical_averages();

-- ============================================
-- FUNCTION: auto_update_historical_averages
-- ============================================
-- Trigger function to automatically update historical averages when new evaluations are added
CREATE OR REPLACE FUNCTION auto_update_historical_averages()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert historical average for this evaluation's context
  INSERT INTO historico_promedios (
    ano_escolar,
    lapso,
    mes,
    grado,
    materia,
    promedio_general,
    promedio_asistencia,
    total_estudiantes,
    metadata
  )
  SELECT
    NEW.ano_escolar,
    NEW.lapso,
    EXTRACT(MONTH FROM NEW.fecha_creacion)::INTEGER,
    NEW.grado,
    NEW.materia,
    ROUND(AVG(
      CASE 
        WHEN rea.nota ~ '^[0-9]+\.?[0-9]*$' THEN rea.nota::NUMERIC
        WHEN rea.nota = 'A' THEN 19
        WHEN rea.nota = 'B' THEN 16
        WHEN rea.nota = 'C' THEN 13
        WHEN rea.nota = 'D' THEN 10
        ELSE NULL
      END
    ), 2),
    ROUND(AVG(100 - COALESCE(rea.inasistencias, 0)), 2),
    COUNT(DISTINCT rea.id_alumno),
    jsonb_build_object(
      'ultima_actualizacion', NOW(),
      'total_evaluaciones', COUNT(*)
    )
  FROM minutas_evaluacion me
  JOIN resumen_evaluacion_alumno rea ON rea.id_minuta = me.id_minuta
  WHERE me.ano_escolar = NEW.ano_escolar
    AND me.lapso = NEW.lapso
    AND EXTRACT(MONTH FROM me.fecha_creacion) = EXTRACT(MONTH FROM NEW.fecha_creacion)
    AND me.grado = NEW.grado
    AND me.materia = NEW.materia
  GROUP BY 
    me.ano_escolar,
    me.lapso,
    EXTRACT(MONTH FROM me.fecha_creacion),
    me.grado,
    me.materia
  ON CONFLICT (ano_escolar, lapso, mes, grado, materia) 
  DO UPDATE SET
    promedio_general = EXCLUDED.promedio_general,
    promedio_asistencia = EXCLUDED.promedio_asistencia,
    total_estudiantes = EXCLUDED.total_estudiantes,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on minutas_evaluacion
CREATE TRIGGER trigger_update_historical_averages
  AFTER INSERT OR UPDATE ON minutas_evaluacion
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_historical_averages();

COMMENT ON FUNCTION populate_historical_averages IS 'One-time function to populate historical data from existing evaluations';
COMMENT ON FUNCTION auto_update_historical_averages IS 'Automatically updates historical averages when new evaluations are created';
