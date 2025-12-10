-- ========================================
-- DIAGNÓSTICO: Ver Evaluaciones RRHH
-- ========================================

-- 1. Verificar si hay evaluaciones guardadas
SELECT 
    COUNT(*) as total_evaluaciones,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes
FROM rrhh_assignments;

-- 2. Ver últimas evaluaciones con todos los detalles
SELECT 
    a.id,
    a.template_id,
    a.evaluator_id,
    a.evaluatee_id,
    a.status,
    a.evaluation_period,
    a.final_score,
    a.completed_at,
    a.created_at
FROM rrhh_assignments a
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Verificar plantillas
SELECT id, name, is_active 
FROM rrhh_templates 
WHERE is_active = true
ORDER BY created_at DESC;

-- 4. Verificar usuarios
SELECT id, username, nombre, apellido, email, role, is_active
FROM usuarios
WHERE is_active = true
ORDER BY apellido, nombre;

-- 5. Ver evaluaciones con nombres (JOIN manual)
SELECT 
    a.id,
    a.evaluation_period,
    a.final_score,
    a.status,
    t.name as plantilla,
    e1.nombre || ' ' || e1.apellido as evaluador,
    e1.email as evaluador_email,
    e2.nombre || ' ' || e2.apellido as evaluado,
    e2.email as evaluado_email,
    a.completed_at
FROM rrhh_assignments a
LEFT JOIN rrhh_templates t ON a.template_id = t.id
LEFT JOIN usuarios e1 ON a.evaluator_id = e1.id
LEFT JOIN usuarios e2 ON a.evaluatee_id = e2.id
WHERE a.status = 'completed'
ORDER BY a.completed_at DESC
LIMIT 10;

-- 6. Verificar respuestas guardadas
SELECT 
    a.evaluation_period,
    e.nombre || ' ' || e.apellido as evaluado,
    COUNT(r.id) as total_respuestas,
    AVG(r.self_score) as promedio_auto,
    AVG(r.supervisor_score) as promedio_supervisor
FROM rrhh_assignments a
LEFT JOIN rrhh_responses r ON a.id = r.assignment_id
LEFT JOIN usuarios e ON a.evaluatee_id = e.id
WHERE a.status = 'completed'
GROUP BY a.id, a.evaluation_period, e.nombre, e.apellido
ORDER BY a.completed_at DESC;

-- 7. Verificar años escolares únicos
SELECT DISTINCT 
    SPLIT_PART(evaluation_period, ' - ', 1) as año_escolar,
    COUNT(*) as evaluaciones
FROM rrhh_assignments
WHERE status = 'completed' AND evaluation_period IS NOT NULL
GROUP BY SPLIT_PART(evaluation_period, ' - ', 1)
ORDER BY año_escolar DESC;

-- 8. Verificar lapsos únicos
SELECT DISTINCT 
    evaluation_period,
    COUNT(*) as evaluaciones
FROM rrhh_assignments
WHERE status = 'completed'
GROUP BY evaluation_period
ORDER BY evaluation_period DESC;

-- ========================================
-- SOLUCIONES COMUNES
-- ========================================

-- Si NO hay evaluaciones, necesitas crear una primero:
-- 1. Ve a "Evaluaciones RRHH" → "Evaluar Directamente"
-- 2. Completa una evaluación
-- 3. Guarda
-- 4. Refresca "Ver Evaluaciones"

-- Si hay evaluaciones pero no aparecen usuarios:
-- Verifica que los usuarios tengan nombre y apellido:
SELECT id, username, nombre, apellido 
FROM usuarios 
WHERE nombre IS NULL OR apellido IS NULL OR nombre = '' OR apellido = '';

-- Si encuentras usuarios sin nombre/apellido, actualízalos:
-- UPDATE usuarios 
-- SET nombre = 'Nombre', apellido = 'Apellido'
-- WHERE id = 'UUID_DEL_USUARIO';
