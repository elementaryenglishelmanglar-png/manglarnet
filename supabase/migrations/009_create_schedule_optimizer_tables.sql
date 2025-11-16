-- Migration: Create tables for Schedule Optimizer
-- This migration creates all tables needed for the automated schedule generation system

-- ============================================
-- TABLE: aulas (Classrooms/Physical Rooms)
-- ============================================
CREATE TABLE IF NOT EXISTS aulas (
  id_aula UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  tipo_aula TEXT NOT NULL CHECK (tipo_aula IN ('Aula Regular', 'Laboratorio', 'Sala de Computación', 'Gimnasio', 'Biblioteca', 'Auditorio', 'Taller')),
  capacidad INTEGER NOT NULL CHECK (capacidad > 0),
  equipamiento JSONB DEFAULT '{}',
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aulas_tipo ON aulas(tipo_aula);
CREATE INDEX IF NOT EXISTS idx_aulas_activa ON aulas(activa);

-- ============================================
-- TABLE: docente_materias (Teacher Subject Capabilities)
-- ============================================
CREATE TABLE IF NOT EXISTS docente_materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_docente UUID NOT NULL REFERENCES docentes(id_docente) ON DELETE CASCADE,
  nombre_materia TEXT NOT NULL,
  nivel_prioridad INTEGER DEFAULT 1 CHECK (nivel_prioridad BETWEEN 1 AND 3), -- 1 = puede dar, 2 = prefiere, 3 = especialidad
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_docente, nombre_materia)
);

CREATE INDEX IF NOT EXISTS idx_docente_materias_docente ON docente_materias(id_docente);
CREATE INDEX IF NOT EXISTS idx_docente_materias_materia ON docente_materias(nombre_materia);

-- ============================================
-- TABLE: clase_requisitos (Class Requirements)
-- ============================================
CREATE TABLE IF NOT EXISTS clase_requisitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase UUID NOT NULL REFERENCES clases(id_clase) ON DELETE CASCADE,
  tipo_aula_requerida TEXT,
  id_aula_especifica UUID REFERENCES aulas(id_aula),
  equipamiento_requerido JSONB DEFAULT '{}',
  max_alumnos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_clase)
);

CREATE INDEX IF NOT EXISTS idx_clase_requisitos_clase ON clase_requisitos(id_clase);
CREATE INDEX IF NOT EXISTS idx_clase_requisitos_aula ON clase_requisitos(id_aula_especifica);

-- ============================================
-- TABLE: configuracion_horarios (Schedule Configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_escolar TEXT NOT NULL,
  bloques_horarios JSONB NOT NULL, -- [{"inicio": "08:00", "fin": "09:00", "nombre": "Bloque 1"}, ...]
  dias_semana TEXT[] DEFAULT ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  semanas_totales INTEGER DEFAULT 18 CHECK (semanas_totales > 0),
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_horarios_ano ON configuracion_horarios(ano_escolar);
CREATE INDEX IF NOT EXISTS idx_config_horarios_activa ON configuracion_horarios(activa) WHERE activa = TRUE;

-- ============================================
-- TABLE: restricciones_duras (Hard Constraints)
-- ============================================
CREATE TABLE IF NOT EXISTS restricciones_duras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'docente_no_disponible',
    'aula_no_disponible',
    'clase_fija',
    'docente_max_horas_dia',
    'docente_min_horas_dia',
    'grado_no_disponible',
    'docente_max_horas_semana',
    'docente_min_horas_semana'
  )),
  id_docente UUID REFERENCES docentes(id_docente),
  id_clase UUID REFERENCES clases(id_clase),
  id_aula UUID REFERENCES aulas(id_aula),
  grado TEXT,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 1 AND 5),
  hora_inicio TEXT,
  hora_fin TEXT,
  valor INTEGER, -- Para max/min horas
  activa BOOLEAN DEFAULT TRUE,
  ano_escolar TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rest_duras_tipo ON restricciones_duras(tipo);
CREATE INDEX IF NOT EXISTS idx_rest_duras_docente ON restricciones_duras(id_docente);
CREATE INDEX IF NOT EXISTS idx_rest_duras_ano ON restricciones_duras(ano_escolar);
CREATE INDEX IF NOT EXISTS idx_rest_duras_activa ON restricciones_duras(activa) WHERE activa = TRUE;

