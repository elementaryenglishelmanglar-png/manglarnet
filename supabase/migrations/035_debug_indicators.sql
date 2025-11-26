-- Script de Diagnóstico
-- Ejecuta esto para ver qué está pasando en la base de datos

-- 1. Ver cuántos indicadores hay en total
SELECT 'Total Indicadores' as descripcion, COUNT(*) as cantidad FROM maestra_indicadores
UNION ALL
SELECT 'Total Clases', COUNT(*) FROM clases
UNION ALL
SELECT 'Clases con Indicadores', COUNT(DISTINCT id_clase) FROM maestra_indicadores;

-- 2. Ver algunas materias para comprobar los nombres
SELECT id_clase, nombre_materia, grado_asignado 
FROM clases 
ORDER BY nombre_materia 
LIMIT 10;

-- 3. Ver si hay indicadores para "Sociales" específicamente
SELECT c.nombre_materia, count(mi.id_indicador) as num_indicadores
FROM clases c
LEFT JOIN maestra_indicadores mi ON c.id_clase = mi.id_clase
WHERE c.nombre_materia ILIKE '%Sociales%'
GROUP BY c.nombre_materia;
