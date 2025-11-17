-- Migration: Allow coordinadores to manage authorized_users
-- This migration extends permissions to coordinadores to add, edit, and delete users
-- Date: 2025-01-XX

-- ============================================
-- POLICY UPDATE: authorized_users
-- ============================================

-- Drop existing policy that only allows directivos
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;

-- Create new policy that allows both directivos and coordinadores
CREATE POLICY "Directivos and Coordinadores can manage authorized_users" ON authorized_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('directivo', 'coordinador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role IN ('directivo', 'coordinador')
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this migration, coordinadores should be able to:
-- 1. SELECT all authorized_users
-- 2. INSERT new authorized_users
-- 3. UPDATE existing authorized_users (including role changes)
-- 4. DELETE authorized_users

