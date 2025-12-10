/**
 * RRHH Evaluation Builder Service
 * Servicio para gestionar plantillas de evaluación de desempeño
 */

import { supabase } from './supabaseClient';

// =====================================================
// TIPOS DE DATOS
// =====================================================

export interface RRHHTemplate {
    id: string;
    name: string;
    description?: string;
    total_weight_check: number;
    active: boolean;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RRHHArea {
    id: string;
    template_id: string;
    name: string;
    weight_percentage: number;
    order_index: number;
    created_at?: string;
    updated_at?: string;
}

export interface RRHHSubarea {
    id: string;
    area_id: string;
    name: string;
    relative_weight: number;
    order_index: number;
    created_at?: string;
    updated_at?: string;
}

export interface RRHHItem {
    id: string;
    subarea_id: string;
    text: string;
    order_index: number;
    created_at?: string;
    updated_at?: string;
}

export interface RRHHAssignment {
    id: string;
    template_id: string;
    evaluator_id?: string;
    evaluatee_id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    final_score?: number;
    evaluation_period?: string;
    due_date?: string;
    completed_at?: string;
    final_observations?: string;
    agreements?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RRHHResponse {
    id: string;
    assignment_id: string;
    item_id: string;
    self_score?: number;
    supervisor_score?: number;
    comment?: string;
    created_at?: string;
    updated_at?: string;
}

// Tipo compuesto para la estructura completa
export interface TemplateWithStructure extends RRHHTemplate {
    areas?: AreaWithStructure[];
}

export interface AreaWithStructure extends RRHHArea {
    subareas?: SubareaWithStructure[];
}

export interface SubareaWithStructure extends RRHHSubarea {
    items?: RRHHItem[];
}

// =====================================================
// SERVICIO: TEMPLATES
// =====================================================

export const rrhhTemplatesService = {
    /**
     * Obtener todas las plantillas activas
     */
    async getAll(): Promise<RRHHTemplate[]> {
        const { data, error } = await supabase
            .from('rrhh_templates')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtener una plantilla por ID con toda su estructura
     */
    async getById(id: string): Promise<TemplateWithStructure | null> {
        const { data: template, error: templateError } = await supabase
            .from('rrhh_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (templateError) throw templateError;
        if (!template) return null;

        // Obtener áreas
        const { data: areas, error: areasError } = await supabase
            .from('rrhh_areas')
            .select('*')
            .eq('template_id', id)
            .order('order_index');

        if (areasError) throw areasError;

        // Para cada área, obtener subáreas e ítems
        const areasWithStructure: AreaWithStructure[] = await Promise.all(
            (areas || []).map(async (area) => {
                const { data: subareas, error: subareasError } = await supabase
                    .from('rrhh_subareas')
                    .select('*')
                    .eq('area_id', area.id)
                    .order('order_index');

                if (subareasError) throw subareasError;

                const subareasWithItems: SubareaWithStructure[] = await Promise.all(
                    (subareas || []).map(async (subarea) => {
                        const { data: items, error: itemsError } = await supabase
                            .from('rrhh_items')
                            .select('*')
                            .eq('subarea_id', subarea.id)
                            .order('order_index');

                        if (itemsError) throw itemsError;

                        return {
                            ...subarea,
                            items: items || []
                        };
                    })
                );

                return {
                    ...area,
                    subareas: subareasWithItems
                };
            })
        );

        return {
            ...template,
            areas: areasWithStructure
        };
    },

    /**
     * Crear una nueva plantilla
     */
    async create(template: Omit<RRHHTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<RRHHTemplate> {
        // Omitir created_by para evitar problemas de FK
        const { created_by, ...templateData } = template as any;

        const { data, error } = await supabase
            .from('rrhh_templates')
            .insert(templateData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Actualizar una plantilla
     */
    async update(id: string, updates: Partial<RRHHTemplate>): Promise<RRHHTemplate> {
        const { data, error } = await supabase
            .from('rrhh_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Desactivar una plantilla (soft delete)
     */
    async deactivate(id: string): Promise<void> {
        const { error } = await supabase
            .from('rrhh_templates')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Eliminar una plantilla permanentemente
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('rrhh_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// =====================================================
// SERVICIO: AREAS
// =====================================================

export const rrhhAreasService = {
    async create(area: Omit<RRHHArea, 'id' | 'created_at' | 'updated_at'>): Promise<RRHHArea> {
        const { data, error } = await supabase
            .from('rrhh_areas')
            .insert(area)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<RRHHArea>): Promise<RRHHArea> {
        const { data, error } = await supabase
            .from('rrhh_areas')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('rrhh_areas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getByTemplateId(templateId: string): Promise<RRHHArea[]> {
        const { data, error } = await supabase
            .from('rrhh_areas')
            .select('*')
            .eq('template_id', templateId)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }
};

// =====================================================
// SERVICIO: SUBAREAS
// =====================================================

export const rrhhSubareasService = {
    async create(subarea: Omit<RRHHSubarea, 'id' | 'created_at' | 'updated_at'>): Promise<RRHHSubarea> {
        const { data, error } = await supabase
            .from('rrhh_subareas')
            .insert(subarea)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<RRHHSubarea>): Promise<RRHHSubarea> {
        const { data, error } = await supabase
            .from('rrhh_subareas')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('rrhh_subareas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getByAreaId(areaId: string): Promise<RRHHSubarea[]> {
        const { data, error } = await supabase
            .from('rrhh_subareas')
            .select('*')
            .eq('area_id', areaId)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }
};

// =====================================================
// SERVICIO: ITEMS
// =====================================================

export const rrhhItemsService = {
    async create(item: Omit<RRHHItem, 'id' | 'created_at' | 'updated_at'>): Promise<RRHHItem> {
        const { data, error } = await supabase
            .from('rrhh_items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<RRHHItem>): Promise<RRHHItem> {
        const { data, error } = await supabase
            .from('rrhh_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('rrhh_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getBySubareaId(subareaId: string): Promise<RRHHItem[]> {
        const { data, error } = await supabase
            .from('rrhh_items')
            .select('*')
            .eq('subarea_id', subareaId)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }
};

// =====================================================
// SERVICIO: ASSIGNMENTS
// =====================================================

export const rrhhAssignmentsService = {
    async create(assignment: Omit<RRHHAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<RRHHAssignment> {
        const { data, error } = await supabase
            .from('rrhh_assignments')
            .insert(assignment)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createBulk(assignments: Omit<RRHHAssignment, 'id' | 'created_at' | 'updated_at'>[]): Promise<RRHHAssignment[]> {
        const { data, error } = await supabase
            .from('rrhh_assignments')
            .insert(assignments)
            .select();

        if (error) throw error;
        return data || [];
    },

    async update(id: string, updates: Partial<RRHHAssignment>): Promise<RRHHAssignment> {
        const { data, error } = await supabase
            .from('rrhh_assignments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getMyAssignments(userId: string): Promise<RRHHAssignment[]> {
        const { data, error } = await supabase
            .from('rrhh_assignments')
            .select('*')
            .eq('evaluatee_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getAssignmentsToEvaluate(userId: string): Promise<RRHHAssignment[]> {
        const { data, error } = await supabase
            .from('rrhh_assignments')
            .select('*')
            .eq('evaluator_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};

// =====================================================
// SERVICIO: RESPONSES
// =====================================================

export const rrhhResponsesService = {
    async upsert(response: Omit<RRHHResponse, 'id' | 'created_at' | 'updated_at'>): Promise<RRHHResponse> {
        const { data, error } = await supabase
            .from('rrhh_responses')
            .upsert(response, { onConflict: 'assignment_id,item_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getByAssignmentId(assignmentId: string): Promise<RRHHResponse[]> {
        const { data, error } = await supabase
            .from('rrhh_responses')
            .select('*')
            .eq('assignment_id', assignmentId);

        if (error) throw error;
        return data || [];
    },

    async calculateFinalScore(assignmentId: string): Promise<number> {
        // Obtener la plantilla y estructura
        const { data: assignment } = await supabase
            .from('rrhh_assignments')
            .select('template_id')
            .eq('id', assignmentId)
            .single();

        if (!assignment) throw new Error('Assignment not found');

        const template = await rrhhTemplatesService.getById(assignment.template_id);
        if (!template) throw new Error('Template not found');

        const responses = await this.getByAssignmentId(assignmentId);

        let totalPercentage = 0; // Suma de porcentajes de todas las áreas

        // Calcular score por área
        for (const area of template.areas || []) {
            let areaScoreSum = 0;
            let itemsWithScore = 0;

            // Sumar todos los scores de supervisor en el área
            for (const subarea of area.subareas || []) {
                for (const item of subarea.items || []) {
                    const response = responses.find(r => r.item_id === item.id);
                    if (response && response.supervisor_score !== undefined) {
                        areaScoreSum += response.supervisor_score;
                        itemsWithScore++;
                    }
                }
            }

            // Calcular porcentaje del área obtenido
            if (itemsWithScore > 0) {
                const areaAverage = areaScoreSum / itemsWithScore; // Promedio de 0-2
                const areaPercentage = (areaAverage / 2) * area.weight_percentage; // Porcentaje obtenido del área
                totalPercentage += areaPercentage;
            }
        }

        // Fórmula: (suma de porcentajes) * 20 / 100
        const finalScore = (totalPercentage * 20) / 100;
        return Math.round(finalScore * 100) / 100; // Redondear a 2 decimales
    }
};
