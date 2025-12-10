-- =====================================================
-- TEMPORAL: Deshabilitar RLS para pruebas
-- IMPORTANTE: Solo para desarrollo, NO usar en producción
-- =====================================================

-- Deshabilitar RLS temporalmente para permitir pruebas
ALTER TABLE rrhh_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_subareas DISABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_responses DISABLE ROW LEVEL SECURITY;

-- NOTA: Después de probar, ejecutar 055_fix_rrhh_rls_policies.sql
-- y luego habilitar RLS nuevamente
