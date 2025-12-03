-- Migration: Create reuniones_representantes table
-- Description: Table to store meetings with student representatives (parents/guardians)
--              Includes fields for concerns, agreements, and attendees
--              Designed for data science analysis and insights
-- Date: 2025-01-XX

-- ============================================
-- TABLE: reuniones_representantes
-- ============================================
CREATE TABLE IF NOT EXISTS reuniones_representantes (
  id_reunion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_alumno UUID NOT NULL REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  
  -- Basic Information
  fecha DATE NOT NULL,
  grado TEXT NOT NULL,
  asistentes TEXT[], -- Array of attendee names/roles
  
  -- Meeting Content
  motivo TEXT, -- Reason for the meeting
  inquietudes TEXT, -- Concerns raised (large text field)
  acuerdos TEXT, -- Agreements reached (large text field)
  
  -- Metadata
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_fecha CHECK (fecha <= CURRENT_DATE + INTERVAL '1 day')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reuniones_alumno ON reuniones_representantes(id_alumno);
CREATE INDEX IF NOT EXISTS idx_reuniones_fecha ON reuniones_representantes(fecha);
CREATE INDEX IF NOT EXISTS idx_reuniones_grado ON reuniones_representantes(grado);
CREATE INDEX IF NOT EXISTS idx_reuniones_creado_por ON reuniones_representantes(creado_por);
CREATE INDEX IF NOT EXISTS idx_reuniones_created_at ON reuniones_representantes(created_at DESC);

-- GIN index for full-text search on inquietudes and acuerdos
CREATE INDEX IF NOT EXISTS idx_reuniones_inquietudes_gin ON reuniones_representantes USING gin(to_tsvector('spanish', coalesce(inquietudes, '')));
CREATE INDEX IF NOT EXISTS idx_reuniones_acuerdos_gin ON reuniones_representantes USING gin(to_tsvector('spanish', coalesce(acuerdos, '')));

-- ============================================
-- TABLE: seguimiento_acuerdos
-- ============================================
-- Tracks follow-up on agreements from meetings
CREATE TABLE IF NOT EXISTS seguimiento_acuerdos (
  id_seguimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_reunion UUID NOT NULL REFERENCES reuniones_representantes(id_reunion) ON DELETE CASCADE,
  id_alumno UUID NOT NULL REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  
  -- Agreement Details
  acuerdo_descripcion TEXT NOT NULL, -- Extracted or summarized agreement
  estado_cumplimiento TEXT CHECK (estado_cumplimiento IN ('Pendiente', 'En Proceso', 'Cumplido', 'No Cumplido', 'Cancelado')),
  fecha_limite DATE,
  fecha_cumplimiento DATE,
  
  -- Follow-up Notes
  notas_seguimiento TEXT,
  
  -- Metadata
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_reunion ON seguimiento_acuerdos(id_reunion);
CREATE INDEX IF NOT EXISTS idx_seguimiento_alumno ON seguimiento_acuerdos(id_alumno);
CREATE INDEX IF NOT EXISTS idx_seguimiento_estado ON seguimiento_acuerdos(estado_cumplimiento);
CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha_limite ON seguimiento_acuerdos(fecha_limite);

-- ============================================
-- VIEW: vista_analisis_reuniones
-- ============================================
-- Aggregated view for analytics
CREATE OR REPLACE VIEW vista_analisis_reuniones AS
SELECT 
  r.id_reunion,
  r.id_alumno,
  a.nombres || ' ' || a.apellidos AS nombre_completo,
  a.salon AS grado,
  r.fecha,
  r.motivo,
  r.asistentes,
  LENGTH(r.inquietudes) AS longitud_inquietudes,
  LENGTH(r.acuerdos) AS longitud_acuerdos,
  CASE 
    WHEN r.inquietudes IS NULL OR r.inquietudes = '' THEN 0
    ELSE 1
  END AS tiene_inquietudes,
  CASE 
    WHEN r.acuerdos IS NULL OR r.acuerdos = '' THEN 0
    ELSE 1
  END AS tiene_acuerdos,
  r.created_at
FROM reuniones_representantes r
JOIN alumnos a ON r.id_alumno = a.id_alumno;

-- ============================================
-- VIEW: vista_metricas_reuniones_alumno
-- ============================================
-- Per-student meeting metrics
CREATE OR REPLACE VIEW vista_metricas_reuniones_alumno AS
SELECT 
  id_alumno,
  COUNT(*) AS total_reuniones,
  COUNT(DISTINCT DATE_TRUNC('month', fecha)) AS meses_con_reuniones,
  MIN(fecha) AS primera_reunion,
  MAX(fecha) AS ultima_reunion,
  CASE 
    WHEN COUNT(*) > 1 THEN 
      ROUND((MAX(fecha) - MIN(fecha))::NUMERIC / (COUNT(*) - 1), 2)
    ELSE 
      NULL
  END AS dias_promedio_entre_reuniones,
  COUNT(CASE WHEN motivo IS NOT NULL AND motivo != '' THEN 1 END) AS reuniones_con_motivo,
  COUNT(CASE WHEN inquietudes IS NOT NULL AND inquietudes != '' THEN 1 END) AS reuniones_con_inquietudes,
  COUNT(CASE WHEN acuerdos IS NOT NULL AND acuerdos != '' THEN 1 END) AS reuniones_con_acuerdos,
  array_agg(DISTINCT motivo) FILTER (WHERE motivo IS NOT NULL AND motivo != '') AS motivos_unicos
FROM reuniones_representantes
GROUP BY id_alumno;

-- ============================================
-- FUNCTION: calcular_frecuencia_reuniones
-- ============================================
-- Calculates meeting frequency for a student
CREATE OR REPLACE FUNCTION calcular_frecuencia_reuniones(
  p_id_alumno UUID,
  p_dias_periodo INTEGER DEFAULT 90
)
RETURNS TABLE (
  total_reuniones BIGINT,
  frecuencia_mensual NUMERIC,
  dias_ultima_reunion INTEGER,
  tendencia TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_reuniones,
    ROUND((COUNT(*)::NUMERIC / NULLIF(p_dias_periodo, 0)) * 30, 2) AS frecuencia_mensual,
    COALESCE(EXTRACT(EPOCH FROM (CURRENT_DATE - MAX(r.fecha)))::INTEGER / 86400, 999) AS dias_ultima_reunion,
    CASE
      WHEN COUNT(*) = 0 THEN 'Sin reuniones'
      WHEN COUNT(*) >= 3 AND MAX(r.fecha) >= CURRENT_DATE - INTERVAL '30 days' THEN 'Alta frecuencia'
      WHEN COUNT(*) >= 2 AND MAX(r.fecha) >= CURRENT_DATE - INTERVAL '60 days' THEN 'Frecuencia moderada'
      WHEN MAX(r.fecha) < CURRENT_DATE - INTERVAL '90 days' THEN 'Inactivo'
      ELSE 'Baja frecuencia'
    END AS tendencia
  FROM reuniones_representantes r
  WHERE r.id_alumno = p_id_alumno
    AND r.fecha >= CURRENT_DATE - (p_dias_periodo || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: analizar_sentimiento_inquietudes
-- ============================================
-- Basic sentiment analysis keywords (can be enhanced with ML)
CREATE OR REPLACE FUNCTION analizar_sentimiento_inquietudes(
  p_id_reunion UUID
)
RETURNS TABLE (
  sentimiento TEXT,
  palabras_clave TEXT[],
  urgencia TEXT
) AS $$
DECLARE
  v_inquietudes TEXT;
  v_palabras_positivas TEXT[] := ARRAY['mejora', 'progreso', 'bien', 'excelente', 'satisfecho', 'feliz', 'contento'];
  v_palabras_negativas TEXT[] := ARRAY['preocupado', 'problema', 'dificultad', 'preocupación', 'alerta', 'urgente', 'grave', 'serio'];
  v_palabras_neutras TEXT[] := ARRAY['consulta', 'información', 'duda', 'pregunta'];
  v_count_pos INTEGER := 0;
  v_count_neg INTEGER := 0;
  v_count_neut INTEGER := 0;
  v_palabras_encontradas TEXT[] := '{}';
BEGIN
  SELECT inquietudes INTO v_inquietudes
  FROM reuniones_representantes
  WHERE id_reunion = p_id_reunion;
  
  IF v_inquietudes IS NULL OR v_inquietudes = '' THEN
    RETURN QUERY SELECT 'Sin datos'::TEXT, ARRAY[]::TEXT[], 'Baja'::TEXT;
    RETURN;
  END IF;
  
  -- Count positive words
  SELECT COUNT(*) INTO v_count_pos
  FROM unnest(v_palabras_positivas) AS palabra
  WHERE LOWER(v_inquietudes) LIKE '%' || LOWER(palabra) || '%';
  
  -- Count negative words
  SELECT COUNT(*) INTO v_count_neg
  FROM unnest(v_palabras_negativas) AS palabra
  WHERE LOWER(v_inquietudes) LIKE '%' || LOWER(palabra) || '%';
  
  -- Count neutral words
  SELECT COUNT(*) INTO v_count_neut
  FROM unnest(v_palabras_neutras) AS palabra
  WHERE LOWER(v_inquietudes) LIKE '%' || LOWER(palabra) || '%';
  
  -- Build keywords array
  SELECT array_agg(DISTINCT palabra) INTO v_palabras_encontradas
  FROM (
    SELECT unnest(v_palabras_positivas) AS palabra WHERE LOWER(v_inquietudes) LIKE '%' || LOWER(unnest(v_palabras_positivas)) || '%'
    UNION
    SELECT unnest(v_palabras_negativas) AS palabra WHERE LOWER(v_inquietudes) LIKE '%' || LOWER(unnest(v_palabras_negativas)) || '%'
    UNION
    SELECT unnest(v_palabras_neutras) AS palabra WHERE LOWER(v_inquietudes) LIKE '%' || LOWER(unnest(v_palabras_neutras)) || '%'
  ) AS palabras;
  
  RETURN QUERY SELECT
    CASE
      WHEN v_count_neg > v_count_pos AND v_count_neg > v_count_neut THEN 'Negativo'
      WHEN v_count_pos > v_count_neg AND v_count_pos > v_count_neut THEN 'Positivo'
      WHEN v_count_neut > 0 THEN 'Neutro'
      ELSE 'Neutro'
    END AS sentimiento,
    COALESCE(v_palabras_encontradas, ARRAY[]::TEXT[]) AS palabras_clave,
    CASE
      WHEN v_count_neg >= 3 THEN 'Alta'
      WHEN v_count_neg >= 2 THEN 'Media'
      WHEN v_count_neg >= 1 THEN 'Baja'
      ELSE 'Baja'
    END AS urgencia;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: extraer_temas_inquietudes
-- ============================================
-- Extracts common themes from concerns
CREATE OR REPLACE FUNCTION extraer_temas_inquietudes(
  p_id_alumno UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  tema TEXT,
  frecuencia BIGINT,
  porcentaje NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH temas AS (
    SELECT 
      unnest(ARRAY[
        CASE WHEN LOWER(inquietudes) LIKE '%académico%' OR LOWER(inquietudes) LIKE '%nota%' OR LOWER(inquietudes) LIKE '%calificación%' THEN 'Académico' END,
        CASE WHEN LOWER(inquietudes) LIKE '%comportamiento%' OR LOWER(inquietudes) LIKE '%conducta%' OR LOWER(inquietudes) LIKE '%disciplina%' THEN 'Comportamiento' END,
        CASE WHEN LOWER(inquietudes) LIKE '%social%' OR LOWER(inquietudes) LIKE '%amistad%' OR LOWER(inquietudes) LIKE '%compañero%' THEN 'Social' END,
        CASE WHEN LOWER(inquietudes) LIKE '%emocional%' OR LOWER(inquietudes) LIKE '%ansiedad%' OR LOWER(inquietudes) LIKE '%estrés%' THEN 'Emocional' END,
        CASE WHEN LOWER(inquietudes) LIKE '%asistencia%' OR LOWER(inquietudes) LIKE '%falta%' OR LOWER(inquietudes) LIKE '%ausencia%' THEN 'Asistencia' END,
        CASE WHEN LOWER(inquietudes) LIKE '%tarea%' OR LOWER(inquietudes) LIKE '%deber%' OR LOWER(inquietudes) LIKE '%trabajo%' THEN 'Tareas' END,
        CASE WHEN LOWER(inquietudes) LIKE '%atención%' OR LOWER(inquietudes) LIKE '%concentración%' OR LOWER(inquietudes) LIKE '%foco%' THEN 'Atención' END
      ]) AS tema
    FROM reuniones_representantes
    WHERE id_alumno = p_id_alumno
      AND inquietudes IS NOT NULL
      AND inquietudes != ''
  )
  SELECT 
    tema,
    COUNT(*) AS frecuencia,
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM reuniones_representantes WHERE id_alumno = p_id_alumno AND inquietudes IS NOT NULL AND inquietudes != ''), 0)) * 100, 2) AS porcentaje
  FROM temas
  WHERE tema IS NOT NULL
  GROUP BY tema
  ORDER BY frecuencia DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE reuniones_representantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_acuerdos ENABLE ROW LEVEL SECURITY;

-- Coordinadores and directivos can manage all meetings
CREATE POLICY "Coordinators manage reuniones" ON reuniones_representantes
  FOR ALL TO authenticated
  USING (public.user_role() IN ('coordinador', 'directivo'));

-- Teachers can view and create meetings for their students
CREATE POLICY "Teachers view reuniones" ON reuniones_representantes
  FOR SELECT TO authenticated
  USING (public.user_role() = 'docente');

CREATE POLICY "Teachers create reuniones" ON reuniones_representantes
  FOR INSERT TO authenticated
  WITH CHECK (public.user_role() = 'docente');

-- Coordinadores and directivos can manage all follow-ups
CREATE POLICY "Coordinators manage seguimiento" ON seguimiento_acuerdos
  FOR ALL TO authenticated
  USING (public.user_role() IN ('coordinador', 'directivo'));

-- Teachers can view and create follow-ups
CREATE POLICY "Teachers view seguimiento" ON seguimiento_acuerdos
  FOR SELECT TO authenticated
  USING (public.user_role() = 'docente');

CREATE POLICY "Teachers create seguimiento" ON seguimiento_acuerdos
  FOR INSERT TO authenticated
  WITH CHECK (public.user_role() = 'docente');

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE reuniones_representantes IS 'Stores meetings with student representatives (parents/guardians) for data analysis and insights';
COMMENT ON TABLE seguimiento_acuerdos IS 'Tracks follow-up on agreements from meetings with representatives';
COMMENT ON VIEW vista_analisis_reuniones IS 'Aggregated view for meeting analytics';
COMMENT ON VIEW vista_metricas_reuniones_alumno IS 'Per-student meeting metrics for analysis';
COMMENT ON FUNCTION calcular_frecuencia_reuniones IS 'Calculates meeting frequency and trends for a student';
COMMENT ON FUNCTION analizar_sentimiento_inquietudes IS 'Basic sentiment analysis of concerns raised in meetings';
COMMENT ON FUNCTION extraer_temas_inquietudes IS 'Extracts common themes from student concerns';

