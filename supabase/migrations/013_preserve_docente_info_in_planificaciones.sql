-- Migration: Preserve docente information in planificaciones
-- This ensures that planificaciones retain the docente's name even if the docente is deleted
-- This is important for historical record keeping

-- Step 1: Add columns to store docente name information
ALTER TABLE planificaciones
ADD COLUMN IF NOT EXISTS nombres_docente TEXT,
ADD COLUMN IF NOT EXISTS apellidos_docente TEXT;

-- Step 2: Populate existing planificaciones with docente names
UPDATE planificaciones p
SET 
  nombres_docente = d.nombres,
  apellidos_docente = d.apellidos
FROM docentes d
WHERE p.id_docente = d.id_docente
AND (p.nombres_docente IS NULL OR p.apellidos_docente IS NULL);

-- Step 3: Create a function to automatically copy docente names when planificacion is created/updated
CREATE OR REPLACE FUNCTION sync_docente_names_in_planificacion()
RETURNS TRIGGER AS $$
BEGIN
  -- If id_docente is set, copy the names from docentes table
  IF NEW.id_docente IS NOT NULL THEN
    SELECT nombres, apellidos
    INTO NEW.nombres_docente, NEW.apellidos_docente
    FROM docentes
    WHERE id_docente = NEW.id_docente;
  END IF;
  
  -- If names are still NULL and id_docente is set, keep them as NULL (docente might have been deleted)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically sync docente names
DROP TRIGGER IF EXISTS trigger_sync_docente_names_planificacion ON planificaciones;
CREATE TRIGGER trigger_sync_docente_names_planificacion
  BEFORE INSERT OR UPDATE OF id_docente ON planificaciones
  FOR EACH ROW
  EXECUTE FUNCTION sync_docente_names_in_planificacion();

-- Step 5: Change the foreign key constraint to SET NULL instead of CASCADE
-- First, we need to drop the existing constraint and recreate it
ALTER TABLE planificaciones
DROP CONSTRAINT IF EXISTS planificaciones_id_docente_fkey;

-- Allow id_docente to be NULL (for historical records)
ALTER TABLE planificaciones
ALTER COLUMN id_docente DROP NOT NULL;

-- Recreate the foreign key with ON DELETE SET NULL
ALTER TABLE planificaciones
ADD CONSTRAINT planificaciones_id_docente_fkey
FOREIGN KEY (id_docente) 
REFERENCES docentes(id_docente) 
ON DELETE SET NULL;

-- Step 6: Create an index on the new columns for better query performance
CREATE INDEX IF NOT EXISTS idx_planificaciones_nombres_docente 
ON planificaciones(nombres_docente, apellidos_docente);

-- Step 7: Add a comment to document the purpose of these columns
COMMENT ON COLUMN planificaciones.nombres_docente IS 'Nombre del docente al momento de crear la planificación. Se preserva incluso si el docente es eliminado.';
COMMENT ON COLUMN planificaciones.apellidos_docente IS 'Apellidos del docente al momento de crear la planificación. Se preserva incluso si el docente es eliminado.';

