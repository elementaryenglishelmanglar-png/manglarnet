-- Agregar campos nombre y apellido a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido VARCHAR(100);

-- Actualizar usuarios existentes con valores por defecto basados en username
-- (Esto es temporal, luego se pueden actualizar manualmente)
UPDATE usuarios 
SET 
    nombre = COALESCE(nombre, INITCAP(SPLIT_PART(username, '.', 1))),
    apellido = COALESCE(apellido, INITCAP(SPLIT_PART(username, '.', 2)))
WHERE nombre IS NULL OR apellido IS NULL;

-- Verificar los cambios
SELECT id, username, nombre, apellido, email, role 
FROM usuarios 
ORDER BY apellido, nombre;
