-- Migration: Create lapsos system for managing academic periods with weeks and dates
-- This migration creates tables to manage lapsos (academic periods) with specific dates and weeks

-- ============================================
-- TABLE: lapsos (Academic Periods)
-- ============================================
CREATE TABLE IF NOT EXISTS lapsos (
  id_lapso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_escolar TEXT NOT NULL,
  lapso TEXT NOT NULL CHECK (lapso IN ('I Lapso', 'II Lapso', 'III Lapso')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  semanas_totales INTEGER NOT NULL CHECK (semanas_totales > 0),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano_escolar, lapso)
);

CREATE INDEX IF NOT EXISTS idx_lapsos_ano ON lapsos(ano_escolar);
CREATE INDEX IF NOT EXISTS idx_lapsos_activo ON lapsos(activo) WHERE activo = true;

COMMENT ON TABLE lapsos IS 'Define los lapsos académicos con sus fechas de inicio, fin y número total de semanas';
COMMENT ON COLUMN lapsos.fecha_inicio IS 'Fecha de inicio del lapso (lunes de la primera semana)';
COMMENT ON COLUMN lapsos.fecha_fin IS 'Fecha de fin del lapso (viernes de la última semana)';

-- ============================================
-- TABLE: semanas_lapso (Weeks within a Lapso)
-- ============================================
CREATE TABLE IF NOT EXISTS semanas_lapso (
  id_semana_lapso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_lapso UUID NOT NULL REFERENCES lapsos(id_lapso) ON DELETE CASCADE,
  numero_semana INTEGER NOT NULL CHECK (numero_semana > 0),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_lapso, numero_semana)
);

CREATE INDEX IF NOT EXISTS idx_semanas_lapso_lapso ON semanas_lapso(id_lapso);
CREATE INDEX IF NOT EXISTS idx_semanas_lapso_fechas ON semanas_lapso(fecha_inicio, fecha_fin);

COMMENT ON TABLE semanas_lapso IS 'Define cada semana dentro de un lapso con sus fechas específicas';
COMMENT ON COLUMN semanas_lapso.numero_semana IS 'Número de semana dentro del lapso (1, 2, 3, ...)';
COMMENT ON COLUMN semanas_lapso.fecha_inicio IS 'Fecha de inicio de la semana (lunes)';
COMMENT ON COLUMN semanas_lapso.fecha_fin IS 'Fecha de fin de la semana (viernes)';

-- ============================================
-- FUNCTION: Generate weeks for a lapso
-- ============================================
CREATE OR REPLACE FUNCTION generar_semanas_lapso(p_id_lapso UUID)
RETURNS void AS $$
DECLARE
  lapso_rec RECORD;
  semana_num INTEGER;
  fecha_actual DATE;
  fecha_inicio_semana DATE;
  fecha_fin_semana DATE;
BEGIN
  SELECT * INTO lapso_rec FROM lapsos WHERE id_lapso = p_id_lapso;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lapso no encontrado: %', p_id_lapso;
  END IF;
  
  -- Eliminar semanas existentes para este lapso
  DELETE FROM semanas_lapso WHERE id_lapso = p_id_lapso;
  
  fecha_actual := lapso_rec.fecha_inicio;
  semana_num := 1;
  
  -- Asegurar que empezamos en lunes
  WHILE EXTRACT(DOW FROM fecha_actual) != 1 LOOP
    fecha_actual := fecha_actual - INTERVAL '1 day';
  END LOOP;
  
  WHILE fecha_actual <= lapso_rec.fecha_fin AND semana_num <= lapso_rec.semanas_totales LOOP
    fecha_inicio_semana := fecha_actual;
    fecha_fin_semana := fecha_actual + INTERVAL '4 days'; -- Viernes (5 días: lunes a viernes)
    
    -- Asegurar que no exceda la fecha fin del lapso
    IF fecha_fin_semana > lapso_rec.fecha_fin THEN
      fecha_fin_semana := lapso_rec.fecha_fin;
    END IF;
    
    INSERT INTO semanas_lapso (id_lapso, numero_semana, fecha_inicio, fecha_fin)
    VALUES (lapso_rec.id_lapso, semana_num, fecha_inicio_semana, fecha_fin_semana);
    
    fecha_actual := fecha_actual + INTERVAL '7 days'; -- Siguiente lunes
    semana_num := semana_num + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_semanas_lapso IS 'Genera automáticamente las semanas para un lapso basándose en sus fechas de inicio y fin';

-- ============================================
-- TRIGGER: Auto-generate weeks when lapso is created/updated
-- ============================================
CREATE OR REPLACE FUNCTION trigger_generar_semanas_lapso()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar si las fechas son válidas
  IF NEW.fecha_inicio IS NOT NULL AND NEW.fecha_fin IS NOT NULL AND NEW.semanas_totales > 0 THEN
    PERFORM generar_semanas_lapso(NEW.id_lapso);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generar_semanas_lapso_insert ON lapsos;
CREATE TRIGGER trigger_generar_semanas_lapso_insert
  AFTER INSERT ON lapsos
  FOR EACH ROW
  WHEN (NEW.activo = true)
  EXECUTE FUNCTION trigger_generar_semanas_lapso();

DROP TRIGGER IF EXISTS trigger_generar_semanas_lapso_update ON lapsos;
CREATE TRIGGER trigger_generar_semanas_lapso_update
  AFTER UPDATE OF fecha_inicio, fecha_fin, semanas_totales, activo ON lapsos
  FOR EACH ROW
  WHEN (NEW.activo = true AND (
    OLD.fecha_inicio IS DISTINCT FROM NEW.fecha_inicio OR
    OLD.fecha_fin IS DISTINCT FROM NEW.fecha_fin OR
    OLD.semanas_totales IS DISTINCT FROM NEW.semanas_totales
  ))
  EXECUTE FUNCTION trigger_generar_semanas_lapso();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE lapsos ENABLE ROW LEVEL SECURITY;
ALTER TABLE semanas_lapso ENABLE ROW LEVEL SECURITY;

-- Lapsos: Todos los usuarios autenticados pueden leer
CREATE POLICY "Authenticated users can read lapsos" ON lapsos
  FOR SELECT
  TO authenticated
  USING (true);

-- Lapsos: Solo coordinadores y directivos pueden modificar
CREATE POLICY "Coordinadores and directivos can manage lapsos" ON lapsos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      JOIN auth.users u ON u.email = au.email
      WHERE u.id = auth.uid()
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- Semanas_lapso: Todos los usuarios autenticados pueden leer
CREATE POLICY "Authenticated users can read semanas_lapso" ON semanas_lapso
  FOR SELECT
  TO authenticated
  USING (true);

-- Semanas_lapso: Solo coordinadores y directivos pueden modificar
CREATE POLICY "Coordinadores and directivos can manage semanas_lapso" ON semanas_lapso
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      JOIN auth.users u ON u.email = au.email
      WHERE u.id = auth.uid()
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- ============================================
-- UPDATE TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_lapsos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lapsos_updated_at
  BEFORE UPDATE ON lapsos
  FOR EACH ROW
  EXECUTE FUNCTION update_lapsos_updated_at();

CREATE TRIGGER update_semanas_lapso_updated_at
  BEFORE UPDATE ON semanas_lapso
  FOR EACH ROW
  EXECUTE FUNCTION update_lapsos_updated_at();

