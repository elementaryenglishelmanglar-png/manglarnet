-- Migration: 046_create_analytics_infrastructure.sql
-- Description: Creates the database layer for "The Red Bull Suite" - Advanced Analytics Platform
--              Includes: Risk Scoring, Historical Benchmarking, Intelligent Notifications

-- ============================================
-- TABLE: historico_promedios (Ghost Car Data)
-- ============================================
-- Stores historical average performance data for benchmarking
CREATE TABLE IF NOT EXISTS historico_promedios (
  id_historico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_escolar TEXT NOT NULL,
  lapso TEXT NOT NULL CHECK (lapso IN ('I Lapso', 'II Lapso', 'III Lapso')),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  grado TEXT NOT NULL,
  materia TEXT NOT NULL,
  promedio_general NUMERIC(5,2) NOT NULL CHECK (promedio_general BETWEEN 0 AND 20),
  promedio_asistencia NUMERIC(5,2) CHECK (promedio_asistencia BETWEEN 0 AND 100),
  total_estudiantes INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- For additional stats (median, std dev, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per period/grade/subject
  UNIQUE(ano_escolar, lapso, mes, grado, materia)
);

CREATE INDEX IF NOT EXISTS idx_historico_grado_materia ON historico_promedios(grado, materia);
CREATE INDEX IF NOT EXISTS idx_historico_ano_lapso ON historico_promedios(ano_escolar, lapso);
CREATE INDEX IF NOT EXISTS idx_historico_mes ON historico_promedios(mes);

-- ============================================
-- TABLE: notificaciones_inteligentes (Smart Alerts)
-- ============================================
-- Stores AI-generated alerts based on anomaly detection
CREATE TABLE IF NOT EXISTS notificaciones_inteligentes (
  id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN (
    'rendimiento_bajo', 
    'bajada_brusca', 
    'riesgo_alto', 
    'asistencia_critica',
    'anomalia_grupal',
    'mejora_significativa'
  )),
  severidad TEXT NOT NULL DEFAULT 'media' CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  
  -- Context
  grado TEXT,
  materia TEXT,
  id_alumno UUID REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  id_minuta UUID REFERENCES minutas_evaluacion(id_minuta) ON DELETE SET NULL,
  
  -- Metrics
  valor_actual NUMERIC(10,2),
  valor_anterior NUMERIC(10,2),
  umbral_activacion NUMERIC(10,2),
  
  -- AI Analysis
  analisis_ia JSONB DEFAULT '{}', -- Stores AI-generated insights
  acciones_sugeridas TEXT[] DEFAULT '{}',
  
  -- Status
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisada', 'resuelta', 'descartada')),
  revisada_por UUID REFERENCES auth.users(id),
  fecha_revision TIMESTAMPTZ,
  notas_revision TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_inteligentes_tipo ON notificaciones_inteligentes(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_notif_inteligentes_severidad ON notificaciones_inteligentes(severidad);
CREATE INDEX IF NOT EXISTS idx_notif_inteligentes_estado ON notificaciones_inteligentes(estado);
CREATE INDEX IF NOT EXISTS idx_notif_inteligentes_grado ON notificaciones_inteligentes(grado);
CREATE INDEX IF NOT EXISTS idx_notif_inteligentes_alumno ON notificaciones_inteligentes(id_alumno);
CREATE INDEX IF NOT EXISTS idx_notif_inteligentes_created ON notificaciones_inteligentes(created_at DESC);

-- ============================================
-- TABLE: cache_analisis_sentimiento (Sentiment Cache)
-- ============================================
-- Caches AI sentiment analysis to avoid redundant API calls
CREATE TABLE IF NOT EXISTS cache_analisis_sentimiento (
  id_cache UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_minuta UUID NOT NULL REFERENCES minutas_evaluacion(id_minuta) ON DELETE CASCADE,
  grado TEXT NOT NULL,
  materia TEXT NOT NULL,
  
  -- Sentiment Results
  clima_emocional JSONB NOT NULL DEFAULT '{}', -- {enfocado: 12, ansioso: 3, distraido: 5, ...}
  sentimiento_predominante TEXT,
  score_positivo NUMERIC(5,2) CHECK (score_positivo BETWEEN 0 AND 100),
  palabras_clave TEXT[] DEFAULT '{}',
  
  -- Metadata
  total_observaciones INTEGER NOT NULL DEFAULT 0,
  fecha_analisis TIMESTAMPTZ DEFAULT NOW(),
  modelo_usado TEXT DEFAULT 'gemini-1.5-flash',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One cache per evaluation minute
  UNIQUE(id_minuta)
);

CREATE INDEX IF NOT EXISTS idx_cache_sentimiento_minuta ON cache_analisis_sentimiento(id_minuta);
CREATE INDEX IF NOT EXISTS idx_cache_sentimiento_grado ON cache_analisis_sentimiento(grado);

-- ============================================
-- FUNCTION: calculate_risk_score
-- ============================================
-- Calculates a weighted risk score (0-100) for a student based on recent performance
-- Higher score = Higher risk
CREATE OR REPLACE FUNCTION calculate_risk_score(
  p_id_alumno UUID,
  p_ano_escolar TEXT DEFAULT NULL,
  p_lapso TEXT DEFAULT NULL
)
RETURNS TABLE (
  id_alumno UUID,
  risk_score NUMERIC(5,2),
  risk_level TEXT,
  factores_riesgo JSONB
) AS $$
DECLARE
  v_promedio_notas NUMERIC(5,2);
  v_asistencia_promedio NUMERIC(5,2);
  v_evaluaciones_bajas INTEGER;
  v_total_evaluaciones INTEGER;
  v_tendencia_notas TEXT;
  v_score NUMERIC(5,2) := 0;
  v_factores JSONB := '{}';
BEGIN
  -- Get recent evaluation data for the student
  WITH evaluaciones_recientes AS (
    SELECT 
      rea.nota,
      rea.inasistencias,
      rea.nivel_independencia,
      rea.estado_emocional,
      me.fecha_creacion,
      me.ano_escolar,
      me.lapso
    FROM resumen_evaluacion_alumno rea
    JOIN minutas_evaluacion me ON me.id_minuta = rea.id_minuta
    WHERE rea.id_alumno = p_id_alumno
      AND (p_ano_escolar IS NULL OR me.ano_escolar = p_ano_escolar)
      AND (p_lapso IS NULL OR me.lapso = p_lapso)
    ORDER BY me.fecha_creacion DESC
    LIMIT 10 -- Last 10 evaluations
  ),
  metricas AS (
    SELECT
      -- Convert nota to numeric (assuming format like "18", "15", "A", "B", etc.)
      AVG(
        CASE 
          WHEN nota ~ '^[0-9]+\.?[0-9]*$' THEN nota::NUMERIC
          WHEN nota = 'A' THEN 19
          WHEN nota = 'B' THEN 16
          WHEN nota = 'C' THEN 13
          WHEN nota = 'D' THEN 10
          ELSE 0
        END
      ) as promedio_notas,
      -- Convert inasistencias (absences count) to attendance percentage
      AVG(100 - COALESCE(inasistencias, 0)) as asistencia_promedio,
      COUNT(*) as total_evals,
      SUM(
        CASE 
          WHEN (nota ~ '^[0-9]+\.?[0-9]*$' AND nota::NUMERIC < 10) 
            OR nota IN ('D', 'E', 'F')
          THEN 1 
          ELSE 0 
        END
      ) as evals_bajas,
      -- Count negative emotional states
      SUM(
        CASE 
          WHEN estado_emocional IN ('Ansioso/Nervioso', 'Apatía/Desinterés', 'Cansado')
          THEN 1 
          ELSE 0 
        END
      ) as estados_negativos,
      -- Count low independence
      SUM(
        CASE 
          WHEN nivel_independencia IN ('Apoyo Constante', 'No Logrado')
          THEN 1 
          ELSE 0 
        END
      ) as baja_independencia
    FROM evaluaciones_recientes
  )
  SELECT 
    metricas.promedio_notas,
    metricas.asistencia_promedio,
    metricas.evals_bajas,
    metricas.total_evals,
    metricas.estados_negativos,
    metricas.baja_independencia
  INTO 
    v_promedio_notas,
    v_asistencia_promedio,
    v_evaluaciones_bajas,
    v_total_evaluaciones,
    v_score, -- Reusing for estados_negativos temporarily
    v_score  -- Reusing for baja_independencia temporarily
  FROM metricas;

  -- If no data, return zero risk
  IF v_total_evaluaciones = 0 THEN
    RETURN QUERY SELECT 
      p_id_alumno,
      0::NUMERIC(5,2),
      'Sin Datos'::TEXT,
      '{}'::JSONB;
    RETURN;
  END IF;

  -- Reset score
  v_score := 0;

  -- FACTOR 1: Low average grade (Weight: 40%)
  -- Scale: 20 = 0 points, 10 = 20 points, 0 = 40 points
  IF v_promedio_notas < 10 THEN
    v_score := v_score + 40;
    v_factores := jsonb_set(v_factores, '{promedio_bajo}', to_jsonb(TRUE));
  ELSIF v_promedio_notas < 14 THEN
    v_score := v_score + (14 - v_promedio_notas) * 4; -- Linear scale
    v_factores := jsonb_set(v_factores, '{promedio_bajo}', to_jsonb(TRUE));
  END IF;

  -- FACTOR 2: Attendance (Weight: 25%)
  -- Scale: 100% = 0 points, 70% = 12.5 points, 50% = 25 points
  IF v_asistencia_promedio < 70 THEN
    v_score := v_score + 25;
    v_factores := jsonb_set(v_factores, '{asistencia_critica}', to_jsonb(TRUE));
  ELSIF v_asistencia_promedio < 85 THEN
    v_score := v_score + (85 - v_asistencia_promedio) * 0.833; -- Linear scale
    v_factores := jsonb_set(v_factores, '{asistencia_baja}', to_jsonb(TRUE));
  END IF;

  -- FACTOR 3: Frequency of failing grades (Weight: 20%)
  IF v_total_evaluaciones > 0 THEN
    v_score := v_score + (v_evaluaciones_bajas::NUMERIC / v_total_evaluaciones) * 20;
    IF v_evaluaciones_bajas > 0 THEN
      v_factores := jsonb_set(v_factores, '{evaluaciones_reprobadas}', to_jsonb(v_evaluaciones_bajas));
    END IF;
  END IF;

  -- FACTOR 4: Emotional/Independence issues (Weight: 15%)
  -- This is stored temporarily in v_score during SELECT, retrieve from metricas again
  WITH metricas AS (
    SELECT
      SUM(
        CASE 
          WHEN estado_emocional IN ('Ansioso/Nervioso', 'Apatía/Desinterés', 'Cansado')
          THEN 1 
          ELSE 0 
        END
      ) as estados_negativos,
      SUM(
        CASE 
          WHEN nivel_independencia IN ('Apoyo Constante', 'No Logrado')
          THEN 1 
          ELSE 0 
        END
      ) as baja_independencia,
      COUNT(*) as total
    FROM (
      SELECT 
        rea.estado_emocional,
        rea.nivel_independencia
      FROM resumen_evaluacion_alumno rea
      JOIN minutas_evaluacion me ON me.id_minuta = rea.id_minuta
      WHERE rea.id_alumno = p_id_alumno
        AND (p_ano_escolar IS NULL OR me.ano_escolar = p_ano_escolar)
        AND (p_lapso IS NULL OR me.lapso = p_lapso)
      ORDER BY me.fecha_creacion DESC
      LIMIT 10
    ) sub
  )
  SELECT 
    CASE 
      WHEN total > 0 THEN ((estados_negativos::NUMERIC + baja_independencia::NUMERIC) / total) * 15
      ELSE 0
    END
  INTO v_score
  FROM metricas;

  -- Add emotional/independence factor
  WITH metricas AS (
    SELECT
      SUM(
        CASE 
          WHEN estado_emocional IN ('Ansioso/Nervioso', 'Apatía/Desinterés', 'Cansado')
          THEN 1 
          ELSE 0 
        END
      ) as estados_negativos,
      SUM(
        CASE 
          WHEN nivel_independencia IN ('Apoyo Constante', 'No Logrado')
          THEN 1 
          ELSE 0 
        END
      ) as baja_independencia,
      COUNT(*) as total
    FROM (
      SELECT 
        rea.estado_emocional,
        rea.nivel_independencia
      FROM resumen_evaluacion_alumno rea
      JOIN minutas_evaluacion me ON me.id_minuta = rea.id_minuta
      WHERE rea.id_alumno = p_id_alumno
        AND (p_ano_escolar IS NULL OR me.ano_escolar = p_ano_escolar)
        AND (p_lapso IS NULL OR me.lapso = p_lapso)
      ORDER BY me.fecha_creacion DESC
      LIMIT 10
    ) sub
  )
  SELECT 
    v_score + CASE 
      WHEN total > 0 THEN ((estados_negativos::NUMERIC + baja_independencia::NUMERIC) / total) * 15
      ELSE 0
    END,
    CASE WHEN estados_negativos > 2 THEN TRUE ELSE FALSE END,
    CASE WHEN baja_independencia > 2 THEN TRUE ELSE FALSE END
  INTO v_score, v_tendencia_notas, v_tendencia_notas -- Reusing variables
  FROM metricas;

  -- Add to factores if significant
  IF v_tendencia_notas::TEXT = 'true' THEN
    v_factores := jsonb_set(v_factores, '{problemas_emocionales}', to_jsonb(TRUE));
  END IF;

  -- Cap score at 100
  v_score := LEAST(v_score, 100);

  -- Determine risk level
  v_tendencia_notas := CASE
    WHEN v_score >= 70 THEN 'Crítico'
    WHEN v_score >= 50 THEN 'Alto'
    WHEN v_score >= 30 THEN 'Medio'
    WHEN v_score >= 15 THEN 'Bajo'
    ELSE 'Mínimo'
  END;

  -- Add summary metrics to factores
  v_factores := jsonb_set(v_factores, '{promedio_notas}', to_jsonb(ROUND(v_promedio_notas, 2)));
  v_factores := jsonb_set(v_factores, '{asistencia_promedio}', to_jsonb(ROUND(v_asistencia_promedio, 2)));
  v_factores := jsonb_set(v_factores, '{total_evaluaciones}', to_jsonb(v_total_evaluaciones));

  RETURN QUERY SELECT 
    p_id_alumno,
    ROUND(v_score, 2),
    v_tendencia_notas,
    v_factores;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- VIEW: vista_telemetria_academica
-- ============================================
-- Real-time KPIs view for dashboard telemetry
CREATE OR REPLACE VIEW vista_telemetria_academica AS
WITH ultimas_evaluaciones AS (
  SELECT DISTINCT ON (me.grado, me.materia, me.lapso)
    me.id_minuta,
    me.grado,
    me.materia,
    me.lapso,
    me.ano_escolar,
    me.fecha_creacion
  FROM minutas_evaluacion me
  ORDER BY me.grado, me.materia, me.lapso, me.fecha_creacion DESC
),
metricas_actuales AS (
  SELECT
    ue.grado,
    ue.materia,
    ue.lapso,
    ue.ano_escolar,
    COUNT(DISTINCT rea.id_alumno) as total_estudiantes,
    AVG(
      CASE 
        WHEN rea.nota ~ '^[0-9]+\.?[0-9]*$' THEN rea.nota::NUMERIC
        WHEN rea.nota = 'A' THEN 19
        WHEN rea.nota = 'B' THEN 16
        WHEN rea.nota = 'C' THEN 13
        WHEN rea.nota = 'D' THEN 10
        ELSE NULL
      END
    ) as promedio_general,
    -- Convert inasistencias to attendance percentage (100 - absences)
    AVG(100 - COALESCE(rea.inasistencias, 0)) as promedio_asistencia,
    SUM(
      CASE 
        WHEN (rea.nota ~ '^[0-9]+\.?[0-9]*$' AND rea.nota::NUMERIC >= 10)
          OR rea.nota IN ('A', 'B', 'C')
        THEN 1 
        ELSE 0 
      END
    )::NUMERIC / NULLIF(COUNT(*), 0) * 100 as porcentaje_aprobados
  FROM ultimas_evaluaciones ue
  JOIN resumen_evaluacion_alumno rea ON rea.id_minuta = ue.id_minuta
  GROUP BY ue.grado, ue.materia, ue.lapso, ue.ano_escolar
)
SELECT
  grado,
  materia,
  lapso,
  ano_escolar,
  total_estudiantes,
  ROUND(promedio_general, 2) as promedio_general,
  ROUND(promedio_asistencia, 2) as promedio_asistencia,
  ROUND(porcentaje_aprobados, 2) as porcentaje_aprobados,
  NOW() as ultima_actualizacion
FROM metricas_actuales;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE historico_promedios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_inteligentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_analisis_sentimiento ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all authenticated users to read
CREATE POLICY "Authenticated users can read historico_promedios" ON historico_promedios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read notificaciones_inteligentes" ON notificaciones_inteligentes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read cache_analisis_sentimiento" ON cache_analisis_sentimiento
  FOR SELECT TO authenticated USING (true);

-- Policies: Allow authenticated users to manage (simplified for initial deployment)
-- TODO: Add role-based restrictions once user roles are properly configured
CREATE POLICY "Authenticated users can manage historico_promedios" ON historico_promedios
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage notificaciones_inteligentes" ON notificaciones_inteligentes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage cache_analisis_sentimiento" ON cache_analisis_sentimiento
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_historico_promedios_updated_at
  BEFORE UPDATE ON historico_promedios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notificaciones_inteligentes_updated_at
  BEFORE UPDATE ON notificaciones_inteligentes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE historico_promedios IS 'Historical performance benchmarks for Ghost Car comparison';
COMMENT ON TABLE notificaciones_inteligentes IS 'AI-generated intelligent alerts based on anomaly detection';
COMMENT ON TABLE cache_analisis_sentimiento IS 'Cached sentiment analysis results to optimize AI API usage';
COMMENT ON FUNCTION calculate_risk_score IS 'Calculates weighted risk score (0-100) for early warning system';
COMMENT ON VIEW vista_telemetria_academica IS 'Real-time KPIs for dashboard telemetry display';
