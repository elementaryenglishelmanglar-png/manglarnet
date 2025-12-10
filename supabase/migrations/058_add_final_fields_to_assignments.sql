-- Agregar campos de observaciones finales y acuerdos a rrhh_assignments
ALTER TABLE rrhh_assignments 
ADD COLUMN IF NOT EXISTS final_observations TEXT,
ADD COLUMN IF NOT EXISTS agreements TEXT;
