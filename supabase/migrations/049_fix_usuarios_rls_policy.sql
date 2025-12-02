-- OPTIONAL: This migration provides separate INSERT/UPDATE/DELETE policies for usuarios
-- to avoid circular dependency issues when creating the first admin user.
-- The main RLS policies are defined in migrations 030 and 040.
-- Only run this if you encounter circular dependency errors when creating users.
--
-- Fix RLS policy for user creation
-- The previous policy had a circular dependency issue

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can manage users" ON usuarios;

-- Create separate policies for INSERT, UPDATE, and DELETE
-- This allows us to handle the INSERT case specially

-- Admins can INSERT new users (simplified check)
CREATE POLICY "Admins can insert users" ON usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  );

-- Admins can UPDATE all users
CREATE POLICY "Admins can update users" ON usuarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  );

-- Admins can DELETE users
CREATE POLICY "Admins can delete users" ON usuarios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.role IN ('coordinador', 'directivo')
      AND u.is_active = TRUE
    )
  );
