-- Agregar usuario docente: Anderson Bracho
-- Email: frikioffice@gmail.com
-- Rol: docente

INSERT INTO authorized_users (email, role) VALUES
  ('frikioffice@gmail.com', 'docente')
ON CONFLICT (email) DO UPDATE
SET role = 'docente';

