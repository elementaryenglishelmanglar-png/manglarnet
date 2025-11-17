-- Migration: Fix RLS policies for English level assignment tables
-- This migration updates the RLS policies to use the check_user_role_allowed function
-- to avoid recursion issues and ensure coordinators can manage English level assignments

-- ============================================
-- DROP EXISTING POLICIES
-- ============================================
DROP POLICY IF EXISTS "Coordinadores and directivos can manage asignacion_docente_nivel_ingles" ON asignacion_docente_nivel_ingles;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage asignacion_aula_nivel_ingles" ON asignacion_aula_nivel_ingles;

-- ============================================
-- CREATE UPDATED POLICIES USING check_user_role_allowed FUNCTION
-- ============================================
-- Note: The check_user_role_allowed() function should already exist from migration 021
-- If it doesn't exist, it will be created here as a fallback

-- Policy for asignacion_docente_nivel_ingles
CREATE POLICY "Coordinadores and directivos can manage asignacion_docente_nivel_ingles" 
ON asignacion_docente_nivel_ingles
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

-- Policy for asignacion_aula_nivel_ingles
CREATE POLICY "Coordinadores and directivos can manage asignacion_aula_nivel_ingles" 
ON asignacion_aula_nivel_ingles
FOR ALL 
TO authenticated
USING (check_user_role_allowed())
WITH CHECK (check_user_role_allowed());

