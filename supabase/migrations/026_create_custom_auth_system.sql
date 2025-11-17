-- Migration: Create custom authentication system
-- This migration replaces Google OAuth with a custom username/password system
-- Date: 2025-01-XX

-- ============================================
-- TABLE: usuarios (Custom Users Table)
-- ============================================
-- This table stores all users with username and password authentication
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT, -- Optional, for password recovery
  password_hash TEXT NOT NULL, -- bcrypt hash
  role TEXT NOT NULL CHECK (role IN ('docente', 'coordinador', 'directivo', 'administrativo', 'super_admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_active ON usuarios(is_active);

-- Enable Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: usuarios
-- ============================================

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policy: Super admins can read all users
CREATE POLICY "Super admins can read all users" ON usuarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'super_admin'
      AND u.is_active = TRUE
    )
  );

-- Policy: Super admins and directivos can read all users (for management)
CREATE POLICY "Admins can read all users" ON usuarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role IN ('super_admin', 'directivo')
      AND u.is_active = TRUE
    )
  );

-- Policy: Super admins can manage all users
CREATE POLICY "Super admins can manage all users" ON usuarios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'super_admin'
      AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'super_admin'
      AND u.is_active = TRUE
    )
  );

-- Policy: Users can update their own password (but not role)
CREATE POLICY "Users can update own password" ON usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (
    auth.uid()::text = id::text
    AND role = (SELECT role FROM usuarios WHERE id::text = auth.uid()::text)
  );

-- ============================================
-- FUNCTION: Create super admin user
-- ============================================
-- This function creates the initial super admin user
-- Password will be hashed using bcrypt in the application layer
CREATE OR REPLACE FUNCTION create_super_admin(
  p_username TEXT,
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if super admin already exists
  IF EXISTS (SELECT 1 FROM usuarios WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'Super admin already exists';
  END IF;

  -- Insert super admin
  INSERT INTO usuarios (username, email, password_hash, role, is_active)
  VALUES (p_username, p_email, p_password_hash, 'super_admin', TRUE)
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- ============================================
-- FUNCTION: Update last login timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_last_login(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE usuarios
  SET last_login = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ============================================
-- FUNCTION: Check user role (helper for RLS)
-- ============================================
CREATE OR REPLACE FUNCTION check_user_role(p_user_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM usuarios
  WHERE id = p_user_id
  AND is_active = TRUE;
  
  RETURN v_role = ANY(p_roles);
END;
$$;

-- ============================================
-- MIGRATE authorized_users to use username
-- ============================================
-- Add username column to authorized_users (temporary, for migration)
ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS id_usuario UUID REFERENCES usuarios(id) ON DELETE CASCADE;

-- Create index for username lookup
CREATE INDEX IF NOT EXISTS idx_authorized_users_username ON authorized_users(username);

-- ============================================
-- UPDATE RLS POLICIES: authorized_users
-- ============================================
-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos and Coordinadores can manage authorized_users" ON authorized_users;

-- New policy: Users can read authorized_users (for checking their own authorization)
CREATE POLICY "Users can read authorized_users" ON authorized_users
  FOR SELECT
  TO authenticated
  USING (true);

-- New policy: Super admins can manage authorized_users
CREATE POLICY "Super admins can manage authorized_users" ON authorized_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'super_admin'
      AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'super_admin'
      AND u.is_active = TRUE
    )
  );

-- New policy: Directivos and coordinadores can manage authorized_users
CREATE POLICY "Admins can manage authorized_users" ON authorized_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role IN ('super_admin', 'directivo', 'coordinador')
      AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id::text = auth.uid()::text
      AND u.role IN ('super_admin', 'directivo', 'coordinador')
      AND u.is_active = TRUE
    )
  );

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE usuarios IS 'Custom users table with username/password authentication';
COMMENT ON COLUMN usuarios.role IS 'User role: docente, coordinador, directivo, administrativo, or super_admin';
COMMENT ON COLUMN usuarios.password_hash IS 'bcrypt hash of the user password';
COMMENT ON FUNCTION create_super_admin IS 'Creates the initial super admin user. Can only be called once.';

