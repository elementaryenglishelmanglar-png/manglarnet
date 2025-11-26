-- Migration: 039_update_maestra_indicadores_rls.sql
-- Description: Updates RLS policies for maestra_indicadores to allow all authenticated users to insert

-- Drop existing policy
DROP POLICY IF EXISTS "Coordinadores and directivos can manage maestra_indicadores" ON maestra_indicadores;

-- Create new policy allowing all authenticated users to insert/update/delete
CREATE POLICY "Authenticated users can manage maestra_indicadores" ON maestra_indicadores
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "Authenticated users can manage maestra_indicadores" ON maestra_indicadores 
IS 'Allows all authenticated users to create, update, and delete pedagogical indicators';
