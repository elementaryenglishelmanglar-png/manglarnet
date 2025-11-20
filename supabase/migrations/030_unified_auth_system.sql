-- Migration: Unified Authentication System
-- This migration creates a robust, unified authentication system
-- Replaces the dual authorized_users/usuarios system
-- Date: 2025-01-19

-- ============================================
-- STEP 1: Create Permission System
-- ============================================

-- Permission enum type
CREATE TYPE permission_type AS ENUM (
  -- Students
  'students.view',
  'students.create',
  'students.edit',
  'students.delete',
  
  -- Teachers
  'teachers.view',
  'teachers.create',
  'teachers.edit',
  'teachers.delete',
  
  -- Classes
  'classes.view',
  'classes.create',
  'classes.edit',
  'classes.delete',
  
  -- Planificaciones
  'plans.view',
  'plans.create',
  'plans.edit',
  'plans.delete',
  'plans.approve',
  
  -- Schedules
  'schedules.view',
  'schedules.create',
  'schedules.edit',
  'schedules.delete',
  
  -- Evaluations
  'evaluations.view',
  'evaluations.create',
  'evaluations.edit',
  'evaluations.delete',
  
  -- Calendar
  'calendar.view',
  'calendar.create',
  'calendar.edit',
  'calendar.delete',
  
  -- Users
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  
  -- System
  'system.admin'
);

-- Role permissions mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT PRIMARY KEY CHECK (role IN ('docente', 'coordinador', 'directivo')),
  permissions permission_type[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Recreate usuarios table (unified)
-- ============================================

-- Drop old usuarios table if it exists (backup first!)
DROP TABLE IF EXISTS usuarios CASCADE;

-- Create new unified usuarios table
CREATE TABLE usuarios (
  -- Identity (linked to Supabase Auth)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  
  -- Profile
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT,
  
  -- Authorization
  role TEXT NOT NULL CHECK (role IN ('docente', 'coordinador', 'directivo')),
  permissions JSONB DEFAULT '{}', -- For user-specific permission overrides
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_active ON usuarios(is_active);

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Insert Default Role Permissions
-- ============================================

INSERT INTO role_permissions (role, permissions) VALUES
  ('docente', ARRAY[
    'students.view',
    'teachers.view',
    'classes.view',
    'plans.view', 'plans.create', 'plans.edit',
    'schedules.view',
    'evaluations.view',
    'calendar.view'
  ]::permission_type[]),
  
  ('coordinador', ARRAY[
    'students.view', 'students.create', 'students.edit', 'students.delete',
    'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',
    'classes.view', 'classes.create', 'classes.edit', 'classes.delete',
    'plans.view', 'plans.create', 'plans.edit', 'plans.delete', 'plans.approve',
    'schedules.view', 'schedules.create', 'schedules.edit', 'schedules.delete',
    'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.delete',
    'calendar.view', 'calendar.create', 'calendar.edit', 'calendar.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'system.admin'
  ]::permission_type[]),
  
  ('directivo', ARRAY[
    'students.view', 'students.create', 'students.edit', 'students.delete',
    'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',
    'classes.view', 'classes.create', 'classes.edit', 'classes.delete',
    'plans.view', 'plans.approve',
    'schedules.view', 'schedules.create', 'schedules.edit', 'schedules.delete',
    'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.delete',
    'calendar.view', 'calendar.create', 'calendar.edit', 'calendar.delete',
    'users.view', 'users.create', 'users.edit'
  ]::permission_type[]);

-- ============================================
-- STEP 4: Helper Functions for Auth
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM usuarios WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION auth.has_permission(p_permission permission_type)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    JOIN role_permissions rp ON rp.role = u.role
    WHERE u.id = auth.uid()
    AND u.is_active = TRUE
    AND p_permission = ANY(rp.permissions)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is active
CREATE OR REPLACE FUNCTION auth.is_active_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get user with permissions (for login)
CREATE OR REPLACE FUNCTION get_user_with_permissions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  nombres TEXT,
  apellidos TEXT,
  role TEXT,
  permissions TEXT[],
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.nombres,
    u.apellidos,
    u.role,
    ARRAY(SELECT unnest(rp.permissions)::TEXT) as permissions,
    u.is_active
  FROM usuarios u
  JOIN role_permissions rp ON rp.role = u.role
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE usuarios
  SET last_login = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: RLS Policies for usuarios
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON usuarios
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON usuarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  );

-- Coordinadores and directivos can manage all users
CREATE POLICY "Admins can manage users" ON usuarios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  );

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile" ON usuarios
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM usuarios WHERE id = auth.uid())
  );

