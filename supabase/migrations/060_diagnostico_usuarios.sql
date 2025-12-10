-- Script de diagnóstico para verificar usuarios en la plataforma

-- 1. Verificar si existe la tabla usuarios
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'usuarios'
) as tabla_existe;

-- 2. Ver estructura de la tabla usuarios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 3. Contar usuarios totales
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- 4. Ver usuarios por rol
SELECT role, COUNT(*) as cantidad
FROM usuarios
GROUP BY role
ORDER BY cantidad DESC;

-- 5. Ver primeros 10 usuarios (sin datos sensibles)
SELECT id_usuario, nombre, apellido, email, role, active
FROM usuarios
LIMIT 10;

-- 6. Verificar RLS (Row Level Security)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'usuarios';

-- 7. Ver políticas RLS activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'usuarios';
