-- Seed example indicators for demonstration purposes
-- This script loads sample indicators for Matemática 1er Grado
-- Can be adapted for other subjects and grades

-- ============================================
-- SEED: Matemática 1er Grado
-- ============================================
WITH clase_math_1 AS (
  SELECT id_clase FROM clases 
  WHERE nombre_materia LIKE '%Matemática%' 
    AND grado_asignado = '1er Grado'
  LIMIT 1
)
INSERT INTO maestra_indicadores (id_clase, categoria, descripcion, orden, activo)
SELECT 
  id_clase, 
  'Indicador',
  descripcion,
  orden,
  true
FROM clase_math_1, (VALUES
  ('Utiliza técnicas de cálculo mental para resolver adiciones simples', 1),
  ('Ordena y resuelve adiciones simples con llevada', 2),
  ('Resuelve problemas simples de lógica matemática', 3),
  ('Identifica y nombra figuras geométricas básicas', 4),
  ('Comprende el concepto de unidad y decena', 5)
) AS indicadores(descripcion, orden)
WHERE EXISTS (SELECT 1 FROM clase_math_1);

-- ============================================
-- SEED: Lenguaje 1er Grado
-- ============================================
WITH clase_leng_1 AS (
  SELECT id_clase FROM clases 
  WHERE nombre_materia LIKE '%Lenguaje%' 
    AND grado_asignado = '1er Grado'
  LIMIT 1
)
INSERT INTO maestra_indicadores (id_clase, categoria, descripcion, orden, activo)
SELECT 
  id_clase, 
  'Indicador',
  descripcion,
  orden,
  true
FROM clase_leng_1, (VALUES
  ('Lee palabras simples con fluidez', 1),
  ('Comprende textos cortos adecuados a su edad', 2),
  ('Escribe oraciones simples con coherencia', 3),
  ('Identifica vocales y consonantes', 4),
  ('Participa activamente en conversaciones guiadas', 5)
) AS indicadores(descripcion, orden)
WHERE EXISTS (SELECT 1 FROM clase_leng_1);

-- ============================================
-- SEED: Matemática 2do Grado
-- ============================================
WITH clase_math_2 AS (
  SELECT id_clase FROM clases 
  WHERE nombre_materia LIKE '%Matemática%' 
    AND grado_asignado = '2do Grado'
  LIMIT 1
)
INSERT INTO maestra_indicadores (id_clase, categoria, descripcion, orden, activo)
SELECT 
  id_clase, 
  'Indicador',
  descripcion,
  orden,
  true
FROM clase_math_2, (VALUES
  ('Resuelve multiplicaciones básicas (tablas del 2 al 5)', 1),
  ('Aplica la resta con prestado correctamente', 2),
  ('Resuelve problemas de dos pasos con operaciones combinadas', 3),
  ('Reconoce patrones numéricos simples', 4),
  ('Mide longitudes usando unidades estándar', 5)
) AS indicadores(descripcion, orden)
WHERE EXISTS (SELECT 1 FROM clase_math_2);

-- ============================================
-- NOTES
-- ============================================
-- This is a sample seed script. To add indicators for other subjects:
-- 1. Identify the id_clase from the 'clases' table
-- 2. Add a new WITH clause with your subject/grade
-- 3. List the indicators with their order
-- 4. Can also be loaded from Excel using a custom import script
