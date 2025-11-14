-- Fix RLS policies for authorized_users table
-- This migration fixes the policies to allow authenticated users to read their own authorization status

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;

-- Create a more permissive read policy that allows any authenticated user to read the table
-- This is needed during the authorization check process
CREATE POLICY "Authenticated users can read authorized_users" ON authorized_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only directivos can insert/update/delete authorized_users
-- This policy allows directivos to manage the table
CREATE POLICY "Directivos can manage authorized_users" ON authorized_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role = 'directivo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role = 'directivo'
    )
  );

