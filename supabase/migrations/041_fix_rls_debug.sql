-- Script de diagnóstico y corrección de permisos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar el usuario actual y su rol
SELECT 
  auth.uid() as user_id,
  u.role,
  u.is_active
FROM auth.users au
LEFT JOIN public.usuarios u ON u.id = au.id
WHERE au.id = auth.uid();

-- 2. Forzar actualización de política para maestra_indicadores (Fallback seguro)
DROP POLICY IF EXISTS "Coordinators manage indicators" ON maestra_indicadores;
DROP POLICY IF EXISTS "Teachers view indicators" ON maestra_indicadores;

-- Permitir a Coordinadores y Directivos TODO
CREATE POLICY "Coordinators manage indicators" ON maestra_indicadores 
  FOR ALL 
  TO authenticated 
  USING (public.user_role() IN ('coordinador', 'directivo'));

-- Permitir a Docentes VER
CREATE POLICY "Teachers view indicators" ON maestra_indicadores 
  FOR SELECT 
  TO authenticated 
  USING (public.user_role() = 'docente');

-- DEBUG: Permitir temporalmente a TODOS los autenticados insertar (para descartar problemas de rol)
-- Descomenta la siguiente línea si lo anterior falla:
-- CREATE POLICY "Debug insert indicators" ON maestra_indicadores FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Asegurarse que la tabla CLASES también permita inserción (necesario para clases virtuales)
DROP POLICY IF EXISTS "Coordinators manage classes" ON clases;
CREATE POLICY "Coordinators manage classes" ON clases 
  FOR ALL 
  TO authenticated 
  USING (public.user_role() IN ('coordinador', 'directivo'));
