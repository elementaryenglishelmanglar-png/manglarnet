-- ============================================
-- RESTAURAR RLS EN TODAS LAS TABLAS CON POLÍTICAS CORRECTAS
-- ============================================
-- Este script restaura RLS con políticas que funcionan con el sistema de usuarios
-- ============================================

-- PASO 1: Asegurar que la función user_has_role existe
CREATE OR REPLACE FUNCTION user_has_role(p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO v_role
  FROM usuarios
  WHERE id = v_user_id
  AND is_active = TRUE
  LIMIT 1;
  
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_role = ANY(p_roles);
END;
$$;

-- ============================================
-- PASO 2: Restaurar RLS en usuarios (política simple)
-- ============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "users_select_own" ON usuarios;
DROP POLICY IF EXISTS "allow_all_authenticated" ON usuarios;
DROP POLICY IF EXISTS "super_admin_manage_all_users" ON usuarios;
DROP POLICY IF EXISTS "super_admins_read_all" ON usuarios;
DROP POLICY IF EXISTS "super_admins_manage_all" ON usuarios;
DROP POLICY IF EXISTS "coordinadores_directivos_read_all" ON usuarios;
DROP POLICY IF EXISTS "coordinadores_directivos_manage_all" ON usuarios;

-- Política: Usuarios pueden leer su propio registro (CRÍTICA para login)
CREATE POLICY "users_select_own" ON usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política: Coordinadores y Directivos pueden leer todos los usuarios
CREATE POLICY "coordinadores_directivos_read_all" ON usuarios
  FOR SELECT
  TO authenticated
  USING (user_has_role(ARRAY['coordinador', 'directivo']));

-- Política: Coordinadores y Directivos pueden gestionar todos los usuarios
CREATE POLICY "coordinadores_directivos_manage_all" ON usuarios
  FOR ALL
  TO authenticated
  USING (user_has_role(ARRAY['coordinador', 'directivo']))
  WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));

-- ============================================
-- PASO 3: Restaurar RLS en alumnos
-- ============================================
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage alumnos" ON alumnos;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage alumnos" ON alumnos;

CREATE POLICY "Admins can manage alumnos" ON alumnos
  FOR ALL TO authenticated
  USING (user_has_role(ARRAY['coordinador', 'directivo']))
  WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));

-- ============================================
-- PASO 4: Restaurar RLS en docentes
-- ============================================
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage docentes" ON docentes;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage docentes" ON docentes;

CREATE POLICY "Admins can manage docentes" ON docentes
  FOR ALL TO authenticated
  USING (user_has_role(ARRAY['coordinador', 'directivo']))
  WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));

-- Política: Docentes pueden leer su propio registro
CREATE POLICY "Docentes can read own" ON docentes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.id = docentes.id_usuario
    )
  );

-- ============================================
-- PASO 5: Restaurar RLS en clases
-- ============================================
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage clases" ON clases;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage clases" ON clases;

CREATE POLICY "Admins can manage clases" ON clases
  FOR ALL TO authenticated
  USING (user_has_role(ARRAY['coordinador', 'directivo']))
  WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));

-- ============================================
-- PASO 6: Restaurar RLS en planificaciones
-- ============================================
ALTER TABLE planificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Docentes and Admins can manage planificaciones" ON planificaciones;
DROP POLICY IF EXISTS "Docentes can manage their own planificaciones" ON planificaciones;

CREATE POLICY "Docentes and Admins can manage planificaciones" ON planificaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM docentes d WHERE d.id_docente = planificaciones.id_docente AND d.id_usuario = auth.uid())
    OR user_has_role(ARRAY['coordinador', 'directivo'])
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM docentes d WHERE d.id_docente = planificaciones.id_docente AND d.id_usuario = auth.uid())
    OR user_has_role(ARRAY['coordinador', 'directivo'])
  );

-- ============================================
-- PASO 7: Restaurar RLS en horarios
-- ============================================
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage horarios" ON horarios;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage horarios" ON horarios;

