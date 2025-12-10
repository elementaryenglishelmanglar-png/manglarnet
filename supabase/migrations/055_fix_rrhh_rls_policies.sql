-- =====================================================
-- FIX: RRHH RLS Policies
-- Corrige las políticas RLS para que funcionen correctamente
-- =====================================================

-- Primero, eliminamos las políticas existentes problemáticas
DROP POLICY IF EXISTS "Solo coordinadores/directivos pueden crear plantillas" ON rrhh_templates;
DROP POLICY IF EXISTS "Solo coordinadores/directivos pueden editar plantillas" ON rrhh_templates;
DROP POLICY IF EXISTS "Solo coordinadores/directivos pueden gestionar áreas" ON rrhh_areas;
DROP POLICY IF EXISTS "Solo coordinadores/directivos pueden gestionar subáreas" ON rrhh_subareas;
DROP POLICY IF EXISTS "Solo coordinadores/directivos pueden gestionar ítems" ON rrhh_items;

-- Crear función helper para verificar si el usuario es coordinador o directivo
CREATE OR REPLACE FUNCTION is_coordinator_or_director()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios
        WHERE id_usuario = auth.uid()
        AND role IN ('coordinador', 'directivo')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nuevas políticas para rrhh_templates
CREATE POLICY "Coordinadores/directivos pueden crear plantillas"
    ON rrhh_templates FOR INSERT
    WITH CHECK (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden editar plantillas"
    ON rrhh_templates FOR UPDATE
    USING (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden eliminar plantillas"
    ON rrhh_templates FOR DELETE
    USING (is_coordinator_or_director());

-- Nuevas políticas para rrhh_areas (INSERT, UPDATE, DELETE separados)
CREATE POLICY "Coordinadores/directivos pueden crear áreas"
    ON rrhh_areas FOR INSERT
    WITH CHECK (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden editar áreas"
    ON rrhh_areas FOR UPDATE
    USING (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden eliminar áreas"
    ON rrhh_areas FOR DELETE
    USING (is_coordinator_or_director());

-- Nuevas políticas para rrhh_subareas
CREATE POLICY "Coordinadores/directivos pueden crear subáreas"
    ON rrhh_subareas FOR INSERT
    WITH CHECK (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden editar subáreas"
    ON rrhh_subareas FOR UPDATE
    USING (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden eliminar subáreas"
    ON rrhh_subareas FOR DELETE
    USING (is_coordinator_or_director());

-- Nuevas políticas para rrhh_items
CREATE POLICY "Coordinadores/directivos pueden crear ítems"
    ON rrhh_items FOR INSERT
    WITH CHECK (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden editar ítems"
    ON rrhh_items FOR UPDATE
    USING (is_coordinator_or_director());

CREATE POLICY "Coordinadores/directivos pueden eliminar ítems"
    ON rrhh_items FOR DELETE
    USING (is_coordinator_or_director());

-- Comentario
COMMENT ON FUNCTION is_coordinator_or_director() IS 'Helper function para verificar si el usuario actual es coordinador o directivo';
