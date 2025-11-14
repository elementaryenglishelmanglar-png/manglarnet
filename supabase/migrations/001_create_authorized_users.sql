-- Create table for authorized users (whitelist)
-- This table stores emails that are allowed to access the system

CREATE TABLE IF NOT EXISTS authorized_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('docente', 'coordinador', 'directivo', 'administrativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);

-- Enable Row Level Security
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read authorized_users
CREATE POLICY "Users can read authorized_users" ON authorized_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only directivos can insert/update/delete authorized_users
CREATE POLICY "Directivos can manage authorized_users" ON authorized_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.role = 'directivo'
    )
  );

-- Insert initial authorized users (coordinadores)
INSERT INTO authorized_users (email, role) VALUES
  ('elementaryenglish.elmanglar@gmail.com', 'coordinador'),
  ('coordinacionprimariaciem@gmail.com', 'coordinador'),
  ('ysabelzamora.elmanglar@gmail.com', 'coordinador')
ON CONFLICT (email) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_authorized_users_updated_at
  BEFORE UPDATE ON authorized_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