-- ============================================
-- TABLE: restricciones_suaves (Soft Constraints/Preferences)
-- ============================================
CREATE TABLE IF NOT EXISTS restricciones_suaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'docente_preferencia_horario',
    'docente_preferencia_dia',
    'materia_preferencia_orden',
    'docente_agrupar_horas',
    'materia_preferencia_horario',
    'docente_evitar_huecos'
  )),
  id_docente UUID REFERENCES docentes(id_docente),
  id_clase UUID REFERENCES clases(id_clase),
  nombre_materia TEXT,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 1 AND 5),
  hora_inicio TEXT,
  hora_fin TEXT,
  preferencia TEXT CHECK (preferencia IN ('prefiere', 'evita')),
  peso INTEGER DEFAULT 1 CHECK (peso BETWEEN 1 AND 10), -- 1-10, mayor = más importante
  relacion_materia TEXT, -- Para "no después de X"
  activa BOOLEAN DEFAULT TRUE,
  ano_escolar TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rest_suaves_tipo ON restricciones_suaves(tipo);
CREATE INDEX IF NOT EXISTS idx_rest_suaves_docente ON restricciones_suaves(id_docente);
CREATE INDEX IF NOT EXISTS idx_rest_suaves_ano ON restricciones_suaves(ano_escolar);
CREATE INDEX IF NOT EXISTS idx_rest_suaves_activa ON restricciones_suaves(activa) WHERE activa = TRUE;

-- ============================================
-- TABLE: generaciones_horarios (Schedule Generation History)
-- ============================================
CREATE TABLE IF NOT EXISTS generaciones_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_escolar TEXT NOT NULL,
  semana INTEGER NOT NULL CHECK (semana > 0),
  estado TEXT NOT NULL CHECK (estado IN ('generando', 'completado', 'fallido', 'aplicado', 'cancelado')),
  configuracion JSONB NOT NULL, -- Snapshot de restricciones usadas
  resultado JSONB, -- Horarios generados
  errores TEXT[],
  advertencias TEXT[],
  tiempo_ejecucion_ms INTEGER,
  estadisticas JSONB, -- {violaciones_restricciones_suaves: 5, factible: true, etc.}
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_horarios_ano_semana ON generaciones_horarios(ano_escolar, semana);
CREATE INDEX IF NOT EXISTS idx_gen_horarios_estado ON generaciones_horarios(estado);
CREATE INDEX IF NOT EXISTS idx_gen_horarios_creado_por ON generaciones_horarios(creado_por);

-- ============================================
-- MODIFY: horarios table - Add aula column
-- ============================================
ALTER TABLE horarios 
ADD COLUMN IF NOT EXISTS id_aula UUID REFERENCES aulas(id_aula);

CREATE INDEX IF NOT EXISTS idx_horarios_aula ON horarios(id_aula);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE docente_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE clase_requisitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricciones_duras ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricciones_suaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE generaciones_horarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: aulas
-- ============================================
CREATE POLICY "Authenticated users can read aulas" ON aulas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage aulas" ON aulas
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
-- RLS POLICIES: docente_materias
-- ============================================
CREATE POLICY "Authenticated users can read docente_materias" ON docente_materias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage docente_materias" ON docente_materias
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
-- RLS POLICIES: clase_requisitos
-- ============================================
CREATE POLICY "Authenticated users can read clase_requisitos" ON clase_requisitos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage clase_requisitos" ON clase_requisitos
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
-- RLS POLICIES: configuracion_horarios
-- ============================================
CREATE POLICY "Authenticated users can read configuracion_horarios" ON configuracion_horarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage configuracion_horarios" ON configuracion_horarios
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
-- RLS POLICIES: restricciones_duras
-- ============================================
CREATE POLICY "Authenticated users can read restricciones_duras" ON restricciones_duras
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage restricciones_duras" ON restricciones_duras
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
-- RLS POLICIES: restricciones_suaves
-- ============================================
CREATE POLICY "Authenticated users can read restricciones_suaves" ON restricciones_suaves
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage restricciones_suaves" ON restricciones_suaves
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
-- RLS POLICIES: generaciones_horarios
-- ============================================
CREATE POLICY "Authenticated users can read generaciones_horarios" ON generaciones_horarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage generaciones_horarios" ON generaciones_horarios
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
CREATE TRIGGER update_aulas_updated_at
  BEFORE UPDATE ON aulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_horarios_updated_at
  BEFORE UPDATE ON configuracion_horarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restricciones_duras_updated_at
  BEFORE UPDATE ON restricciones_duras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restricciones_suaves_updated_at
  BEFORE UPDATE ON restricciones_suaves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generaciones_horarios_updated_at
  BEFORE UPDATE ON generaciones_horarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

