-- =====================================================
-- MÓDULO: EVALUATION BUILDER (Constructor de Evaluaciones RRHH)
-- Descripción: Sistema dinámico para crear plantillas de evaluación
-- de desempeño con estructura jerárquica (Áreas > Subáreas > Ítems)
-- =====================================================

-- 1. TABLA: rrhh_templates (Plantillas de Evaluación)
-- Almacena las plantillas maestras de evaluación
CREATE TABLE IF NOT EXISTS rrhh_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    total_weight_check NUMERIC(5,2) DEFAULT 0, -- Debe sumar 100%
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: rrhh_areas (Áreas de Competencia)
-- Primer nivel de la jerarquía (ej: "Liderazgo", "Planificación")
CREATE TABLE IF NOT EXISTS rrhh_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES rrhh_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight_percentage NUMERIC(5,2) NOT NULL CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: rrhh_subareas (Subáreas de Competencia)
-- Segundo nivel de la jerarquía (ej: "Planificación Estratégica")
CREATE TABLE IF NOT EXISTS rrhh_subareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES rrhh_areas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relative_weight NUMERIC(5,2) NOT NULL CHECK (relative_weight >= 0 AND relative_weight <= 100),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: rrhh_items (Ítems/Preguntas de Evaluación)
-- Tercer nivel de la jerarquía (las preguntas específicas)
CREATE TABLE IF NOT EXISTS rrhh_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subarea_id UUID NOT NULL REFERENCES rrhh_subareas(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: rrhh_assignments (Asignaciones de Evaluación)
-- Relaciona plantillas con evaluadores y evaluados
CREATE TABLE IF NOT EXISTS rrhh_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES rrhh_templates(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    evaluatee_id UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    final_score NUMERIC(5,2),
    evaluation_period TEXT, -- ej: "2025-I Lapso"
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: rrhh_responses (Respuestas a Evaluaciones)
-- Almacena las respuestas individuales por ítem
CREATE TABLE IF NOT EXISTS rrhh_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES rrhh_assignments(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES rrhh_items(id) ON DELETE CASCADE,
    self_score NUMERIC(3,1) CHECK (self_score >= 1 AND self_score <= 5), -- Autoevaluación (1-5)
    supervisor_score NUMERIC(3,1) CHECK (supervisor_score >= 1 AND supervisor_score <= 5), -- Evaluación supervisor
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, item_id) -- Una respuesta por ítem por asignación
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rrhh_areas_template ON rrhh_areas(template_id);
CREATE INDEX IF NOT EXISTS idx_rrhh_subareas_area ON rrhh_subareas(area_id);
CREATE INDEX IF NOT EXISTS idx_rrhh_items_subarea ON rrhh_items(subarea_id);
CREATE INDEX IF NOT EXISTS idx_rrhh_assignments_template ON rrhh_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_rrhh_assignments_evaluatee ON rrhh_assignments(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_rrhh_assignments_evaluator ON rrhh_assignments(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_rrhh_responses_assignment ON rrhh_responses(assignment_id);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_rrhh_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rrhh_templates_updated_at
    BEFORE UPDATE ON rrhh_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_rrhh_updated_at();

CREATE TRIGGER update_rrhh_areas_updated_at
    BEFORE UPDATE ON rrhh_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_rrhh_updated_at();

CREATE TRIGGER update_rrhh_subareas_updated_at
    BEFORE UPDATE ON rrhh_subareas
    FOR EACH ROW
    EXECUTE FUNCTION update_rrhh_updated_at();

CREATE TRIGGER update_rrhh_items_updated_at
    BEFORE UPDATE ON rrhh_items
    FOR EACH ROW
    EXECUTE FUNCTION update_rrhh_updated_at();

CREATE TRIGGER update_rrhh_assignments_updated_at
    BEFORE UPDATE ON rrhh_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_rrhh_updated_at();

CREATE TRIGGER update_rrhh_responses_updated_at
    BEFORE UPDATE ON rrhh_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_rrhh_updated_at();

-- =====================================================
-- TRIGGER PARA VALIDAR SUMA DE PESOS (100%)
-- =====================================================

CREATE OR REPLACE FUNCTION validate_area_weights()
RETURNS TRIGGER AS $$
DECLARE
    total_weight NUMERIC;
BEGIN
    -- Calcular la suma total de pesos de las áreas
    SELECT COALESCE(SUM(weight_percentage), 0)
    INTO total_weight
    FROM rrhh_areas
    WHERE template_id = NEW.template_id;
    
    -- Actualizar el campo total_weight_check en la plantilla
    UPDATE rrhh_templates
    SET total_weight_check = total_weight
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_area_weights_after_insert
    AFTER INSERT ON rrhh_areas
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_weights();

CREATE TRIGGER check_area_weights_after_update
    AFTER UPDATE ON rrhh_areas
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_weights();

CREATE TRIGGER check_area_weights_after_delete
    AFTER DELETE ON rrhh_areas
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_weights();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE rrhh_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_subareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para rrhh_templates
CREATE POLICY "Todos pueden ver plantillas activas"
    ON rrhh_templates FOR SELECT
    USING (active = true);

CREATE POLICY "Solo coordinadores/directivos pueden crear plantillas"
    ON rrhh_templates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

CREATE POLICY "Solo coordinadores/directivos pueden editar plantillas"
    ON rrhh_templates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

-- Políticas para rrhh_areas, rrhh_subareas, rrhh_items (heredan de template)
CREATE POLICY "Todos pueden ver áreas de plantillas activas"
    ON rrhh_areas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rrhh_templates
            WHERE id = template_id AND active = true
        )
    );

CREATE POLICY "Solo coordinadores/directivos pueden gestionar áreas"
    ON rrhh_areas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

CREATE POLICY "Todos pueden ver subáreas"
    ON rrhh_subareas FOR SELECT
    USING (true);

CREATE POLICY "Solo coordinadores/directivos pueden gestionar subáreas"
    ON rrhh_subareas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

CREATE POLICY "Todos pueden ver ítems"
    ON rrhh_items FOR SELECT
    USING (true);

CREATE POLICY "Solo coordinadores/directivos pueden gestionar ítems"
    ON rrhh_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

-- Políticas para rrhh_assignments
CREATE POLICY "Los usuarios pueden ver sus propias asignaciones"
    ON rrhh_assignments FOR SELECT
    USING (
        evaluatee_id = auth.uid() OR
        evaluator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

CREATE POLICY "Solo coordinadores/directivos pueden crear asignaciones"
    ON rrhh_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

CREATE POLICY "Solo coordinadores/directivos pueden editar asignaciones"
    ON rrhh_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

-- Políticas para rrhh_responses
CREATE POLICY "Los usuarios pueden ver respuestas de sus asignaciones"
    ON rrhh_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rrhh_assignments
            WHERE id = assignment_id
            AND (evaluatee_id = auth.uid() OR evaluator_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

CREATE POLICY "Los evaluados pueden crear/editar sus autoevaluaciones"
    ON rrhh_responses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM rrhh_assignments
            WHERE id = assignment_id
            AND evaluatee_id = auth.uid()
        )
    );

CREATE POLICY "Los evaluadores pueden crear/editar evaluaciones"
    ON rrhh_responses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM rrhh_assignments
            WHERE id = assignment_id
            AND evaluator_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id_usuario = auth.uid()
            AND role IN ('coordinador', 'directivo')
        )
    );

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE rrhh_templates IS 'Plantillas maestras de evaluación de desempeño';
COMMENT ON TABLE rrhh_areas IS 'Áreas de competencia (primer nivel jerárquico)';
COMMENT ON TABLE rrhh_subareas IS 'Subáreas de competencia (segundo nivel jerárquico)';
COMMENT ON TABLE rrhh_items IS 'Ítems/preguntas específicas de evaluación (tercer nivel)';
COMMENT ON TABLE rrhh_assignments IS 'Asignaciones de evaluaciones a usuarios';
COMMENT ON TABLE rrhh_responses IS 'Respuestas individuales a ítems de evaluación';
