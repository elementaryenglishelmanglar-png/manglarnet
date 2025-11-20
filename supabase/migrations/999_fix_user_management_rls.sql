-- ============================================
-- User Management System - RLS Policies Fix
-- ============================================
-- This script ensures proper RLS policies for the usuarios table
-- and adds automatic docente linkage for users with docente role
--
-- Run this in Supabase SQL Editor to fix user management access issues

-- ============================================
-- STEP 1: Verify usuarios table exists
-- ============================================

-- Check if usuarios table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
    RAISE EXCEPTION 'Table usuarios does not exist. Please create it first.';
  END IF;
END $$;

-- ============================================
-- STEP 2: Drop old conflicting policies
-- ============================================

-- Drop existing policies on usuarios table to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON usuarios;
DROP POLICY IF EXISTS "Admins can read all users" ON usuarios;
DROP POLICY IF EXISTS "Admins can manage users" ON usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
DROP POLICY IF EXISTS "Coordinadores can read all usuarios" ON usuarios;
DROP POLICY IF EXISTS "Coordinadores can insert usuarios" ON usuarios;
DROP POLICY IF EXISTS "Coordinadores can update usuarios" ON usuarios;
DROP POLICY IF EXISTS "Coordinadores can delete usuarios" ON usuarios;

-- ============================================
-- STEP 3: Create new RLS policies
-- ============================================

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile" ON usuarios
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Coordinadores and directivos can read all users
CREATE POLICY "Coordinadores can read all usuarios" ON usuarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = true
    )
  );

-- Policy 3: Coordinadores and directivos can insert new users
CREATE POLICY "Coordinadores can insert usuarios" ON usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = true
    )
  );

-- Policy 4: Coordinadores and directivos can update users
CREATE POLICY "Coordinadores can update usuarios" ON usuarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = true
    )
  );

-- Policy 5: Coordinadores and directivos can delete users
CREATE POLICY "Coordinadores can delete usuarios" ON usuarios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = true
    )
  );

-- Policy 6: Users can update their own profile (but not role or is_active)
CREATE POLICY "Users can update own profile" ON usuarios
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM usuarios WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM usuarios WHERE id = auth.uid())
  );

-- ============================================
-- STEP 4: Create function to link users to docentes
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_docente_for_user() CASCADE;

-- Create function to automatically create docente entry for users with docente role
CREATE OR REPLACE FUNCTION create_docente_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create docente entry if role is 'docente'
  IF NEW.role = 'docente' THEN
    -- Insert into docentes table
    INSERT INTO docentes (
      id_usuario,
      nombres,
      apellidos,
      email,
      activo
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.nombres, NEW.username),
      COALESCE(NEW.apellidos, ''),
      NEW.email,
      NEW.is_active
    )
    ON CONFLICT (id_usuario) DO UPDATE
    SET
      email = EXCLUDED.email,
      activo = EXCLUDED.activo;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create trigger for automatic docente linkage
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_docente_on_user_insert ON usuarios;

-- Create trigger to run after user insert
CREATE TRIGGER create_docente_on_user_insert
  AFTER INSERT ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION create_docente_for_user();

-- ============================================
-- STEP 6: Verify policies were created
-- ============================================

-- List all policies on usuarios table
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN roles = '{authenticated}' THEN 'authenticated'
    ELSE array_to_string(roles, ', ')
  END as roles
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- ============================================
-- STEP 7: Test the setup (optional)
-- ============================================

-- Uncomment to test if current user can read usuarios
-- SELECT id, username, email, role, is_active
-- FROM usuarios
-- LIMIT 5;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ User management RLS policies have been successfully updated!';
  RAISE NOTICE '✅ Automatic docente linkage trigger has been created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test user creation in the Gestión de Usuarios interface';
  RAISE NOTICE '2. Verify that users with role "docente" are automatically added to docentes table';
  RAISE NOTICE '3. Test login with newly created users';
END $$;
