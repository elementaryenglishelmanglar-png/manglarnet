-- Migration: Create main application tables
-- This migration creates all tables needed for the ManglarNet application

-- ============================================
-- TABLE: alumnos (Students)
-- ============================================
CREATE TABLE IF NOT EXISTS alumnos (
  id_alumno UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email_alumno TEXT,
  lugar_nacimiento TEXT,
  estado TEXT,
  fecha_nacimiento DATE,
  cedula_escolar TEXT,
  condicion TEXT,
  hermanos TEXT[] DEFAULT '{}',
  genero TEXT CHECK (genero IN ('Niño', 'Niña')),
  salon TEXT NOT NULL,
  grupo TEXT CHECK (grupo IN ('Grupo 1', 'Grupo 2')),
  info_madre JSONB DEFAULT '{}',
  info_padre JSONB DEFAULT '{}',
  nivel_ingles TEXT CHECK (nivel_ingles IN ('Basic', 'Lower', 'Upper', 'Advanced', 'IB', '')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumnos_salon ON alumnos(salon);
CREATE INDEX IF NOT EXISTS idx_alumnos_email ON alumnos(email_alumno);

-- ============================================
-- TABLE: docentes (Teachers)
-- ============================================
CREATE TABLE IF NOT EXISTS docentes (
  id_docente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  especialidad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docentes_usuario ON docentes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_docentes_email ON docentes(email);

-- ============================================
-- TABLE: clases (Classes)
-- ============================================
CREATE TABLE IF NOT EXISTS clases (
  id_clase UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_materia TEXT NOT NULL,
  grado_asignado TEXT NOT NULL,
  id_docente_asignado UUID REFERENCES docentes(id_docente) ON DELETE SET NULL,
  student_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clases_docente ON clases(id_docente_asignado);
CREATE INDEX IF NOT EXISTS idx_clases_grado ON clases(grado_asignado);

-- ============================================
-- TABLE: planificaciones (Lesson Plans)
-- ============================================
CREATE TABLE IF NOT EXISTS planificaciones (
  id_planificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_docente UUID NOT NULL REFERENCES docentes(id_docente) ON DELETE CASCADE,
  id_clase UUID NOT NULL REFERENCES clases(id_clase) ON DELETE CASCADE,
  semana INTEGER NOT NULL,
  lapso TEXT NOT NULL CHECK (lapso IN ('I Lapso', 'II Lapso', 'III Lapso')),
  ano_escolar TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  competencia_indicadores TEXT,
  inicio TEXT,
  desarrollo TEXT,
  cierre TEXT,
  recursos_links TEXT,
  status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Enviado', 'Revisado', 'Aprobado')),
  observaciones TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planificaciones_docente ON planificaciones(id_docente);
CREATE INDEX IF NOT EXISTS idx_planificaciones_clase ON planificaciones(id_clase);
CREATE INDEX IF NOT EXISTS idx_planificaciones_ano_lapso ON planificaciones(ano_escolar, lapso);

-- ============================================
-- TABLE: horarios (Schedules)
-- ============================================
CREATE TABLE IF NOT EXISTS horarios (
  id_horario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_docente UUID REFERENCES docentes(id_docente) ON DELETE CASCADE,
  id_clase UUID REFERENCES clases(id_clase) ON DELETE CASCADE,
  grado TEXT NOT NULL,
  semana INTEGER NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 5),
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  evento_descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grado, semana, dia_semana, hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_horarios_grado_semana ON horarios(grado, semana);
CREATE INDEX IF NOT EXISTS idx_horarios_docente ON horarios(id_docente);
CREATE INDEX IF NOT EXISTS idx_horarios_clase ON horarios(id_clase);

-- ============================================
-- TABLE: minutas_evaluacion (Evaluation Minutes)
-- ============================================
CREATE TABLE IF NOT EXISTS minutas_evaluacion (
  id_minuta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_escolar TEXT NOT NULL,
  lapso TEXT NOT NULL,
  evaluacion TEXT NOT NULL,
  grado TEXT NOT NULL,
  materia TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  datos_alumnos JSONB NOT NULL DEFAULT '[]',
  analisis_ia JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_minutas_grado ON minutas_evaluacion(grado);
CREATE INDEX IF NOT EXISTS idx_minutas_ano_lapso ON minutas_evaluacion(ano_escolar, lapso);

-- ============================================
-- TABLE: notificaciones (Notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES docentes(id_docente) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  link_to JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_recipient ON notificaciones(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_read ON notificaciones(is_read);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE minutas_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: alumnos
-- ============================================
CREATE POLICY "Authenticated users can read alumnos" ON alumnos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage alumnos" ON alumnos
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
-- RLS POLICIES: docentes
-- ============================================
CREATE POLICY "Authenticated users can read docentes" ON docentes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage docentes" ON docentes
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
-- RLS POLICIES: clases
-- ============================================
CREATE POLICY "Authenticated users can read clases" ON clases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage clases" ON clases
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
-- RLS POLICIES: planificaciones
-- ============================================
CREATE POLICY "Authenticated users can read planificaciones" ON planificaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Docentes can manage their own planificaciones" ON planificaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON au.email = (SELECT email FROM auth.users WHERE id = d.id_usuario)
      WHERE d.id_docente = planificaciones.id_docente
      AND au.email = (auth.jwt() ->> 'email')
    )
    OR EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON au.email = (SELECT email FROM auth.users WHERE id = d.id_usuario)
      WHERE d.id_docente = planificaciones.id_docente
      AND au.email = (auth.jwt() ->> 'email')
    )
    OR EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- ============================================
-- RLS POLICIES: horarios
-- ============================================
CREATE POLICY "Authenticated users can read horarios" ON horarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage horarios" ON horarios
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
-- RLS POLICIES: minutas_evaluacion
-- ============================================
CREATE POLICY "Authenticated users can read minutas_evaluacion" ON minutas_evaluacion
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinadores and directivos can manage minutas_evaluacion" ON minutas_evaluacion
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
-- RLS POLICIES: notificaciones
-- ============================================
CREATE POLICY "Users can read their own notifications" ON notificaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON au.email = (SELECT email FROM auth.users WHERE id = d.id_usuario)
      WHERE d.id_docente = notificaciones.recipient_id
      AND au.email = (auth.jwt() ->> 'email')
    )
    OR EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

CREATE POLICY "Coordinadores and directivos can create notifications" ON notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

CREATE POLICY "Users can update their own notifications" ON notificaciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON au.email = (SELECT email FROM auth.users WHERE id = d.id_usuario)
      WHERE d.id_docente = notificaciones.recipient_id
      AND au.email = (auth.jwt() ->> 'email')
    )
  );

-- ============================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_alumnos_updated_at
  BEFORE UPDATE ON alumnos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_docentes_updated_at
  BEFORE UPDATE ON docentes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clases_updated_at
  BEFORE UPDATE ON clases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planificaciones_updated_at
  BEFORE UPDATE ON planificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horarios_updated_at
  BEFORE UPDATE ON horarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_minutas_evaluacion_updated_at
  BEFORE UPDATE ON minutas_evaluacion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

