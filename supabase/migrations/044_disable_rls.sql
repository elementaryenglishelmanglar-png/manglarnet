-- Migration: 044_disable_rls.sql
-- Description: NUCLEAR OPTION. Disables RLS on ALL tables.
--              Removes all security checks.
--              Use only when absolutely necessary to unblock development.

-- Disable RLS on all tables
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE docentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE clases DISABLE ROW LEVEL SECURITY;
ALTER TABLE aulas DISABLE ROW LEVEL SECURITY;
ALTER TABLE planificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE minutas_evaluacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE maestra_indicadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE lapsos DISABLE ROW LEVEL SECURITY;
ALTER TABLE semanas_lapso DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE maestra_guardias DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_reuniones_coordinacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_coordinador DISABLE ROW LEVEL SECURITY;
ALTER TABLE docente_materias DISABLE ROW LEVEL SECURITY;
ALTER TABLE clase_requisitos DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE restricciones_duras DISABLE ROW LEVEL SECURITY;
ALTER TABLE restricciones_suaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE generaciones_horarios DISABLE ROW LEVEL SECURITY;

-- Drop all policies to be clean (optional but good practice)
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