CREATE POLICY "Admins can manage horarios" ON horarios
  FOR ALL TO authenticated
  USING (user_has_role(ARRAY['coordinador', 'directivo']))
  WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));

-- ============================================
-- PASO 8: Restaurar RLS en minutas_evaluacion
-- ============================================
ALTER TABLE minutas_evaluacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage minutas_evaluacion" ON minutas_evaluacion;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage minutas_evaluacion" ON minutas_evaluacion;

CREATE POLICY "Admins can manage minutas_evaluacion" ON minutas_evaluacion
  FOR ALL TO authenticated
  USING (user_has_role(ARRAY['coordinador', 'directivo']))
  WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));

-- ============================================
-- PASO 9: Restaurar RLS en notificaciones
-- ============================================
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON notificaciones;
DROP POLICY IF EXISTS "Admins can create notifications" ON notificaciones;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificaciones;

CREATE POLICY "Users can read own notifications" ON notificaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM docentes d WHERE d.id_docente = notificaciones.recipient_id AND d.id_usuario = auth.uid())
    OR user_has_role(ARRAY['coordinador', 'directivo'])
  );

CREATE POLICY "Admins can create notifications" ON notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));

CREATE POLICY "Users can update own notifications" ON notificaciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM docentes d WHERE d.id_docente = notificaciones.recipient_id AND d.id_usuario = auth.uid())
    OR user_has_role(ARRAY['coordinador', 'directivo'])
  );

-- ============================================
-- PASO 10: Restaurar RLS en aulas
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'aulas') THEN
        ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Admins can manage aulas" ON aulas;
        
        CREATE POLICY "Admins can manage aulas" ON aulas
          FOR ALL TO authenticated
          USING (user_has_role(ARRAY['coordinador', 'directivo']))
          WITH CHECK (user_has_role(ARRAY['coordinador', 'directivo']));
    END IF;
END $$;

-- ============================================
-- PASO 11: Restaurar RLS en otras tablas (si existen)
-- ============================================
DO $$
DECLARE
    tbl_name TEXT;
    tables_to_restore TEXT[] := ARRAY[
        'eventos_calendario',
        'tareas_coordinador',
        'guardias',
        'maestra_guardias',
        'log_reuniones_coordinacion',
        'lapsos',
        'semanas_lapso',
        'configuracion_ingles_primaria',
        'asignacion_docente_nivel_ingles',
        'asignacion_aula_nivel_ingles'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_restore
    LOOP
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables t
            WHERE t.table_schema = 'public' 
            AND t.table_name = tbl_name
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
            
            -- Eliminar políticas antiguas
            EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %s" ON %I', tbl_name, tbl_name);
            EXECUTE format('DROP POLICY IF EXISTS "Coordinadores and directivos can manage %s" ON %I', tbl_name, tbl_name);
            
            -- Crear nueva política
            EXECUTE format('
                CREATE POLICY "Admins can manage %s" ON %I
                  FOR ALL TO authenticated
                  USING (user_has_role(ARRAY[''coordinador'', ''directivo'']))
                  WITH CHECK (user_has_role(ARRAY[''coordinador'', ''directivo'']))
            ', tbl_name, tbl_name);
            
            RAISE NOTICE 'RLS restaurado en: %', tbl_name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
    '✅ RLS restaurado en:' as status,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'usuarios', 'alumnos', 'docentes', 'clases', 
    'planificaciones', 'horarios', 'minutas_evaluacion', 
    'notificaciones', 'aulas'
  )
ORDER BY tablename;

-- ============================================
-- NOTA:
-- ============================================
-- Este script restaura RLS con políticas que funcionan
-- con el nuevo sistema de usuarios basado en la tabla 'usuarios'.
-- 
-- Las políticas permiten:
-- - Directivos y Coordinadores: Acceso completo a todo (gestión completa)
-- - Docentes: Lectura de sus propios datos y gestión de sus planificaciones
-- ============================================

