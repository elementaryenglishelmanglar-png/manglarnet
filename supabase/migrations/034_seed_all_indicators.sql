-- Migration: Seed All Indicators
-- Description: Populates maestra_indicadores with default indicators for all subjects based on class names
-- Date: 2025-01-24

-- Function to insert indicators for a specific subject pattern
CREATE OR REPLACE FUNCTION seed_indicators_for_subject(
    subject_pattern TEXT, 
    indicators JSONB
) RETURNS VOID AS $$
DECLARE
    class_record RECORD;
    indicator_record JSONB;
    indicator_order INTEGER;
BEGIN
    FOR class_record IN SELECT id_clase, nombre_materia FROM clases WHERE nombre_materia ILIKE subject_pattern LOOP
        indicator_order := 1;
        FOR indicator_record IN SELECT * FROM jsonb_array_elements(indicators) LOOP
            -- Check if indicator already exists to avoid duplicates
            IF NOT EXISTS (
                SELECT 1 FROM maestra_indicadores 
                WHERE id_clase = class_record.id_clase 
                AND descripcion = (indicator_record->>'descripcion')
            ) THEN
                INSERT INTO maestra_indicadores (id_clase, categoria, descripcion, orden, activo)
                VALUES (
                    class_record.id_clase,
                    (indicator_record->>'categoria'),
                    (indicator_record->>'descripcion'),
                    indicator_order,
                    true
                );
            END IF;
            indicator_order := indicator_order + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Seed Mathematics
SELECT seed_indicators_for_subject('%Matemática%', '[
    {"categoria": "Competencia", "descripcion": "Resuelve problemas matemáticos utilizando operaciones básicas"},
    {"categoria": "Competencia", "descripcion": "Identifica y clasifica figuras geométricas"},
    {"categoria": "Indicador", "descripcion": "Realiza cálculos mentales con agilidad"},
    {"categoria": "Indicador", "descripcion": "Interpreta datos en tablas y gráficos"},
    {"categoria": "Indicador", "descripcion": "Mantiene el orden y la limpieza en sus trabajos numéricos"}
]'::jsonb);

-- Seed Language/Spanish
SELECT seed_indicators_for_subject('%Lenguaje%', '[
    {"categoria": "Competencia", "descripcion": "Comprende textos leídos acorde a su nivel"},
    {"categoria": "Competencia", "descripcion": "Produce textos escritos con coherencia y cohesión"},
    {"categoria": "Indicador", "descripcion": "Utiliza correctamente las reglas ortográficas"},
    {"categoria": "Indicador", "descripcion": "Se expresa oralmente con fluidez y vocabulario adecuado"},
    {"categoria": "Indicador", "descripcion": "Muestra interés por la lectura recreativa"}
]'::jsonb);

SELECT seed_indicators_for_subject('%Castellano%', '[
    {"categoria": "Competencia", "descripcion": "Analiza obras literarias identificando sus elementos"},
    {"categoria": "Competencia", "descripcion": "Redacta ensayos y textos argumentativos"},
    {"categoria": "Indicador", "descripcion": "Aplica normas gramaticales complejas"},
    {"categoria": "Indicador", "descripcion": "Participa activamente en debates y exposiciones"},
    {"categoria": "Indicador", "descripcion": "Investiga fuentes confiables para sus trabajos"}
]'::jsonb);

-- Seed Science
SELECT seed_indicators_for_subject('%Ciencia%', '[
    {"categoria": "Competencia", "descripcion": "Aplica el método científico en experimentos sencillos"},
    {"categoria": "Competencia", "descripcion": "Comprende los sistemas del cuerpo humano y su cuidado"},
    {"categoria": "Indicador", "descripcion": "Identifica características de los seres vivos"},
    {"categoria": "Indicador", "descripcion": "Reconoce la importancia del cuidado del medio ambiente"},
    {"categoria": "Indicador", "descripcion": "Registra observaciones de manera ordenada"}
]'::jsonb);

