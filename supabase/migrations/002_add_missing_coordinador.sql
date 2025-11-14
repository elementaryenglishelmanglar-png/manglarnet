-- Add missing coordinador user
-- This migration adds vargas199511@gmail.com as a coordinador

INSERT INTO authorized_users (email, role) VALUES
  ('vargas199511@gmail.com', 'coordinador')
ON CONFLICT (email) DO UPDATE
SET role = 'coordinador';

-- Verify the user was added
SELECT email, role FROM authorized_users 
WHERE email IN (
  'vargas199511@gmail.com',
  'elementaryenglish.elmanglar@gmail.com'
)
ORDER BY email;