-- ============================================
-- STEP 6: Update RLS Policies for All Tables
-- ============================================

-- Drop old policies that reference authorized_users
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ALUMNOS (Students)
CREATE POLICY "View students" ON alumnos
  FOR SELECT TO authenticated
  USING (auth.has_permission('students.view'));

CREATE POLICY "Create students" ON alumnos
  FOR INSERT TO authenticated
  WITH CHECK (auth.has_permission('students.create'));

CREATE POLICY "Edit students" ON alumnos
  FOR UPDATE TO authenticated
  USING (auth.has_permission('students.edit'));

CREATE POLICY "Delete students" ON alumnos
  FOR DELETE TO authenticated
  USING (auth.has_permission('students.delete'));

-- DOCENTES (Teachers)
CREATE POLICY "View teachers" ON docentes
  FOR SELECT TO authenticated
  USING (auth.has_permission('teachers.view'));

CREATE POLICY "Create teachers" ON docentes
  FOR INSERT TO authenticated
  WITH CHECK (auth.has_permission('teachers.create'));

CREATE POLICY "Edit teachers" ON docentes
  FOR UPDATE TO authenticated
  USING (auth.has_permission('teachers.edit'));

CREATE POLICY "Delete teachers" ON docentes
  FOR DELETE TO authenticated
  USING (auth.has_permission('teachers.delete'));

-- CLASES (Classes)
CREATE POLICY "View classes" ON clases
  FOR SELECT TO authenticated
  USING (auth.has_permission('classes.view'));

CREATE POLICY "Create classes" ON clases
  FOR INSERT TO authenticated
  WITH CHECK (auth.has_permission('classes.create'));

CREATE POLICY "Edit classes" ON clases
  FOR UPDATE TO authenticated
  USING (auth.has_permission('classes.edit'));

CREATE POLICY "Delete classes" ON clases
  FOR DELETE TO authenticated
  USING (auth.has_permission('classes.delete'));

-- PLANIFICACIONES (Lesson Plans)
CREATE POLICY "View plans" ON planificaciones
  FOR SELECT TO authenticated
  USING (auth.has_permission('plans.view'));

CREATE POLICY "Create plans" ON planificaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.has_permission('plans.create')
    AND (
      -- Teachers can only create their own plans
      id_docente IN (SELECT id_docente FROM docentes WHERE id_usuario = auth.uid())
      OR auth.user_role() IN ('coordinador', 'directivo')
    )
  );

CREATE POLICY "Edit plans" ON planificaciones
  FOR UPDATE TO authenticated
  USING (
    auth.has_permission('plans.edit')
    AND (
      -- Teachers can only edit their own plans
      id_docente IN (SELECT id_docente FROM docentes WHERE id_usuario = auth.uid())
      OR auth.user_role() IN ('coordinador', 'directivo')
    )
  );

CREATE POLICY "Delete plans" ON planificaciones
  FOR DELETE TO authenticated
  USING (auth.has_permission('plans.delete'));

-- HORARIOS (Schedules)
CREATE POLICY "View schedules" ON horarios
  FOR SELECT TO authenticated
  USING (auth.has_permission('schedules.view'));

CREATE POLICY "Create schedules" ON horarios
  FOR INSERT TO authenticated
  WITH CHECK (auth.has_permission('schedules.create'));

CREATE POLICY "Edit schedules" ON horarios
  FOR UPDATE TO authenticated
  USING (auth.has_permission('schedules.edit'));

CREATE POLICY "Delete schedules" ON horarios
  FOR DELETE TO authenticated
  USING (auth.has_permission('schedules.delete'));

-- MINUTAS_EVALUACION (Evaluation Minutes)
CREATE POLICY "View evaluations" ON minutas_evaluacion
  FOR SELECT TO authenticated
  USING (auth.has_permission('evaluations.view'));

CREATE POLICY "Create evaluations" ON minutas_evaluacion
  FOR INSERT TO authenticated
  WITH CHECK (auth.has_permission('evaluations.create'));

CREATE POLICY "Edit evaluations" ON minutas_evaluacion
  FOR UPDATE TO authenticated
  USING (auth.has_permission('evaluations.edit'));

CREATE POLICY "Delete evaluations" ON minutas_evaluacion
  FOR DELETE TO authenticated
  USING (auth.has_permission('evaluations.delete'));

