-- Migration: 043_emergency_fix.sql
-- Description: EMERGENCY FIX to unblock user.
--              Disables role checks temporarily and allows ALL authenticated users
--              to manage indicators and classes.

-- ============================================
-- 1. Maestra Indicadores (Emergency Access)
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Coordinators manage indicators" ON maestra_indicadores;
DROP POLICY IF EXISTS "Teachers view indicators" ON maestra_indicadores;
DROP POLICY IF EXISTS "Authenticated users can manage maestra_indicadores" ON maestra_indicadores;
DROP POLICY IF EXISTS "Allow all authenticated" ON maestra_indicadores;

-- Create fully permissive policy for authenticated users
CREATE POLICY "Emergency Access Indicators" ON maestra_indicadores
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. Clases (Emergency Access)
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Coordinators manage classes" ON clases;
DROP POLICY IF EXISTS "Teachers view classes" ON clases;

-- Create fully permissive policy for authenticated users
CREATE POLICY "Emergency Access Classes" ON clases
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "Emergency Access Indicators" ON maestra_indicadores IS 'EMERGENCY: Allows all authenticated users full access';
