-- ============================================
-- Script para corregir el problema de timeout en autorización
-- ============================================
-- Este script verifica y corrige las políticas RLS de la tabla authorized_users
-- para permitir que los usuarios autenticados puedan leer su propio estado de autorización

-- Paso 1: Verificar que la tabla existe y tiene datos
SELECT 
  'Verificando tabla authorized_users...' as paso,
  COUNT(*) as total_usuarios
FROM authorized_users;

-- Verificar que tu email está en la tabla
SELECT 
  'Verificando tu email...' as paso,
  email,
  role
FROM authorized_users 
WHERE email = 'elementaryenglish.elmanglar@gmail.com';

-- Paso 2: Verificar políticas RLS actuales
SELECT 
  'Políticas RLS actuales:' as paso,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'authorized_users';

-- Paso 3: Eliminar políticas existentes (si hay conflictos)
DROP POLICY IF EXISTS "Users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Authenticated users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;

-- Paso 4: Crear política de lectura permisiva para usuarios autenticados
-- Esta política permite que CUALQUIER usuario autenticado pueda leer la tabla
-- Esto es necesario durante el proceso de verificación de autorización
CREATE POLICY "Authenticated users can read authorized_users" 
ON authorized_users
FOR SELECT 
TO authenticated
USING (true);

-- Paso 5: Crear política para que directivos puedan gestionar la tabla
CREATE POLICY "Directivos can manage authorized_users" 
ON authorized_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM authorized_users au
    WHERE au.email = (auth.jwt() ->> 'email')
    AND au.role = 'directivo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM authorized_users au
    WHERE au.email = (auth.jwt() ->> 'email')
    AND au.role = 'directivo'
  )
);

-- Paso 6: Verificar que las políticas se crearon correctamente
SELECT 
  'Políticas RLS después de la corrección:' as paso,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'authorized_users';

-- Paso 7: Verificar que RLS está habilitado
SELECT 
  'Estado de RLS:' as paso,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'authorized_users';

-- ============================================
-- Si el problema persiste, ejecuta también esto:
-- ============================================

-- Verificar que el usuario existe en auth.users
SELECT 
  'Usuarios en auth.users:' as paso,
  email,
  created_at
FROM auth.users 
WHERE email = 'elementaryenglish.elmanglar@gmail.com';

-- Si el usuario no existe en auth.users, necesitarás iniciar sesión primero
-- para que Supabase lo cree automáticamente

