-- ============================================
-- SOLUCIÓN COMPLETA PARA ERROR 500
-- Ejecuta este script completo en Supabase SQL Editor
-- ============================================

-- PASO 1: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Authenticated users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "allow_read_authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "allow_insert_for_directivos" ON authorized_users;
DROP POLICY IF EXISTS "allow_update_for_directivos" ON authorized_users;
DROP POLICY IF EXISTS "allow_delete_for_directivos" ON authorized_users;

-- PASO 2: Verificar que la tabla existe y tiene RLS habilitado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'authorized_users') THEN
    RAISE EXCEPTION 'La tabla authorized_users no existe. Ejecuta primero la migración 001_create_authorized_users.sql';
  END IF;
  
  -- Asegurar que RLS está habilitado
  ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE '✅ RLS habilitado correctamente';
END $$;

-- PASO 3: Crear políticas nuevas y más permisivas
-- Política de lectura: Cualquier usuario autenticado puede leer
CREATE POLICY "allow_read_authorized_users" ON authorized_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserción: Solo directivos pueden insertar
CREATE POLICY "allow_insert_for_directivos" ON authorized_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  );

-- Política de actualización: Solo directivos pueden actualizar
CREATE POLICY "allow_update_for_directivos" ON authorized_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  );

-- Política de eliminación: Solo directivos pueden eliminar
CREATE POLICY "allow_delete_for_directivos" ON authorized_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  );

-- PASO 4: Verificar que las políticas se crearon
SELECT 
  policyname as "Política",
  cmd as "Operación",
  CASE 
    WHEN roles = '{authenticated}' THEN 'Usuarios autenticados'
    ELSE array_to_string(roles, ', ')
  END as "Roles"
FROM pg_policies 
WHERE tablename = 'authorized_users'
ORDER BY cmd, policyname;

-- PASO 5: Verificar usuarios en la tabla
SELECT 
  email as "Email",
  role as "Rol",
  created_at as "Fecha de creación"
FROM authorized_users 
ORDER BY email;

-- PASO 6: Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS recreadas correctamente';
  RAISE NOTICE '✅ Verifica que aparecen 4 políticas arriba';
  RAISE NOTICE '✅ Verifica que aparecen los usuarios autorizados arriba';
END $$;

