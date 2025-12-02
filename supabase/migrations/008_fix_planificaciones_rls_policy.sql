-- DEPRECATED: This migration is part of the legacy authentication system
-- RLS policies are now managed by migrations 030_unified_auth_system.sql and 040_simplify_security_policies.sql
-- This migration is kept for historical reference but should not be used in new deployments
--
-- Migration: Fix planificaciones and notificaciones RLS policies
-- The current policies try to access auth.users which is not allowed for authenticated users
-- We need to simplify the policies to use only docentes and authorized_users tables

-- ============================================
-- Fix planificaciones RLS policy
-- ============================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Docentes can manage their own planificaciones" ON planificaciones;

-- Create a new, simpler policy that doesn't access auth.users
-- Instead, it checks if the docente's email matches the authenticated user's email
CREATE POLICY "Docentes can manage their own planificaciones" ON planificaciones
  FOR ALL TO authenticated
  USING (
    -- Check if the planificacion belongs to a docente whose email matches the current user's email
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON LOWER(au.email) = LOWER(d.email)
      WHERE d.id_docente = planificaciones.id_docente
      AND LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
    )
    -- Or if the user is a coordinador or directivo
    OR EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  )
  WITH CHECK (
    -- Same check for INSERT/UPDATE
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON LOWER(au.email) = LOWER(d.email)
      WHERE d.id_docente = planificaciones.id_docente
      AND LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
    )
    -- Or if the user is a coordinador or directivo
    OR EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

-- ============================================
-- Fix notificaciones RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON notificaciones;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notificaciones;

-- Create new policies that don't access auth.users
CREATE POLICY "Users can read their own notifications" ON notificaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON LOWER(au.email) = LOWER(d.email)
      WHERE d.id_docente = notificaciones.recipient_id
      AND LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
    )
    OR EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

CREATE POLICY "Users can update their own notifications" ON notificaciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM docentes d
      JOIN authorized_users au ON LOWER(au.email) = LOWER(d.email)
      WHERE d.id_docente = notificaciones.recipient_id
      AND LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
    )
    OR EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
      AND au.role IN ('coordinador', 'directivo')
    )
  );

