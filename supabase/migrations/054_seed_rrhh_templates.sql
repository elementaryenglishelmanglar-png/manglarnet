-- =====================================================
-- SEED DATA: RRHH Evaluation Builder
-- Datos de ejemplo para probar el sistema
-- =====================================================

-- 1. PLANTILLA DE EJEMPLO: Evaluación Docentes 2025
DO $$
DECLARE
    template_id UUID;
    area_liderazgo_id UUID;
    area_competencias_id UUID;
    area_desarrollo_id UUID;
    subarea_planificacion_id UUID;
    subarea_gestion_id UUID;
    subarea_dominio_id UUID;
    subarea_metodologia_id UUID;
    subarea_formacion_id UUID;
BEGIN
    -- Crear plantilla
    INSERT INTO rrhh_templates (name, description, active)
    VALUES ('Evaluación Docentes 2025', 'Plantilla de evaluación de desempeño para docentes del año escolar 2025-2026', true)
    RETURNING id INTO template_id;

    -- =====================================================
    -- ÁREA 1: LIDERAZGO PEDAGÓGICO (40%)
    -- =====================================================
    INSERT INTO rrhh_areas (template_id, name, weight_percentage, order_index)
    VALUES (template_id, 'Liderazgo Pedagógico', 40.00, 1)
    RETURNING id INTO area_liderazgo_id;

    -- Subárea 1.1: Planificación (50% del área)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_liderazgo_id, 'Planificación de Clases', 50.00, 1)
    RETURNING id INTO subarea_planificacion_id;

    -- Ítems de Planificación
    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_planificacion_id, 'Planifica sus clases con anticipación y de manera estructurada', 1),
    (subarea_planificacion_id, 'Utiliza recursos didácticos variados y apropiados', 2),
    (subarea_planificacion_id, 'Adapta la planificación según las necesidades de los estudiantes', 3);

    -- Subárea 1.2: Gestión del Aula (50% del área)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_liderazgo_id, 'Gestión del Aula', 50.00, 2)
    RETURNING id INTO subarea_gestion_id;

    -- Ítems de Gestión del Aula
    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_gestion_id, 'Mantiene un ambiente de disciplina positiva y respeto', 1),
    (subarea_gestion_id, 'Fomenta la participación activa de todos los estudiantes', 2),
    (subarea_gestion_id, 'Gestiona eficientemente el tiempo de clase', 3);

    -- =====================================================
    -- ÁREA 2: COMPETENCIAS TÉCNICAS (35%)
    -- =====================================================
    INSERT INTO rrhh_areas (template_id, name, weight_percentage, order_index)
    VALUES (template_id, 'Competencias Técnicas', 35.00, 2)
    RETURNING id INTO area_competencias_id;

    -- Subárea 2.1: Dominio de Contenido (60% del área)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_competencias_id, 'Dominio de Contenido', 60.00, 1)
    RETURNING id INTO subarea_dominio_id;

    -- Ítems de Dominio de Contenido
    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_dominio_id, 'Demuestra conocimiento profundo de su materia', 1),
    (subarea_dominio_id, 'Se mantiene actualizado en su área de especialización', 2),
    (subarea_dominio_id, 'Relaciona los contenidos con situaciones de la vida real', 3);

    -- Subárea 2.2: Metodología (40% del área)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_competencias_id, 'Metodología de Enseñanza', 40.00, 2)
    RETURNING id INTO subarea_metodologia_id;

    -- Ítems de Metodología
    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_metodologia_id, 'Utiliza métodos de enseñanza innovadores y efectivos', 1),
    (subarea_metodologia_id, 'Evalúa el aprendizaje de manera justa y constructiva', 2),
    (subarea_metodologia_id, 'Proporciona retroalimentación oportuna y específica', 3);

    -- =====================================================
    -- ÁREA 3: DESARROLLO PROFESIONAL (25%)
    -- =====================================================
    INSERT INTO rrhh_areas (template_id, name, weight_percentage, order_index)
    VALUES (template_id, 'Desarrollo Profesional', 25.00, 3)
    RETURNING id INTO area_desarrollo_id;

    -- Subárea 3.1: Formación Continua (100% del área)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_desarrollo_id, 'Formación Continua', 100.00, 1)
    RETURNING id INTO subarea_formacion_id;

    -- Ítems de Formación Continua
    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_formacion_id, 'Participa activamente en capacitaciones y talleres', 1),
    (subarea_formacion_id, 'Comparte conocimientos y buenas prácticas con colegas', 2),
    (subarea_formacion_id, 'Busca oportunidades de mejora y crecimiento profesional', 3),
    (subarea_formacion_id, 'Implementa nuevas estrategias aprendidas en su práctica docente', 4);

    RAISE NOTICE 'Plantilla "Evaluación Docentes 2025" creada exitosamente con ID: %', template_id;
