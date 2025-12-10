/**
 * RRHH Evaluation Template Builder
 * Constructor visual de plantillas de evaluación con estructura jerárquica
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Slider } from '../ui/slider';
import {
    PlusIcon,
    DeleteIcon,
    EditIcon,
    SaveIcon,
    ChevronDownIcon
} from '../Icons';
import { AlertTriangle } from 'lucide-react';
import {
    rrhhTemplatesService,
    rrhhAreasService,
    rrhhSubareasService,
    rrhhItemsService,
    type TemplateWithStructure,
    type AreaWithStructure,
    type SubareaWithStructure,
    type RRHHItem
} from '../../services/rrhhEvaluationService';
import { useToast } from '../ui/toast';

interface TemplateBuilderProps {
    templateId?: string;
    onSave?: (template: TemplateWithStructure) => void;
    onCancel?: () => void;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
    templateId,
    onSave,
    onCancel
}) => {
    const [template, setTemplate] = useState<TemplateWithStructure | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const { showToast } = useToast();

    // Cargar plantilla si existe
    useEffect(() => {
        if (templateId) {
            loadTemplate();
        } else {
            // Nueva plantilla - crear automáticamente
            createNewTemplate();
        }
    }, [templateId]);

    const createNewTemplate = async () => {
        setLoading(true);
        try {
            const newTemplate = await rrhhTemplatesService.create({
                name: 'Nueva Plantilla',
                description: '',
                total_weight_check: 0,
                active: true
            });
            setTemplate({ ...newTemplate, areas: [] });
        } catch (error) {
            console.error('Error creating template:', error);
            showToast({ type: 'error', title: 'Error al crear la plantilla' });
        } finally {
            setLoading(false);
        }
    };

    const loadTemplate = async () => {
        setLoading(true);
        try {
            const data = await rrhhTemplatesService.getById(templateId!);
            setTemplate(data);
        } catch (error) {
            console.error('Error loading template:', error);
            showToast({ type: 'error', title: 'Error al cargar la plantilla' });
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // HANDLERS: TEMPLATE
    // =====================================================

    const handleSaveTemplate = async () => {
        if (!template) return;

        setSaving(true);
        try {
            let savedTemplate: TemplateWithStructure;

            if (template.id) {
                // Actualizar existente
                await rrhhTemplatesService.update(template.id, {
                    name: template.name,
                    description: template.description
                });
                savedTemplate = await rrhhTemplatesService.getById(template.id);
            } else {
                // Crear nueva
                const newTemplate = await rrhhTemplatesService.create({
                    name: template.name,
                    description: template.description,
                    total_weight_check: 0,
                    active: true
                });
                savedTemplate = { ...newTemplate, areas: [] };
                setTemplate(savedTemplate);
            }

            showToast({ type: 'success', title: 'Plantilla guardada exitosamente' });
            onSave?.(savedTemplate);
        } catch (error) {
            console.error('Error saving template:', error);
            showToast({ type: 'error', title: 'Error al guardar la plantilla' });
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // HANDLERS: AREAS
    // =====================================================

    const handleAddArea = async () => {
        if (!template?.id) {
            showToast({ type: 'error', title: 'Error: plantilla no inicializada' });
            return;
        }

        try {
            const newArea = await rrhhAreasService.create({
                template_id: template.id,
                name: 'Nueva Área',
                weight_percentage: 0,
                order_index: (template.areas?.length || 0)
            });

            setTemplate({
                ...template,
                areas: [...(template.areas || []), { ...newArea, subareas: [] }]
            });

            showToast({ type: 'success', title: 'Área agregada' });
        } catch (error) {
            console.error('Error adding area:', error);
            showToast({ type: 'error', title: 'Error al agregar área' });
        }
    };

    const handleUpdateArea = async (areaId: string, updates: Partial<AreaWithStructure>) => {
        try {
            await rrhhAreasService.update(areaId, updates);

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.map(area =>
                        area.id === areaId ? { ...area, ...updates } : area
                    )
                };
            });

            // Recargar para actualizar total_weight_check
            if (updates.weight_percentage !== undefined) {
                const updated = await rrhhTemplatesService.getById(template!.id);
                setTemplate(updated);
            }
        } catch (error) {
            console.error('Error updating area:', error);
            showToast({ type: 'error', title: 'Error al actualizar área' });
        }
    };

    const handleDeleteArea = async (areaId: string) => {
        if (!confirm('¿Eliminar esta área y todo su contenido?')) return;

        try {
            await rrhhAreasService.delete(areaId);

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.filter(area => area.id !== areaId)
                };
            });

            showToast({ type: 'success', title: 'Área eliminada' });
        } catch (error) {
            console.error('Error deleting area:', error);
            showToast({ type: 'error', title: 'Error al eliminar área' });
        }
    };

    // =====================================================
    // HANDLERS: SUBAREAS
    // =====================================================

    const handleAddSubarea = async (areaId: string) => {
        try {
            const area = template?.areas?.find(a => a.id === areaId);
            const newSubarea = await rrhhSubareasService.create({
                area_id: areaId,
                name: 'Nueva Subárea',
                relative_weight: 0,
                order_index: (area?.subareas?.length || 0)
            });

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.map(area =>
                        area.id === areaId
                            ? {
                                ...area,
                                subareas: [...(area.subareas || []), { ...newSubarea, items: [] }]
                            }
                            : area
                    )
                };
            });

            showToast({ type: 'success', title: 'Subárea agregada' });
        } catch (error) {
            console.error('Error adding subarea:', error);
            showToast({ type: 'error', title: 'Error al agregar subárea' });
        }
    };

    const handleUpdateSubarea = async (subareaId: string, updates: Partial<SubareaWithStructure>) => {
        try {
            await rrhhSubareasService.update(subareaId, updates);

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.map(area => ({
                        ...area,
                        subareas: area.subareas?.map(subarea =>
                            subarea.id === subareaId ? { ...subarea, ...updates } : subarea
                        )
                    }))
                };
            });
        } catch (error) {
            console.error('Error updating subarea:', error);
            showToast({ type: 'error', title: 'Error al actualizar subárea' });
        }
    };

    const handleDeleteSubarea = async (subareaId: string) => {
        if (!confirm('¿Eliminar esta subárea y todos sus ítems?')) return;

        try {
            await rrhhSubareasService.delete(subareaId);

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.map(area => ({
                        ...area,
                        subareas: area.subareas?.filter(subarea => subarea.id !== subareaId)
                    }))
                };
            });

            showToast({ type: 'success', title: 'Subárea eliminada' });
        } catch (error) {
            console.error('Error deleting subarea:', error);
            showToast({ type: 'error', title: 'Error al eliminar subárea' });
        }
    };

    // =====================================================
    // HANDLERS: ITEMS
    // =====================================================

    const handleAddItem = async (subareaId: string) => {
        try {
            const subarea = template?.areas
                ?.flatMap(a => a.subareas || [])
                .find(s => s.id === subareaId);

            const newItem = await rrhhItemsService.create({
                subarea_id: subareaId,
                text: 'Nueva pregunta',
                order_index: (subarea?.items?.length || 0)
            });

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.map(area => ({
                        ...area,
                        subareas: area.subareas?.map(subarea =>
                            subarea.id === subareaId
                                ? { ...subarea, items: [...(subarea.items || []), newItem] }
                                : subarea
                        )
                    }))
                };
            });

            showToast({ type: 'success', title: 'Ítem agregado' });
        } catch (error) {
            console.error('Error adding item:', error);
            showToast({ type: 'error', title: 'Error al agregar ítem' });
        }
    };

    const handleUpdateItem = async (itemId: string, updates: Partial<RRHHItem>) => {
        try {
            await rrhhItemsService.update(itemId, updates);

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.map(area => ({
                        ...area,
                        subareas: area.subareas?.map(subarea => ({
                            ...subarea,
                            items: subarea.items?.map(item =>
                                item.id === itemId ? { ...item, ...updates } : item
                            )
                        }))
                    }))
                };
            });
        } catch (error) {
            console.error('Error updating item:', error);
            showToast({ type: 'error', title: 'Error al actualizar ítem' });
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('¿Eliminar este ítem?')) return;

        try {
            await rrhhItemsService.delete(itemId);

            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    areas: prev.areas?.map(area => ({
                        ...area,
                        subareas: area.subareas?.map(subarea => ({
                            ...subarea,
                            items: subarea.items?.filter(item => item.id !== itemId)
                        }))
                    }))
                };
            });

            showToast({ type: 'success', title: 'Ítem eliminado' });
        } catch (error) {
            console.error('Error deleting item:', error);
            showToast({ type: 'error', title: 'Error al eliminar ítem' });
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!template) return null;

    // Calcular peso total dinámicamente sumando los pesos de las áreas
    const totalWeight = template.areas?.reduce((sum, area) => sum + (area.weight_percentage || 0), 0) || 0;
    const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {editingName ? (
                                <Input
                                    value={template.name}
                                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                                    onBlur={() => setEditingName(false)}
                                    autoFocus
                                    className="text-2xl font-bold"
                                />
                            ) : (
                                <h2
                                    className="text-2xl font-bold cursor-pointer hover:text-blue-600"
                                    onClick={() => setEditingName(true)}
                                >
                                    {template.name}
                                </h2>
                            )}
                            <Textarea
                                value={template.description || ''}
                                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                                placeholder="Descripción de la plantilla..."
                                className="mt-2"
                                rows={2}
                            />
                        </div>
                        <div className="flex gap-2">
                            {onCancel && (
                                <Button variant="outline" onClick={onCancel}>
                                    Cancelar
                                </Button>
                            )}
                            <Button onClick={handleSaveTemplate} disabled={saving}>
                                <SaveIcon className="mr-2" />
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Weight Validation Alert */}
            {!isWeightValid && (
                <Alert variant={totalWeight > 100 ? 'destructive' : 'warning'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Total actual: <strong>{totalWeight.toFixed(2)}%</strong>
                        {totalWeight < 100 && ` (Falta ${(100 - totalWeight).toFixed(2)}%)`}
                        {totalWeight > 100 && ` (Excede por ${(totalWeight - 100).toFixed(2)}%)`}
                    </AlertDescription>
                </Alert>
            )}

            {/* Areas */}
            <div className="space-y-4">
                {template.areas?.map((area, areaIndex) => (
                    <AreaCard
                        key={area.id}
                        area={area}
                        areaIndex={areaIndex}
                        onUpdateArea={handleUpdateArea}
                        onDeleteArea={handleDeleteArea}
                        onAddSubarea={handleAddSubarea}
                        onUpdateSubarea={handleUpdateSubarea}
                        onDeleteSubarea={handleDeleteSubarea}
                        onAddItem={handleAddItem}
                        onUpdateItem={handleUpdateItem}
                        onDeleteItem={handleDeleteItem}
                    />
                ))}

                <Button
                    onClick={handleAddArea}
                    variant="outline"
                    className="w-full border-dashed border-2"
                >
                    <PlusIcon className="mr-2" />
                    Agregar Área
                </Button>
            </div>
        </div>
    );
};

