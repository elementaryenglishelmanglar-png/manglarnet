-- Migration: Allow coordinadores to manage authorized_users
-- This migration extends permissions to coordinadores to add, edit, and delete users
-- Date: 2025-01-XX
-- 
-- IMPORTANT: This migration uses a SECURITY DEFINER function to avoid infinite recursion
-- in RLS policies when checking user roles.

-- ============================================
-- HELPER FUNCTION: Check if user is directivo or coordinador
-- ============================================
-- This function runs with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION check_user_role_allowed()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- Get the current user's email from JWT
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Query authorized_users directly (bypasses RLS due to SECURITY DEFINER)
  SELECT role INTO user_role
  FROM authorized_users
  WHERE email = user_email
  LIMIT 1;
  
  -- Return true if user is directivo or coordinador
  RETURN user_role IN ('directivo', 'coordinador');
END;
$$;

-- ============================================
-- POLICY UPDATE: authorized_users
-- ============================================

-- Drop existing policy that only allows directivos
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos and Coordinadores can manage authorized_users" ON authorized_users;

-- Create new policy that allows both directivos and coordinadores
-- Uses the helper function to avoid infinite recursion
CREATE POLICY "Directivos and Coordinadores can manage authorized_users" ON authorized_users
  FOR ALL
  TO authenticated
  USING (check_user_role_allowed())
  WITH CHECK (check_user_role_allowed());

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this migration, coordinadores should be able to:
-- 1. SELECT all authorized_users (already allowed via "Authenticated users can read authorized_users")
-- 2. INSERT new authorized_users
-- 3. UPDATE existing authorized_users (including role changes)
-- 4. DELETE authorized_users
--
-- The helper function check_user_role_allowed() prevents infinite recursion
-- by using SECURITY DEFINER to bypass RLS when checking the user's role.

