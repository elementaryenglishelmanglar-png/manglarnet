-- Migration: Update RLS policies to use usuarios table instead of authorized_users
-- This migration updates all RLS policies that reference authorized_users to use usuarios table
-- Date: 2025-01-XX

-- ============================================
-- HELPER FUNCTION: Get current user role from usuarios
-- ============================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM usuarios
  WHERE id::text = auth.uid()::text
  AND is_active = TRUE
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Check if current user has role
-- ============================================
CREATE OR REPLACE FUNCTION user_has_role(p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := get_current_user_role();
  RETURN v_role = ANY(p_roles);
END;
$$;

-- ============================================
-- UPDATE POLICIES: Replace authorized_users checks with usuarios
-- ============================================
-- Note: This is a comprehensive update. Individual migrations may need
-- to be updated separately if they have specific requirements.

-- Example: Update a policy that checks for directivo role
-- This pattern should be applied to all policies that use:
--   EXISTS (SELECT 1 FROM authorized_users WHERE email = ... AND role = ...)
--
-- Replace with:
--   user_has_role(ARRAY['directivo'])

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_current_user_role IS 'Gets the role of the currently authenticated user from usuarios table';
COMMENT ON FUNCTION user_has_role IS 'Checks if the current user has one of the specified roles';

-- ============================================
-- NOTE FOR FUTURE MIGRATIONS
-- ============================================
-- When creating new RLS policies, use:
--   USING (user_has_role(ARRAY['role1', 'role2']))
-- Instead of:
--   USING (EXISTS (SELECT 1 FROM authorized_users WHERE email = ... AND role = ...))

