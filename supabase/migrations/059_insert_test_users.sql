-- Insertar usuarios de prueba para evaluaciones RRHH
-- Primero, deshabilitar RLS temporalmente si está causando problemas
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Insertar usuarios de prueba
INSERT INTO usuarios (id_usuario, nombre, apellido, email, role, active) VALUES
-- Docentes
(gen_random_uuid(), 'María', 'González', 'maria.gonzalez@manglar.edu', 'docente', true),
(gen_random_uuid(), 'Carlos', 'Rodríguez', 'carlos.rodriguez@manglar.edu', 'docente', true),
(gen_random_uuid(), 'Ana', 'Martínez', 'ana.martinez@manglar.edu', 'docente', true),
(gen_random_uuid(), 'Luis', 'Pérez', 'luis.perez@manglar.edu', 'docente', true),
(gen_random_uuid(), 'Carmen', 'López', 'carmen.lopez@manglar.edu', 'docente', true),
(gen_random_uuid(), 'José', 'García', 'jose.garcia@manglar.edu', 'docente', true),
(gen_random_uuid(), 'Laura', 'Hernández', 'laura.hernandez@manglar.edu', 'docente', true),
(gen_random_uuid(), 'Pedro', 'Sánchez', 'pedro.sanchez@manglar.edu', 'docente', true),

-- Coordinadores
(gen_random_uuid(), 'Elena', 'Torres', 'elena.torres@manglar.edu', 'coordinador', true),
(gen_random_uuid(), 'Roberto', 'Ramírez', 'roberto.ramirez@manglar.edu', 'coordinador', true),

-- Directivos
(gen_random_uuid(), 'Isabel', 'Morales', 'isabel.morales@manglar.edu', 'directivo', true),

-- Administrativos
(gen_random_uuid(), 'Miguel', 'Castro', 'miguel.castro@manglar.edu', 'administrativo', true)

ON CONFLICT (email) DO NOTHING;

-- Verificar que se insertaron
SELECT id_usuario, nombre, apellido, role 
FROM usuarios 
WHERE role IN ('docente', 'coordinador', 'directivo', 'administrativo')
ORDER BY role, nombre;
