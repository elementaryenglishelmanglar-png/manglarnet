-- Migration: Create tables for Coordinator Dashboard widgets
-- This migration creates tables for guardias, eventos, and log_reuniones_coordinacion

-- ============================================
-- TABLE: maestra_guardias (Guard Duties)
-- ============================================
CREATE TABLE IF NOT EXISTS maestra_guardias (
  id_guardia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  id_docente UUID REFERENCES docentes(id_docente) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  descripcion TEXT NOT NULL,
  ubicacion TEXT,
  tipo_guardia TEXT CHECK (tipo_guardia IN ('Entrada', 'Recreo', 'Salida', 'Especial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardias_usuario ON maestra_guardias(id_usuario);
CREATE INDEX IF NOT EXISTS idx_guardias_docente ON maestra_guardias(id_docente);
CREATE INDEX IF NOT EXISTS idx_guardias_fecha ON maestra_guardias(fecha);

-- ============================================
-- TABLE: log_reuniones_coordinacion (Coordination Meeting Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS log_reuniones_coordinacion (
  id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_minuta UUID REFERENCES minutas_evaluacion(id_minuta) ON DELETE SET NULL,
  fecha_reunion DATE NOT NULL,
  grado TEXT NOT NULL,
  materia TEXT,
  tipo_alerta TEXT CHECK (tipo_alerta IN ('Académica', 'Conductual', 'Asistencia', 'Otro')),
  categoria TEXT NOT NULL, -- Ej: "Fallas en resta", "No sigue instrucciones"
  descripcion TEXT,
  frecuencia INTEGER DEFAULT 1, -- Cuántas veces aparece
  estudiantes_afectados TEXT[], -- Array de nombres o IDs
  acciones_sugeridas TEXT,
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Resuelto', 'Archivado')),
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_reuniones_fecha ON log_reuniones_coordinacion(fecha_reunion);
CREATE INDEX IF NOT EXISTS idx_log_reuniones_grado ON log_reuniones_coordinacion(grado);
CREATE INDEX IF NOT EXISTS idx_log_reuniones_tipo ON log_reuniones_coordinacion(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_log_reuniones_categoria ON log_reuniones_coordinacion(categoria);
CREATE INDEX IF NOT EXISTS idx_log_reuniones_estado ON log_reuniones_coordinacion(estado);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE maestra_guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_reuniones_coordinacion ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: maestra_guardias
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own guardias" ON maestra_guardias;
DROP POLICY IF EXISTS "Coordinadores can read all guardias" ON maestra_guardias;
DROP POLICY IF EXISTS "Coordinadores can manage guardias" ON maestra_guardias;

-- Users can read their own guardias
CREATE POLICY "Users can read their own guardias" ON maestra_guardias
  FOR SELECT TO authenticated
  USING (id_usuario = auth.uid());

-- Coordinadores and directivos can read all guardias
CREATE POLICY "Coordinadores can read all guardias" ON maestra_guardias
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- Coordinadores and directivos can manage guardias
CREATE POLICY "Coordinadores can manage guardias" ON maestra_guardias
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
-- RLS POLICIES: log_reuniones_coordinacion
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Coordinadores can read log_reuniones" ON log_reuniones_coordinacion;
DROP POLICY IF EXISTS "Coordinadores can manage log_reuniones" ON log_reuniones_coordinacion;

-- Coordinadores and directivos can read all logs
CREATE POLICY "Coordinadores can read log_reuniones" ON log_reuniones_coordinacion
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- Coordinadores and directivos can manage logs
CREATE POLICY "Coordinadores can manage log_reuniones" ON log_reuniones_coordinacion
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
-- TRIGGERS: Update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_maestra_guardias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_maestra_guardias_updated_at ON maestra_guardias;
CREATE TRIGGER update_maestra_guardias_updated_at
  BEFORE UPDATE ON maestra_guardias
  FOR EACH ROW
  EXECUTE FUNCTION update_maestra_guardias_updated_at();

CREATE OR REPLACE FUNCTION update_log_reuniones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_log_reuniones_updated_at ON log_reuniones_coordinacion;
CREATE TRIGGER update_log_reuniones_updated_at
  BEFORE UPDATE ON log_reuniones_coordinacion
  FOR EACH ROW
  EXECUTE FUNCTION update_log_reuniones_updated_at();