// =====================================================
// AREA CARD COMPONENT
// =====================================================

interface AreaCardProps {
    area: AreaWithStructure;
    areaIndex: number;
    onUpdateArea: (id: string, updates: Partial<AreaWithStructure>) => void;
    onDeleteArea: (id: string) => void;
    onAddSubarea: (areaId: string) => void;
    onUpdateSubarea: (id: string, updates: Partial<SubareaWithStructure>) => void;
    onDeleteSubarea: (id: string) => void;
    onAddItem: (subareaId: string) => void;
    onUpdateItem: (id: string, updates: Partial<RRHHItem>) => void;
    onDeleteItem: (id: string) => void;
}

const AreaCard: React.FC<AreaCardProps> = ({
    area,
    areaIndex,
    onUpdateArea,
    onDeleteArea,
    onAddSubarea,
    onUpdateSubarea,
    onDeleteSubarea,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <ChevronDownIcon
                            className={`transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
                        />
                    </Button>

                    <div className="flex-1">
                        <Input
                            value={area.name}
                            onChange={(e) => onUpdateArea(area.id, { name: e.target.value })}
                            className="font-semibold text-lg"
                            placeholder="Nombre del área"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Label className="text-sm text-gray-600">Peso:</Label>
                        <Input
                            type="number"
                            value={area.weight_percentage}
                            onChange={(e) => onUpdateArea(area.id, { weight_percentage: parseFloat(e.target.value) || 0 })}
                            className="w-20 text-center"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                        <span className="text-sm font-medium">%</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteArea(area.id)}
                        className="text-red-600 hover:text-red-700"
                    >
                        <DeleteIcon />
                    </Button>
                </div>

                {/* Weight Slider */}
                <div className="mt-3">
                    <Slider
                        value={[area.weight_percentage]}
                        onValueChange={([value]) => onUpdateArea(area.id, { weight_percentage: value })}
                        max={100}
                        step={0.1}
                        className="w-full"
                    />
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-3">
                    {/* Subareas */}
                    {area.subareas?.map((subarea, subareaIndex) => (
                        <SubareaCard
                            key={subarea.id}
                            subarea={subarea}
                            subareaIndex={subareaIndex}
                            onUpdateSubarea={onUpdateSubarea}
                            onDeleteSubarea={onDeleteSubarea}
                            onAddItem={onAddItem}
                            onUpdateItem={onUpdateItem}
                            onDeleteItem={onDeleteItem}
                        />
                    ))}

                    <Button
                        onClick={() => onAddSubarea(area.id)}
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                    >
                        <PlusIcon className="mr-2" />
                        Agregar Subárea
                    </Button>
                </CardContent>
            )}
        </Card>
    );
};

// =====================================================
// SUBAREA CARD COMPONENT
// =====================================================

interface SubareaCardProps {
    subarea: SubareaWithStructure;
    subareaIndex: number;
    onUpdateSubarea: (id: string, updates: Partial<SubareaWithStructure>) => void;
    onDeleteSubarea: (id: string) => void;
    onAddItem: (subareaId: string) => void;
    onUpdateItem: (id: string, updates: Partial<RRHHItem>) => void;
    onDeleteItem: (id: string) => void;
}

const SubareaCard: React.FC<SubareaCardProps> = ({
    subarea,
    onUpdateSubarea,
    onDeleteSubarea,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <Card className="ml-8 border-l-4 border-l-green-500 bg-gray-50">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <ChevronDownIcon
                            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
                        />
                    </Button>

                    <div className="flex-1">
                        <Input
                            value={subarea.name}
                            onChange={(e) => onUpdateSubarea(subarea.id, { name: e.target.value })}
                            className="font-medium"
                            placeholder="Nombre de la subárea"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={subarea.relative_weight}
                            onChange={(e) => onUpdateSubarea(subarea.id, { relative_weight: parseFloat(e.target.value) || 0 })}
                            className="w-16 text-center text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                        <span className="text-xs">%</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteSubarea(subarea.id)}
                        className="text-red-600"
                    >
                        <DeleteIcon className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-2">
                    {/* Items */}
                    {subarea.items?.map((item, itemIndex) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                            <span className="text-xs text-gray-500 w-6">{itemIndex + 1}.</span>
                            <Input
                                value={item.text}
                                onChange={(e) => onUpdateItem(item.id, { text: e.target.value })}
                                className="flex-1 text-sm"
                                placeholder="Texto de la pregunta"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteItem(item.id)}
                                className="text-red-600"
                            >
                                <DeleteIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}

                    <Button
                        onClick={() => onAddItem(subarea.id)}
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed text-xs"
                    >
                        <PlusIcon className="mr-1 h-3 w-3" />
                        Agregar Ítem
                    </Button>
                </CardContent>
            )}
        </Card>
    );
};
