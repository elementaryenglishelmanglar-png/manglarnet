-- Migration: 042_robust_rls.sql
-- Description: Makes RLS policies more robust and permissive for Coordinators.
--              Removes is_active check from role verification to avoid lockouts.
--              Ensures case-insensitive role checking.

-- ============================================
-- 1. Update Helper Function (More Robust)
-- ============================================

-- Redefine user_role to be more forgiving
-- Removes is_active check (if user can login, we trust auth.uid)
-- Handles potential whitespace or case issues
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT lower(trim(role)) INTO v_role
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. Fix Maestra Indicadores Policies
-- ============================================

-- Drop all existing policies on this table to be sure
DROP POLICY IF EXISTS "Coordinators manage indicators" ON maestra_indicadores;
DROP POLICY IF EXISTS "Teachers view indicators" ON maestra_indicadores;
DROP POLICY IF EXISTS "Authenticated users can manage maestra_indicadores" ON maestra_indicadores;
DROP POLICY IF EXISTS "Allow all authenticated" ON maestra_indicadores;

-- Policy for Coordinators/Directivos (Full Access)
CREATE POLICY "Coordinators manage indicators" ON maestra_indicadores 
  FOR ALL 
  TO authenticated 
  USING (
    public.user_role() IN ('coordinador', 'directivo')
  )
  WITH CHECK (
    public.user_role() IN ('coordinador', 'directivo')
  );

-- Policy for Teachers (View Only)
CREATE POLICY "Teachers view indicators" ON maestra_indicadores 
  FOR SELECT 
  TO authenticated 
  USING (public.user_role() = 'docente');

-- ============================================
-- 3. Fix Clases Policies (Crucial for Virtual Classes)
-- ============================================

DROP POLICY IF EXISTS "Coordinators manage classes" ON clases;
DROP POLICY IF EXISTS "Teachers view classes" ON clases;

CREATE POLICY "Coordinators manage classes" ON clases 
  FOR ALL 
  TO authenticated 
  USING (
    public.user_role() IN ('coordinador', 'directivo')
  );

CREATE POLICY "Teachers view classes" ON clases 
  FOR SELECT 
  TO authenticated 
  USING (public.user_role() = 'docente');

-- ============================================
-- 4. Emergency Fallback (Optional - Commented out)
-- ============================================
-- If the above still fails, uncomment this to temporarily allow ALL authenticated users
-- CREATE POLICY "Emergency Access" ON maestra_indicadores FOR ALL TO authenticated USING (true) WITH CHECK (true);
