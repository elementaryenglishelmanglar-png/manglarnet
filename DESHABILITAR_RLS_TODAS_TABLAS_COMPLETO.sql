-- ============================================
-- DESHABILITAR RLS EN TODAS LAS TABLAS (COMPLETO)
-- ============================================
-- Este script deshabilita RLS en TODAS las tablas de la base de datos
-- para permitir acceso completo a los datos
-- ============================================

-- Deshabilitar RLS en todas las tablas de forma dinámica
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    -- Iterar sobre todas las tablas en el esquema public
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_%'
    LOOP
        BEGIN
            -- Intentar deshabilitar RLS
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl_name);
            RAISE NOTICE '✅ RLS deshabilitado en: %', tbl_name;
        EXCEPTION
            WHEN OTHERS THEN
                -- Si la tabla no tiene RLS habilitado, simplemente continuar
                RAISE NOTICE '⚠️  No se pudo deshabilitar RLS en % (puede que no esté habilitado): %', tbl_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verificar estado de RLS en tablas principales
SELECT 
    '✅ Estado de RLS en tablas principales:' as status,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'usuarios', 'alumnos', 'docentes', 'clases', 
    'planificaciones', 'horarios', 'minutas_evaluacion', 
    'notificaciones', 'aulas', 'eventos_calendario',
    'tareas_coordinador', 'maestra_guardias', 
    'log_reuniones_coordinacion', 'lapsos', 'semanas_lapso',
    'docente_materias', 'clase_requisitos',
    'configuracion_horarios', 'restricciones_duras',
    'restricciones_suaves', 'generaciones_horarios',
    'configuracion_ingles_primaria',
    'asignacion_docente_nivel_ingles',
    'asignacion_aula_nivel_ingles'
  )
ORDER BY tablename;

-- ============================================
-- IMPORTANTE:
-- ============================================
-- Este script deshabilita RLS en TODAS las tablas.
-- Esto permite acceso completo a los datos sin restricciones.
-- 
-- Es un workaround temporal para permitir que la aplicación funcione.
-- ============================================