-- NOTIFICACIONES (Notifications)
CREATE POLICY "View own notifications" ON notificaciones
  FOR SELECT TO authenticated
  USING (
    recipient_id IN (SELECT id_docente FROM docentes WHERE id_usuario = auth.uid())
    OR auth.user_role() IN ('coordinador', 'directivo')
  );

CREATE POLICY "Create notifications" ON notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_role() IN ('coordinador', 'directivo'));

CREATE POLICY "Update own notifications" ON notificaciones
  FOR UPDATE TO authenticated
  USING (recipient_id IN (SELECT id_docente FROM docentes WHERE id_usuario = auth.uid()));

-- EVENTOS_CALENDARIO (Calendar Events)
CREATE POLICY "View calendar" ON eventos_calendario
  FOR SELECT TO authenticated
  USING (auth.has_permission('calendar.view'));

CREATE POLICY "Create calendar events" ON eventos_calendario
  FOR INSERT TO authenticated
  WITH CHECK (auth.has_permission('calendar.create'));

CREATE POLICY "Edit calendar events" ON eventos_calendario
  FOR UPDATE TO authenticated
  USING (auth.has_permission('calendar.edit'));

CREATE POLICY "Delete calendar events" ON eventos_calendario
  FOR DELETE TO authenticated
  USING (auth.has_permission('calendar.delete'));

-- LAPSOS (Academic Periods)
CREATE POLICY "View lapsos" ON lapsos
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage lapsos" ON lapsos
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

-- SEMANAS_LAPSO (Weeks)
CREATE POLICY "View semanas" ON semanas_lapso
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage semanas" ON semanas_lapso
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

-- GUARDIAS
CREATE POLICY "View guardias" ON maestra_guardias
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage guardias" ON maestra_guardias
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

-- LOG_REUNIONES_COORDINACION
CREATE POLICY "View logs" ON log_reuniones_coordinacion
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage logs" ON log_reuniones_coordinacion
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

-- TAREAS_COORDINADOR
CREATE POLICY "View own tasks" ON tareas_coordinador
  FOR SELECT TO authenticated
  USING (
    id_usuario = auth.uid()
    OR auth.user_role() IN ('coordinador', 'directivo')
  );

CREATE POLICY "Manage own tasks" ON tareas_coordinador
  FOR ALL TO authenticated
  USING (
    id_usuario = auth.uid()
    OR auth.user_role() IN ('coordinador', 'directivo')
  );

-- AULAS (Classrooms)
CREATE POLICY "View aulas" ON aulas
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage aulas" ON aulas
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

-- Schedule Optimizer Tables
CREATE POLICY "View docente_materias" ON docente_materias
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage docente_materias" ON docente_materias
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

CREATE POLICY "View clase_requisitos" ON clase_requisitos
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage clase_requisitos" ON clase_requisitos
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

CREATE POLICY "View configuracion_horarios" ON configuracion_horarios
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage configuracion_horarios" ON configuracion_horarios
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

CREATE POLICY "View restricciones_duras" ON restricciones_duras
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage restricciones_duras" ON restricciones_duras
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

CREATE POLICY "View restricciones_suaves" ON restricciones_suaves
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage restricciones_suaves" ON restricciones_suaves
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

CREATE POLICY "View generaciones_horarios" ON generaciones_horarios
  FOR SELECT TO authenticated
  USING (auth.is_active_user());

CREATE POLICY "Manage generaciones_horarios" ON generaciones_horarios
  FOR ALL TO authenticated
  USING (auth.user_role() IN ('coordinador', 'directivo'));

-- ============================================
-- STEP 7: Triggers
-- ============================================

-- Update updated_at timestamp
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: Comments
-- ============================================

COMMENT ON TABLE usuarios IS 'Unified users table with Supabase Auth integration';
COMMENT ON TABLE role_permissions IS 'Default permissions for each role';
COMMENT ON TYPE permission_type IS 'Granular permission types for the application';
COMMENT ON FUNCTION auth.has_permission IS 'Check if current user has a specific permission';
COMMENT ON FUNCTION auth.user_role IS 'Get current user role';
COMMENT ON FUNCTION get_user_with_permissions IS 'Get user profile with permissions for login';

-- ============================================
-- STEP 9: Grant Permissions
-- ============================================

-- Grant usage on permission type
GRANT USAGE ON TYPE permission_type TO authenticated;

-- Grant access to role_permissions
GRANT SELECT ON role_permissions TO authenticated;
