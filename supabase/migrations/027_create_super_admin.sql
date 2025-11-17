-- Migration: Create initial super admin user
-- This migration creates the first super admin user
-- IMPORTANT: Run this AFTER creating users in Supabase Auth
-- 
-- To use this:
-- 1. First, create a user in Supabase Auth (via dashboard or API) with email and password
-- 2. Then run this migration to create the corresponding record in usuarios table
-- 3. Or use the create_super_admin function with the user ID from Supabase Auth

-- ============================================
-- FUNCTION: Create super admin (updated)
-- ============================================
-- This function creates a super admin user
-- It requires the user to already exist in Supabase Auth
CREATE OR REPLACE FUNCTION create_super_admin_user(
  p_auth_user_id UUID,  -- ID from auth.users
  p_username TEXT,
  p_email TEXT,
  p_password_hash TEXT DEFAULT NULL  -- Not used if user exists in auth.users
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if super admin already exists
  IF EXISTS (SELECT 1 FROM usuarios WHERE role = 'super_admin' AND is_active = TRUE) THEN
    RAISE EXCEPTION 'Super admin already exists';
  END IF;

  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM usuarios WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists: %', p_username;
  END IF;

  -- Insert super admin
  INSERT INTO usuarios (id, username, email, password_hash, role, is_active)
  VALUES (p_auth_user_id, p_username, p_email, COALESCE(p_password_hash, ''), 'super_admin', TRUE)
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- ============================================
-- INSTRUCTIONS FOR CREATING SUPER ADMIN
-- ============================================
-- 
-- Option 1: Via Supabase Dashboard
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" > "Create new user"
-- 3. Enter email (e.g., admin@manglarnet.local) and password
-- 4. Copy the User UID
-- 5. Run this SQL:
--
-- SELECT create_super_admin_user(
--   'USER_UID_FROM_SUPABASE'::UUID,
--   'admin',
--   'admin@manglarnet.local'
-- );
--
-- Option 2: Via Supabase Auth API (from application)
-- Use supabase.auth.admin.createUser() or supabase.auth.signUp()
-- Then call create_super_admin_user() with the returned user ID
--
-- Option 3: Manual insert (if you have the auth user ID)
-- INSERT INTO usuarios (id, username, email, password_hash, role, is_active)
-- VALUES (
--   'USER_UID_FROM_SUPABASE'::UUID,
--   'admin',
--   'admin@manglarnet.local',
--   '',  -- Password is managed by Supabase Auth
--   'super_admin',
--   TRUE
-- );

COMMENT ON FUNCTION create_super_admin_user IS 'Creates a super admin user. Requires the user to already exist in Supabase Auth.';

