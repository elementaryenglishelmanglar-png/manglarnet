-- Script para verificar y corregir las clases por grado
-- Ejecuta este script en Supabase SQL Editor

-- 1. Ver qué grados existen actualmente en las clases
SELECT DISTINCT grado_asignado, COUNT(*) as cantidad_clases
FROM clases
GROUP BY grado_asignado
ORDER BY grado_asignado;

-- 2. Ver todas las clases existentes
SELECT id_clase, nombre_materia, grado_asignado, id_docente_asignado
FROM clases
ORDER BY grado_asignado, nombre_materia;

-- 3. Ver qué grados existen en alumnos (estos son los que deberían tener clases)
SELECT DISTINCT salon as grado, COUNT(*) as cantidad_alumnos
FROM alumnos
GROUP BY salon
ORDER BY salon;

-- IMPORTANTE: 
-- Necesitas crear clases para cada grado que tenga alumnos.
-- Puedes hacerlo desde la interfaz "Gestión de Clases" o con SQL.

-- Ejemplo de cómo crear clases para un grado (ajusta según tus necesidades):
/*
INSERT INTO clases (nombre_materia, grado_asignado, id_docente_asignado)
VALUES 
  ('Matemáticas', '1er Grado', NULL),
  ('Lenguaje', '1er Grado', NULL),
  ('Ciencias', '1er Grado', NULL),
  ('Sociales', '1er Grado', NULL),
  ('Inglés', '1er Grado', NULL);
*/

-- Repite para cada grado: 2do Grado, 3er Grado, 4to Grado, etc.
