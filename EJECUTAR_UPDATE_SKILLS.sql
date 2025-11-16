-- Update: Agregar "Creative Writing" a los skills permitidos
-- Ejecuta este SQL en Supabase SQL Editor si ya ejecutaste la migración 012_ingles_primaria_logic.sql

-- Primero, eliminar el constraint existente
ALTER TABLE clases 
DROP CONSTRAINT IF EXISTS clases_skill_rutina_check;

-- Luego, agregar el nuevo constraint con "Creative Writing" incluido
ALTER TABLE clases 
ADD CONSTRAINT clases_skill_rutina_check 
CHECK (skill_rutina IN ('Reading', 'Writing', 'Speaking', 'Listening', 'Use of English', 'Phonics', 'Project', 'Creative Writing') OR skill_rutina IS NULL);

-- Verificar que se actualizó correctamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'clases'::regclass
AND conname = 'clases_skill_rutina_check';

