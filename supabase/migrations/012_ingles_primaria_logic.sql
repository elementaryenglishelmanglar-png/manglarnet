-- Migration: Add English special logic support for Primaria
-- This migration adds support for English classes grouped by level (Basic, Lower, Upper)
-- Each level has its own teacher, and students from 5th and 6th grade move to their level's classroom
-- English is taught 5 days a week, 10 blocks of 45 minutes per week
-- Skills: Reading, Writing, Speaking, Listening, Use of English, Phonics, Project

-- ============================================
-- MODIFY: clases table - Add English fields
-- ============================================
ALTER TABLE clases 
ADD COLUMN IF NOT EXISTS nivel_ingles TEXT CHECK (nivel_ingles IN ('Basic', 'Lower', 'Upper')),
ADD COLUMN IF NOT EXISTS skill_rutina TEXT CHECK (skill_rutina IN ('Reading', 'Writing', 'Speaking', 'Listening', 'Use of English', 'Phonics', 'Project')),
ADD COLUMN IF NOT EXISTS es_ingles_primaria BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS es_proyecto BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clases_nivel_ingles ON clases(nivel_ingles) WHERE nivel_ingles IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clases_skill_rutina ON clases(skill_rutina) WHERE skill_rutina IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clases_ingles_primaria ON clases(es_ingles_primaria) WHERE es_ingles_primaria = TRUE;
CREATE INDEX IF NOT EXISTS idx_clases_grado_nivel ON clases(grado_asignado, nivel_ingles) WHERE nivel_ingles IS NOT NULL;

-- ============================================
-- TABLE: configuracion_ingles_primaria
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion_ingles_primaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_escolar TEXT NOT NULL,
  grado TEXT NOT NULL,
  niveles_disponibles TEXT[] DEFAULT ARRAY['Basic', 'Lower', 'Upper'],
  skills_por_semana JSONB NOT NULL, -- [{"dia": 1, "skill": "Reading", "bloques": 2}, ...]
  duracion_bloque_minutos INTEGER DEFAULT 45,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano_escolar, grado)
);

CREATE INDEX IF NOT EXISTS idx_config_ingles_ano_grado ON configuracion_ingles_primaria(ano_escolar, grado);
CREATE INDEX IF NOT EXISTS idx_config_ingles_activa ON configuracion_ingles_primaria(activa) WHERE activa = TRUE;

-- ============================================
-- TABLE: asignacion_docente_nivel_ingles
-- ============================================
CREATE TABLE IF NOT EXISTS asignacion_docente_nivel_ingles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_docente UUID NOT NULL REFERENCES docentes(id_docente) ON DELETE CASCADE,
  nivel_ingles TEXT NOT NULL CHECK (nivel_ingles IN ('Basic', 'Lower', 'Upper')),
  ano_escolar TEXT NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_docente, nivel_ingles, ano_escolar)
);

CREATE INDEX IF NOT EXISTS idx_asignacion_docente_nivel ON asignacion_docente_nivel_ingles(id_docente, nivel_ingles);
CREATE INDEX IF NOT EXISTS idx_asignacion_docente_ano ON asignacion_docente_nivel_ingles(ano_escolar);

-- ============================================
-- TABLE: asignacion_aula_nivel_ingles
-- ============================================
CREATE TABLE IF NOT EXISTS asignacion_aula_nivel_ingles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aula UUID NOT NULL REFERENCES aulas(id_aula) ON DELETE CASCADE,
  nivel_ingles TEXT NOT NULL CHECK (nivel_ingles IN ('Basic', 'Lower', 'Upper')),
  ano_escolar TEXT NOT NULL,
  prioridad INTEGER DEFAULT 1, -- Para ordenar aulas preferidas (menor = más preferida)
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asignacion_aula_nivel ON asignacion_aula_nivel_ingles(id_aula, nivel_ingles);
CREATE INDEX IF NOT EXISTS idx_asignacion_aula_ano ON asignacion_aula_nivel_ingles(ano_escolar);
CREATE INDEX IF NOT EXISTS idx_asignacion_aula_prioridad ON asignacion_aula_nivel_ingles(nivel_ingles, prioridad) WHERE activa = TRUE;

-- ============================================
-- SEED: Insert aulas for Primaria (if they don't exist)
-- ============================================
INSERT INTO aulas (nombre, tipo_aula, capacidad, equipamiento, activa)
SELECT * FROM (VALUES
  ('Salón 1', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Salón 2', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Salón 3', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Salón 4', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Salón 5', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Salón 6', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Salón Idiomas', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Biblioteca Primaria', 'Biblioteca', 40, '{}'::jsonb, true),
  ('Biblioteca Bachillerato', 'Biblioteca', 40, '{}'::jsonb, true),
  ('Salón Ajedrez', 'Aula Regular', 25, '{}'::jsonb, true),
  ('Salón Música', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Sala Computación BCH', 'Sala de Computación', 30, '{"computadoras": 30}'::jsonb, true),
  ('Sala Computación INTG', 'Sala de Computación', 30, '{"computadoras": 30}'::jsonb, true),
  ('Salón de Arte', 'Taller', 25, '{}'::jsonb, true),
  ('Salón Usos Múltiples', 'Aula Regular', 50, '{}'::jsonb, true)
) AS v(nombre, tipo_aula, capacidad, equipamiento, activa)
WHERE NOT EXISTS (
  SELECT 1 FROM aulas WHERE aulas.nombre = v.nombre
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE configuracion_ingles_primaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignacion_docente_nivel_ingles ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignacion_aula_nivel_ingles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can read configuracion_ingles_primaria" ON configuracion_ingles_primaria
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage configuracion_ingles_primaria" ON configuracion_ingles_primaria
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

CREATE POLICY "Authenticated users can read asignacion_docente_nivel_ingles" ON asignacion_docente_nivel_ingles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage asignacion_docente_nivel_ingles" ON asignacion_docente_nivel_ingles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

CREATE POLICY "Authenticated users can read asignacion_aula_nivel_ingles" ON asignacion_aula_nivel_ingles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage asignacion_aula_nivel_ingles" ON asignacion_aula_nivel_ingles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- ============================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_config_ingles_updated_at
  BEFORE UPDATE ON configuracion_ingles_primaria
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asignacion_docente_nivel_updated_at
  BEFORE UPDATE ON asignacion_docente_nivel_ingles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asignacion_aula_nivel_updated_at
  BEFORE UPDATE ON asignacion_aula_nivel_ingles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

