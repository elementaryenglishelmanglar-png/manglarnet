-- Migration: 040_simplify_security_policies.sql
-- Description: Complete restructure of RLS policies for simplicity and effectiveness.
--              Coordinators/Directivos: Full Access.
--              Docentes: Read-Only (Structural) + Write (Schedules, Own Plans/Evaluations).

-- ============================================
-- 1. Helper Functions (in PUBLIC schema)
-- ============================================

-- Ensure user_role() exists and is reliable
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM usuarios WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ensure is_active_user() exists
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 2. Drop Existing Policies (Clean Slate)
-- ============================================

DO $$ 
DECLARE
  tables text[] := ARRAY[
    'usuarios', 'alumnos', 'docentes', 'clases', 'aulas', 
    'planificaciones', 'horarios', 'minutas_evaluacion', 
    'maestra_indicadores', 'lapsos', 'semanas_lapso', 
    'eventos_calendario', 'notificaciones', 'maestra_guardias',
    'log_reuniones_coordinacion', 'tareas_coordinador',
    'docente_materias', 'clase_requisitos', 'configuracion_horarios',
    'restricciones_duras', 'restricciones_suaves', 'generaciones_horarios'
  ];
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = t AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 3. Apply Simplified Policies
-- ============================================

-- --------------------------------------------
-- A. Structural Tables (Read-Only for Teachers)
-- Tables: alumnos, docentes, clases, aulas, maestra_indicadores, lapsos, semanas_lapso
-- --------------------------------------------

-- ALUMNOS
CREATE POLICY "Coordinators manage students" ON alumnos FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view students" ON alumnos FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- DOCENTES
CREATE POLICY "Coordinators manage teachers" ON docentes FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view teachers" ON docentes FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- CLASES
CREATE POLICY "Coordinators manage classes" ON clases FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view classes" ON clases FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- AULAS
CREATE POLICY "Coordinators manage rooms" ON aulas FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view rooms" ON aulas FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- MAESTRA_INDICADORES
CREATE POLICY "Coordinators manage indicators" ON maestra_indicadores FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view indicators" ON maestra_indicadores FOR SELECT TO authenticated USING (public.user_role() = 'docente');
-- Note: If teachers need to create indicators, uncomment below:
-- CREATE POLICY "Teachers manage indicators" ON maestra_indicadores FOR ALL TO authenticated USING (public.user_role() = 'docente');

-- LAPSOS
CREATE POLICY "Coordinators manage lapsos" ON lapsos FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view lapsos" ON lapsos FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- SEMANAS_LAPSO
CREATE POLICY "Coordinators manage weeks" ON semanas_lapso FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view weeks" ON semanas_lapso FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- --------------------------------------------
-- B. Operational Tables (Write Own for Teachers)
-- Tables: planificaciones, minutas_evaluacion
-- --------------------------------------------

-- PLANIFICACIONES
CREATE POLICY "Coordinators manage plans" ON planificaciones FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view plans" ON planificaciones FOR SELECT TO authenticated USING (public.user_role() = 'docente');
CREATE POLICY "Teachers manage own plans" ON planificaciones FOR ALL TO authenticated 
USING (public.user_role() = 'docente' AND id_docente IN (SELECT id_docente FROM docentes WHERE id_usuario = auth.uid()))
WITH CHECK (public.user_role() = 'docente' AND id_docente IN (SELECT id_docente FROM docentes WHERE id_usuario = auth.uid()));

-- MINUTAS_EVALUACION
CREATE POLICY "Coordinators manage evaluations" ON minutas_evaluacion FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view evaluations" ON minutas_evaluacion FOR SELECT TO authenticated USING (public.user_role() = 'docente');
CREATE POLICY "Teachers manage own evaluations" ON minutas_evaluacion FOR ALL TO authenticated 
USING (public.user_role() = 'docente' AND created_by = auth.uid())
WITH CHECK (public.user_role() = 'docente' AND created_by = auth.uid());

-- --------------------------------------------
-- C. Schedules (Special Case: Teachers can Edit)
-- Tables: horarios
-- --------------------------------------------

-- HORARIOS
CREATE POLICY "Coordinators manage schedules" ON horarios FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view schedules" ON horarios FOR SELECT TO authenticated USING (public.user_role() = 'docente');
CREATE POLICY "Teachers update schedules" ON horarios FOR UPDATE TO authenticated 
USING (public.user_role() = 'docente')
WITH CHECK (public.user_role() = 'docente');

-- --------------------------------------------
-- D. User Management
-- Tables: usuarios
-- --------------------------------------------

-- USUARIOS
CREATE POLICY "Coordinators manage users" ON usuarios FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Users view own profile" ON usuarios FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON usuarios FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- --------------------------------------------
-- E. Other Tables
-- --------------------------------------------

-- NOTIFICACIONES
CREATE POLICY "Coordinators manage notifications" ON notificaciones FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Users view own notifications" ON notificaciones FOR SELECT TO authenticated 
USING (recipient_id IN (SELECT id_docente FROM docentes WHERE id_usuario = auth.uid()) OR public.user_role() IN ('coordinador', 'directivo'));

-- EVENTOS_CALENDARIO
CREATE POLICY "Coordinators manage calendar" ON eventos_calendario FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view calendar" ON eventos_calendario FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- MAESTRA_GUARDIAS
CREATE POLICY "Coordinators manage guardias" ON maestra_guardias FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view guardias" ON maestra_guardias FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- LOG_REUNIONES_COORDINACION
CREATE POLICY "Coordinators manage logs" ON log_reuniones_coordinacion FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view logs" ON log_reuniones_coordinacion FOR SELECT TO authenticated USING (public.user_role() = 'docente');

-- TAREAS_COORDINADOR
CREATE POLICY "Coordinators manage tasks" ON tareas_coordinador FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Users manage own tasks" ON tareas_coordinador FOR ALL TO authenticated USING (id_usuario = auth.uid());

-- SCHEDULE OPTIMIZER TABLES (Read Only for Teachers)
CREATE POLICY "Coordinators manage optimizer" ON docente_materias FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view optimizer" ON docente_materias FOR SELECT TO authenticated USING (public.user_role() = 'docente');

CREATE POLICY "Coordinators manage reqs" ON clase_requisitos FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view reqs" ON clase_requisitos FOR SELECT TO authenticated USING (public.user_role() = 'docente');

CREATE POLICY "Coordinators manage config" ON configuracion_horarios FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view config" ON configuracion_horarios FOR SELECT TO authenticated USING (public.user_role() = 'docente');

CREATE POLICY "Coordinators manage hard constraints" ON restricciones_duras FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view hard constraints" ON restricciones_duras FOR SELECT TO authenticated USING (public.user_role() = 'docente');

CREATE POLICY "Coordinators manage soft constraints" ON restricciones_suaves FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view soft constraints" ON restricciones_suaves FOR SELECT TO authenticated USING (public.user_role() = 'docente');

CREATE POLICY "Coordinators manage generations" ON generaciones_horarios FOR ALL TO authenticated USING (public.user_role() IN ('coordinador', 'directivo'));
CREATE POLICY "Teachers view generations" ON generaciones_horarios FOR SELECT TO authenticated USING (public.user_role() = 'docente');
