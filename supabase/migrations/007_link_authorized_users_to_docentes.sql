-- DEPRECATED: This migration is part of the legacy authentication system
-- The current system uses the unified 'usuarios' table (see migration 030_unified_auth_system.sql)
-- The function link_docente_to_user() may still be useful but the view references the deprecated table
--
-- Migration: Link authorized_users to docentes
-- This migration improves the linking between authorized_users (whitelist) and docentes (teachers)
-- It ensures that when a teacher logs in, they can be automatically linked to their docente record

-- Add a function to automatically link docente when user logs in (if email matches)
CREATE OR REPLACE FUNCTION link_docente_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user signs up or logs in, try to link them to an existing docente by email
  IF NEW.email IS NOT NULL THEN
    UPDATE docentes
    SET id_usuario = NEW.id
    WHERE email = LOWER(NEW.email)
    AND id_usuario IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically link docente when auth.users is created/updated
-- Note: This requires access to auth.users, which may need special permissions
-- For now, we'll handle this in the application layer

-- Add index to improve email lookups for linking
CREATE INDEX IF NOT EXISTS idx_docentes_email_lower ON docentes(LOWER(email));

-- Add a view to see unlinked authorized users (docentes in whitelist without docente record)
CREATE OR REPLACE VIEW unlinked_authorized_docentes AS
SELECT 
  au.id,
  au.email,
  au.role,
  au.created_at,
  d.id_docente,
  d.nombres,
  d.apellidos
FROM authorized_users au
LEFT JOIN docentes d ON LOWER(d.email) = LOWER(au.email)
WHERE au.role = 'docente'
AND d.id_docente IS NULL;

-- Grant access to the view
GRANT SELECT ON unlinked_authorized_docentes TO authenticated;

-- Add RLS policy for the view
ALTER VIEW unlinked_authorized_docentes SET (security_invoker = true);

