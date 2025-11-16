-- Migration: Seed initial data for Schedule Optimizer
-- This migration populates initial data needed for the schedule optimizer

-- ============================================
-- SEED: AULAS (Classrooms)
-- ============================================
-- Insert basic classrooms if they don't exist
INSERT INTO aulas (nombre, tipo_aula, capacidad, equipamiento, activa)
SELECT * FROM (VALUES
  ('Aula 101', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Aula 102', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Aula 103', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Aula 104', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Aula 105', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Aula 201', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Aula 202', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Aula 203', 'Aula Regular', 30, '{}'::jsonb, true),
  ('Laboratorio de Química', 'Laboratorio', 24, '{"mesas_laboratorio": 12, "extractores": 2}'::jsonb, true),
  ('Laboratorio de Física', 'Laboratorio', 24, '{"mesas_laboratorio": 12}'::jsonb, true),
  ('Laboratorio de Biología', 'Laboratorio', 24, '{"mesas_laboratorio": 12, "microscopios": 12}'::jsonb, true),
  ('Sala de Computación 1', 'Sala de Computación', 30, '{"computadoras": 30}'::jsonb, true),
  ('Sala de Computación 2', 'Sala de Computación', 30, '{"computadoras": 30}'::jsonb, true),
  ('Gimnasio', 'Gimnasio', 50, '{"canchas": 2}'::jsonb, true),
  ('Biblioteca', 'Biblioteca', 40, '{"estanterias": 20}'::jsonb, true),
  ('Auditorio', 'Auditorio', 200, '{"proyector": true, "sonido": true}'::jsonb, true)
) AS v(nombre, tipo_aula, capacidad, equipamiento, activa)
WHERE NOT EXISTS (
  SELECT 1 FROM aulas WHERE aulas.nombre = v.nombre
);

-- ============================================
-- SEED: DOCENTE_MATERIAS (Teacher Capabilities)
-- ============================================
-- Auto-assign subjects based on docente.especialidad
-- This will create entries for all existing docentes based on their especialidad
INSERT INTO docente_materias (id_docente, nombre_materia, nivel_prioridad)
SELECT 
  d.id_docente,
  d.especialidad AS nombre_materia,
  3 AS nivel_prioridad -- 3 = especialidad
FROM docentes d
WHERE d.especialidad IS NOT NULL 
  AND d.especialidad != ''
  AND NOT EXISTS (
    SELECT 1 FROM docente_materias dm 
    WHERE dm.id_docente = d.id_docente 
    AND dm.nombre_materia = d.especialidad
  );

-- ============================================
-- SEED: CONFIGURACION_HORARIOS (Default Schedule Configuration)
-- ============================================
-- Create default configuration for current year if it doesn't exist
INSERT INTO configuracion_horarios (
  ano_escolar,
  bloques_horarios,
  dias_semana,
  semanas_totales,
  activa
)
SELECT 
  '2024-2025' AS ano_escolar,
  '[
    {"inicio": "08:00", "fin": "09:00", "nombre": "Bloque 1"},
    {"inicio": "09:00", "fin": "10:00", "nombre": "Bloque 2"},
    {"inicio": "10:00", "fin": "10:30", "nombre": "Recreo"},
    {"inicio": "10:30", "fin": "11:30", "nombre": "Bloque 3"},
    {"inicio": "11:30", "fin": "12:30", "nombre": "Bloque 4"},
    {"inicio": "12:30", "fin": "13:30", "nombre": "Almuerzo"},
    {"inicio": "13:30", "fin": "14:30", "nombre": "Bloque 5"},
    {"inicio": "14:30", "fin": "15:30", "nombre": "Bloque 6"}
  ]'::jsonb AS bloques_horarios,
  ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] AS dias_semana,
  18 AS semanas_totales,
  true AS activa
WHERE NOT EXISTS (
  SELECT 1 FROM configuracion_horarios 
  WHERE ano_escolar = '2024-2025' AND activa = true
);

-- Also create for 2025-2026
INSERT INTO configuracion_horarios (
  ano_escolar,
  bloques_horarios,
  dias_semana,
  semanas_totales,
  activa
)
SELECT 
  '2025-2026' AS ano_escolar,
  '[
    {"inicio": "08:00", "fin": "09:00", "nombre": "Bloque 1"},
    {"inicio": "09:00", "fin": "10:00", "nombre": "Bloque 2"},
    {"inicio": "10:00", "fin": "10:30", "nombre": "Recreo"},
    {"inicio": "10:30", "fin": "11:30", "nombre": "Bloque 3"},
    {"inicio": "11:30", "fin": "12:30", "nombre": "Bloque 4"},
    {"inicio": "12:30", "fin": "13:30", "nombre": "Almuerzo"},
    {"inicio": "13:30", "fin": "14:30", "nombre": "Bloque 5"},
    {"inicio": "14:30", "fin": "15:30", "nombre": "Bloque 6"}
  ]'::jsonb AS bloques_horarios,
  ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] AS dias_semana,
  18 AS semanas_totales,
  false AS activa -- Inactiva por defecto, se activa cuando se necesite
WHERE NOT EXISTS (
  SELECT 1 FROM configuracion_horarios 
  WHERE ano_escolar = '2025-2026'
);

