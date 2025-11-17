-- Migration: Fix all RLS policies for teacher-related tables
-- This migration updates all RLS policies to use the check_user_role_allowed function
-- to ensure coordinators can manage all teacher-related data without RLS errors
-- Date: 2025-11-16

-- ============================================
-- DROP EXISTING POLICIES
-- ============================================
-- Drop policies that use direct JWT verification (which can fail)

-- docentes table
DROP POLICY IF EXISTS "Coordinadores and directivos can manage docentes" ON docentes;

-- clases table
DROP POLICY IF EXISTS "Coordinadores and directivos can manage clases" ON clases;

-- aulas table
DROP POLICY IF EXISTS "Coordinadores and directivos can manage aulas" ON aulas;

-- docente_materias table
DROP POLICY IF EXISTS "Coordinadores and directivos can manage docente_materias" ON docente_materias;

-- configuracion_ingles_primaria table
DROP POLICY IF EXISTS "Coordinadores and directivos can manage configuracion_ingles_primaria" ON configuracion_ingles_primaria;

-- horarios table
DROP POLICY IF EXISTS "Coordinadores and directivos can manage horarios" ON horarios;

-- ============================================
-- CREATE UPDATED POLICIES USING check_user_role_allowed FUNCTION
-- ============================================
-- Note: The check_user_role_allowed() function should already exist from migration 021
-- If it doesn't exist, it will be created here as a fallback

-- Ensure the function exists (idempotent)
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

-- Policy for docentes
CREATE POLICY "Coordinadores and directivos can manage docentes" 
ON docentes
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

-- Policy for clases
CREATE POLICY "Coordinadores and directivos can manage clases" 
ON clases
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

-- Policy for aulas
CREATE POLICY "Coordinadores and directivos can manage aulas" 
ON aulas
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

-- Policy for docente_materias
CREATE POLICY "Coordinadores and directivos can manage docente_materias" 
ON docente_materias
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

-- Policy for configuracion_ingles_primaria
CREATE POLICY "Coordinadores and directivos can manage configuracion_ingles_primaria" 
ON configuracion_ingles_primaria
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

-- Policy for horarios
CREATE POLICY "Coordinadores and directivos can manage horarios" 
ON horarios
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

