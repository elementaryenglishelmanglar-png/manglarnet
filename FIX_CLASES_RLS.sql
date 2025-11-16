-- ============================================
-- SOLUCIÓN COMPLETA: Error RLS al crear clases
-- Maneja todos los casos: niveles, salones, emails, JWT, etc.
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- PASO 1: Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'clases'
ORDER BY policyname;

-- PASO 2: Eliminar TODAS las políticas existentes de clases
DROP POLICY IF EXISTS "Authenticated users can read clases" ON clases;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage clases" ON clases;
DROP POLICY IF EXISTS "allow_read_clases" ON clases;
DROP POLICY IF EXISTS "allow_insert_clases" ON clases;
DROP POLICY IF EXISTS "allow_update_clases" ON clases;
DROP POLICY IF EXISTS "allow_delete_clases" ON clases;

-- PASO 3: Crear función helper para verificar permisos
-- Esta función maneja todos los casos edge (NULL, mayúsculas, etc.)
CREATE OR REPLACE FUNCTION check_user_can_manage_clases()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
BEGIN
    -- Obtener email del JWT (puede ser NULL)
    user_email := auth.jwt() ->> 'email';
    
    -- Si no hay email en el JWT, retornar false
    IF user_email IS NULL OR user_email = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar el rol del usuario en authorized_users
    -- Usar LOWER() para normalizar y manejar diferencias de mayúsculas/minúsculas
    SELECT role INTO user_role
    FROM authorized_users
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(user_email))
    LIMIT 1;
    
    -- Verificar si el usuario es coordinador o directivo
    RETURN user_role IN ('coordinador', 'directivo');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Crear políticas separadas por operación para mejor debugging
-- Política de lectura: Todos los usuarios autenticados pueden leer
CREATE POLICY "allow_read_clases" ON clases
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserción: Coordinadores y directivos pueden insertar
-- IMPORTANTE: Usa la función helper que maneja todos los casos edge
CREATE POLICY "allow_insert_clases" ON clases
  FOR INSERT
  TO authenticated
  WITH CHECK (check_user_can_manage_clases());

-- Política de actualización: Coordinadores y directivos pueden actualizar
CREATE POLICY "allow_update_clases" ON clases
  FOR UPDATE
  TO authenticated
  USING (check_user_can_manage_clases())
  WITH CHECK (check_user_can_manage_clases());

-- Política de eliminación: Coordinadores y directivos pueden eliminar
CREATE POLICY "allow_delete_clases" ON clases
  FOR DELETE
  TO authenticated
  USING (check_user_can_manage_clases());

-- PASO 5: Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'USING: ' || qual
    END as policy_definition
FROM pg_policies
WHERE tablename = 'clases'
ORDER BY policyname, cmd;

-- PASO 6: Verificar que la función helper funciona correctamente
SELECT 
    'Email del JWT: ' || COALESCE(auth.jwt() ->> 'email', 'NULL') as jwt_email,
    'Rol en authorized_users: ' || COALESCE(
        (SELECT role FROM authorized_users 
         WHERE LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))), 
        'NO ENCONTRADO'
    ) as user_role,
    'Función check_user_can_manage_clases(): ' || CASE 
        WHEN check_user_can_manage_clases() THEN 'TRUE (tiene permisos)'
        ELSE 'FALSE (no tiene permisos)'
    END as function_result,
    'Tiene permisos: ' || CASE 
        WHEN check_user_can_manage_clases() THEN 'SÍ ✅'
        ELSE 'NO ❌'
    END as has_permissions;

-- PASO 7: Verificar usuarios autorizados (para debugging)
SELECT 
    email,
    role,
    CASE 
        WHEN LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', ''))) THEN '← Este es tu usuario'
        ELSE ''
    END as is_current_user
FROM authorized_users
WHERE role IN ('coordinador', 'directivo')
ORDER BY email;

