-- Quick fix: Activate schedule configurations for both academic years
-- Run this if you already have configurations but they are inactive

-- Activate 2024-2025 configuration
UPDATE configuracion_horarios
SET activa = true
WHERE ano_escolar = '2024-2025' AND activa = false;

-- Activate 2025-2026 configuration
UPDATE configuracion_horarios
SET activa = true
WHERE ano_escolar = '2025-2026' AND activa = false;

-- If no configuration exists for 2025-2026, create it
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
  true AS activa
WHERE NOT EXISTS (
  SELECT 1 FROM configuracion_horarios 
  WHERE ano_escolar = '2025-2026'
);