END $$;

-- =====================================================
-- 2. PLANTILLA DE EJEMPLO: Evaluación Personal Administrativo
-- =====================================================

DO $$
DECLARE
    template_id UUID;
    area_desempeno_id UUID;
    area_actitud_id UUID;
    subarea_eficiencia_id UUID;
    subarea_calidad_id UUID;
    subarea_colaboracion_id UUID;
    subarea_iniciativa_id UUID;
BEGIN
    -- Crear plantilla
    INSERT INTO rrhh_templates (name, description, active)
    VALUES ('Evaluación Personal Administrativo 2025', 'Plantilla de evaluación para personal administrativo y de apoyo', true)
    RETURNING id INTO template_id;

    -- =====================================================
    -- ÁREA 1: DESEMPEÑO LABORAL (60%)
    -- =====================================================
    INSERT INTO rrhh_areas (template_id, name, weight_percentage, order_index)
    VALUES (template_id, 'Desempeño Laboral', 60.00, 1)
    RETURNING id INTO area_desempeno_id;

    -- Subárea 1.1: Eficiencia (50%)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_desempeno_id, 'Eficiencia y Productividad', 50.00, 1)
    RETURNING id INTO subarea_eficiencia_id;

    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_eficiencia_id, 'Cumple con las tareas asignadas en los plazos establecidos', 1),
    (subarea_eficiencia_id, 'Organiza su trabajo de manera efectiva', 2),
    (subarea_eficiencia_id, 'Maneja múltiples responsabilidades simultáneamente', 3);

    -- Subárea 1.2: Calidad (50%)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_desempeno_id, 'Calidad del Trabajo', 50.00, 2)
    RETURNING id INTO subarea_calidad_id;

    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_calidad_id, 'Realiza su trabajo con precisión y atención al detalle', 1),
    (subarea_calidad_id, 'Minimiza errores y retrabajos', 2),
    (subarea_calidad_id, 'Cumple con los estándares de calidad establecidos', 3);

    -- =====================================================
    -- ÁREA 2: ACTITUD Y VALORES (40%)
    -- =====================================================
    INSERT INTO rrhh_areas (template_id, name, weight_percentage, order_index)
    VALUES (template_id, 'Actitud y Valores', 40.00, 2)
    RETURNING id INTO area_actitud_id;

    -- Subárea 2.1: Colaboración (50%)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_actitud_id, 'Trabajo en Equipo', 50.00, 1)
    RETURNING id INTO subarea_colaboracion_id;

    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_colaboracion_id, 'Colabora efectivamente con sus compañeros', 1),
    (subarea_colaboracion_id, 'Mantiene una actitud positiva y constructiva', 2),
    (subarea_colaboracion_id, 'Apoya a otros cuando es necesario', 3);

    -- Subárea 2.2: Iniciativa (50%)
    INSERT INTO rrhh_subareas (area_id, name, relative_weight, order_index)
    VALUES (area_actitud_id, 'Iniciativa y Proactividad', 50.00, 2)
    RETURNING id INTO subarea_iniciativa_id;

    INSERT INTO rrhh_items (subarea_id, text, order_index) VALUES
    (subarea_iniciativa_id, 'Propone mejoras y soluciones creativas', 1),
    (subarea_iniciativa_id, 'Toma iniciativa sin necesidad de supervisión constante', 2),
    (subarea_iniciativa_id, 'Se adapta a cambios y nuevas situaciones', 3);

    RAISE NOTICE 'Plantilla "Evaluación Personal Administrativo 2025" creada exitosamente con ID: %', template_id;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver plantillas creadas
SELECT 
    t.name,
    t.total_weight_check,
    COUNT(DISTINCT a.id) as num_areas,
    COUNT(DISTINCT s.id) as num_subareas,
    COUNT(DISTINCT i.id) as num_items
FROM rrhh_templates t
LEFT JOIN rrhh_areas a ON a.template_id = t.id
LEFT JOIN rrhh_subareas s ON s.area_id = a.id
LEFT JOIN rrhh_items i ON i.subarea_id = s.id
WHERE t.active = true
GROUP BY t.id, t.name, t.total_weight_check
ORDER BY t.created_at DESC;

-- Verificar que los pesos sumen 100%
SELECT 
    t.name as plantilla,
    t.total_weight_check as peso_total,
    CASE 
        WHEN ABS(t.total_weight_check - 100) < 0.01 THEN '✅ Correcto'
        WHEN t.total_weight_check < 100 THEN '⚠️ Falta peso'
        ELSE '❌ Exceso de peso'
    END as validacion
FROM rrhh_templates t
WHERE t.active = true;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE rrhh_templates IS 'Contiene 2 plantillas de ejemplo: Docentes y Administrativo';