-- Seed English
SELECT seed_indicators_for_subject('%Inglés%', '[
    {"categoria": "Competencia", "descripcion": "Comprende instrucciones y mensajes orales en inglés"},
    {"categoria": "Competencia", "descripcion": "Produce textos sencillos en inglés"},
    {"categoria": "Indicador", "descripcion": "Utiliza vocabulario aprendido en contexto"},
    {"categoria": "Indicador", "descripcion": "Pronuncia con claridad palabras y frases"},
    {"categoria": "Indicador", "descripcion": "Participa en diálogos cortos con sus compañeros"}
]'::jsonb);

SELECT seed_indicators_for_subject('%English%', '[
    {"categoria": "Competencia", "descripcion": "Demonstrates reading comprehension of grade-level texts"},
    {"categoria": "Competencia", "descripcion": "Writes clear and structured paragraphs"},
    {"categoria": "Indicador", "descripcion": "Uses correct grammar structures in speech and writing"},
    {"categoria": "Indicador", "descripcion": "Expresses opinions and ideas fluently"},
    {"categoria": "Indicador", "descripcion": "Actively participates in class discussions"}
]'::jsonb);

-- Seed Social Studies
SELECT seed_indicators_for_subject('%Sociales%', '[
    {"categoria": "Competencia", "descripcion": "Reconoce hechos históricos relevantes"},
    {"categoria": "Competencia", "descripcion": "Identifica características geográficas de su entorno"},
    {"categoria": "Indicador", "descripcion": "Valora la diversidad cultural"},
    {"categoria": "Indicador", "descripcion": "Ubica lugares en mapas y planos"},
    {"categoria": "Indicador", "descripcion": "Comprende normas de convivencia ciudadana"}
]'::jsonb);

-- Seed Art
SELECT seed_indicators_for_subject('%Arte%', '[
    {"categoria": "Competencia", "descripcion": "Se expresa creativamente a través de diversas técnicas"},
    {"categoria": "Competencia", "descripcion": "Aprecia manifestaciones artísticas propias y ajenas"},
    {"categoria": "Indicador", "descripcion": "Utiliza el color y la forma con intencionalidad"},
    {"categoria": "Indicador", "descripcion": "Mantiene el cuidado de los materiales de trabajo"},
    {"categoria": "Indicador", "descripcion": "Finaliza sus proyectos artísticos a tiempo"}
]'::jsonb);

-- Seed Physical Education
SELECT seed_indicators_for_subject('%Física%', '[
    {"categoria": "Competencia", "descripcion": "Desarrolla sus capacidades físicas básicas"},
    {"categoria": "Competencia", "descripcion": "Participa en juegos y deportes respetando las reglas"},
    {"categoria": "Indicador", "descripcion": "Demuestra coordinación motriz global y segmentaria"},
    {"categoria": "Indicador", "descripcion": "Valora la higiene y el cuidado personal"},
    {"categoria": "Indicador", "descripcion": "Trabaja en equipo y respeta a sus compañeros"}
]'::jsonb);

-- Seed General (for any subject not matched above)
-- Only inserts if class has no indicators yet
INSERT INTO maestra_indicadores (id_clase, categoria, descripcion, orden, activo)
SELECT id_clase, 'Competencia', 'Cumple con las actividades asignadas', 1, true
FROM clases c
WHERE NOT EXISTS (SELECT 1 FROM maestra_indicadores mi WHERE mi.id_clase = c.id_clase);

INSERT INTO maestra_indicadores (id_clase, categoria, descripcion, orden, activo)
SELECT id_clase, 'Indicador', 'Participa activamente en clase', 2, true
FROM clases c
WHERE (SELECT count(*) FROM maestra_indicadores mi WHERE mi.id_clase = c.id_clase) = 1;

INSERT INTO maestra_indicadores (id_clase, categoria, descripcion, orden, activo)
SELECT id_clase, 'Indicador', 'Muestra respeto hacia sus compañeros y docentes', 3, true
FROM clases c
WHERE (SELECT count(*) FROM maestra_indicadores mi WHERE mi.id_clase = c.id_clase) = 2;

-- Cleanup function
DROP FUNCTION seed_indicators_for_subject(TEXT, JSONB);
