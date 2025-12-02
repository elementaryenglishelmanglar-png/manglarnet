-- ============================================
-- SETUP SCRIPT: Create First Admin User
-- ============================================
-- This script creates the first admin user (coordinador) for ManglarNet
-- Run this AFTER running the main migration (030_unified_auth_system.sql)

-- IMPORTANT: Replace these values with your desired credentials
-- Password will be set through Supabase Auth, not stored in plain text

-- Step 1: Create user in Supabase Auth (do this via Supabase Dashboard or API)
-- Go to: Authentication > Users > Add User
-- Email: admin@manglarnet.local
-- Password: [YOUR_SECURE_PASSWORD]
-- Auto Confirm Email: YES

-- Step 2: Get the user ID from auth.users
-- Run this query to find the user ID:
SELECT id, email FROM auth.users WHERE email = 'admin@manglarnet.local';

-- Step 3: Insert user into usuarios table
-- Replace 'USER_ID_HERE' with the actual UUID from Step 2
INSERT INTO usuarios (
  id,
  username,
  email,
  nombres,
  apellidos,
  telefono,
  role,
  is_active,
  email_verified
) VALUES (
  'USER_ID_HERE'::uuid,  -- Replace with actual user ID
  'admin',                -- Username for login
  'admin@manglarnet.local',
  'Administrador',        -- First name
  'Sistema',              -- Last name
  NULL,                   -- Phone (optional)
  'coordinador',          -- Role (coordinador has full permissions)
  TRUE,                   -- Active
  TRUE                    -- Email verified
);

-- Step 4: Verify the user was created
SELECT 
  u.id,
  u.username,
  u.email,
  u.nombres,
  u.apellidos,
  u.role,
  u.is_active
FROM usuarios u
WHERE u.email = 'admin@manglarnet.local';

-- ============================================
-- ALTERNATIVE: Create Multiple Users at Once
-- ============================================

-- If you have existing users in authorized_users table, migrate them:
INSERT INTO usuarios (
  id,
  username,
  email,
  nombres,
  apellidos,
  role,
  is_active,
  email_verified
)
SELECT 
  au.id,
  COALESCE(au.username, SPLIT_PART(au.email, '@', 1)) as username,
  au.email,
  'Usuario',  -- Update these manually later
  'ManglarNet',
  au.role,
  TRUE,
  TRUE
FROM auth.users au
WHERE au.email IN (
  -- List the emails of users you want to migrate
  'docente1@manglarnet.local',
  'coordinador1@manglarnet.local',
  'directivo1@manglarnet.local'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all users
SELECT 
  u.username,
  u.email,
  u.role,
  u.is_active,
  u.created_at
FROM usuarios u
ORDER BY u.created_at DESC;

-- Check user permissions
SELECT 
  u.username,
  u.role,
  rp.permissions
FROM usuarios u
JOIN role_permissions rp ON rp.role = u.role
WHERE u.username = 'admin';

-- Test the get_user_with_permissions function
SELECT * FROM get_user_with_permissions('USER_ID_HERE'::uuid);

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- Remove a user (soft delete - deactivate)
UPDATE usuarios 
SET is_active = FALSE 
WHERE username = 'username_to_deactivate';

-- Permanently delete a user (use with caution!)
-- This will also delete from auth.users due to CASCADE
DELETE FROM usuarios WHERE username = 'username_to_delete';
