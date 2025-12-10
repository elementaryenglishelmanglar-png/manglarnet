/**
 * RRHH Edit Evaluation Form
 * Permite editar una evaluación existente
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../ui/toast';
import { rrhhTemplatesService, rrhhResponsesService, rrhhAssignmentsService } from '../../services/rrhhEvaluationService';
import type { RRHHAssignment, TemplateWithStructure, RRHHResponse } from '../../services/rrhhEvaluationService';

interface EditEvaluationFormProps {
    assignment: RRHHAssignment;
    onClose: () => void;
    onSaved: () => void;
}

interface EvaluationData {
    [itemId: string]: {
        self_score?: number;
        supervisor_score?: number;
        goals?: string;
        observations?: string;
    };
}

export const EditEvaluationForm: React.FC<EditEvaluationFormProps> = ({ assignment, onClose, onSaved }) => {
    const [template, setTemplate] = useState<TemplateWithStructure | null>(null);
    const [evaluationData, setEvaluationData] = useState<EvaluationData>({});
    const [finalObservations, setFinalObservations] = useState<string>(assignment.final_observations || '');
    const [agreements, setAgreements] = useState<string>(assignment.agreements || '');
    const [activeTab, setActiveTab] = useState<'self' | 'supervisor'>('self');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    // Helper para obtener colores según el puntaje
    const getScoreColorClass = (score: number, isSelected: boolean) => {
        if (!isSelected) {
            return 'bg-white border';
        }

        const colors = {
            0.5: 'bg-red-500 text-white',      // Rojo
            1.0: 'bg-orange-500 text-white',   // Naranja
            1.5: 'bg-cyan-400 text-white',     // Azul claro
            2.0: 'bg-green-400 text-white'     // Verde neón
        };

        return colors[score as keyof typeof colors] || 'bg-gray-500 text-white';
    };

    useEffect(() => {
        loadData();
    }, [assignment.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar plantilla
            const templateData = await rrhhTemplatesService.getById(assignment.template_id);
            setTemplate(templateData);

            // Cargar respuestas existentes
            const { data: responsesData, error } = await supabase
                .from('rrhh_responses')
                .select('*')
                .eq('assignment_id', assignment.id);

            if (error) throw error;

            // Mapear respuestas a evaluationData
            const dataMap: EvaluationData = {};
            (responsesData || []).forEach(response => {
                const comments = response.comment?.split(' | ') || [];
                dataMap[response.item_id] = {
                    self_score: response.self_score,
                    supervisor_score: response.supervisor_score,
                    goals: comments[0] || '',
                    observations: comments[1] || ''
                };
            });

            setEvaluationData(dataMap);
        } catch (error) {
            console.error('Error loading evaluation data:', error);
            showToast({ type: 'error', title: 'Error al cargar datos' });
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (itemId: string, scoreType: 'self' | 'supervisor', value: number) => {
        setEvaluationData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [`${scoreType}_score`]: value
            }
        }));
    };

    const handleCommentChange = (itemId: string, field: 'goals' | 'observations', value: string) => {
        setEvaluationData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    const calculateScore = (scoreType: 'self' | 'supervisor'): number => {
        if (!template) return 0;

        let totalPercentage = 0;

        template.areas?.forEach(area => {
            let areaTotal = 0;
            let itemCount = 0;

            area.subareas?.forEach(subarea => {
                subarea.items?.forEach(item => {
                    const data = evaluationData[item.id];
                    const score = scoreType === 'self' ? data?.self_score : data?.supervisor_score;
                    if (score !== undefined) {
                        areaTotal += score;
                        itemCount++;
                    }
                });
            });

            if (itemCount > 0) {
                const average = areaTotal / itemCount;
                const percentage = (average / 2) * area.weight_percentage;
                totalPercentage += percentage;
            }
        });

        return (totalPercentage * 20) / 100;
    };

    const calculateProgress = (scoreType: 'self' | 'supervisor'): number => {
        if (!template) return 0;

        let totalItems = 0;
        let completedItems = 0;

        template.areas?.forEach(area => {
            area.subareas?.forEach(subarea => {
                subarea.items?.forEach(item => {
                    totalItems++;
                    const data = evaluationData[item.id];
                    const score = scoreType === 'self' ? data?.self_score : data?.supervisor_score;
                    if (score !== undefined) {
                        completedItems++;
                    }
                });
            });
        });

        return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            console.log('Updating evaluation:', assignment.id);

            // Actualizar assignment
            await rrhhAssignmentsService.update(assignment.id, {
                final_score: calculateScore('supervisor'),
                final_observations: finalObservations,
                agreements: agreements,
                updated_at: new Date().toISOString()
            });

            // Actualizar respuestas
            let updatedResponses = 0;
            for (const [itemId, data] of Object.entries(evaluationData)) {
                if (data.self_score !== undefined || data.supervisor_score !== undefined) {
                    const comment = [data.goals, data.observations].filter(Boolean).join(' | ');
                    await rrhhResponsesService.upsert({
                        assignment_id: assignment.id,
                        item_id: itemId,
                        self_score: data.self_score,
                        supervisor_score: data.supervisor_score,
                        comment: comment || undefined
                    });
                    updatedResponses++;
                }
            }

            console.log(`Updated ${updatedResponses} responses`);
            showToast({ type: 'success', title: `Evaluación actualizada (${updatedResponses} respuestas)` });
            onSaved();
            onClose();
        } catch (error: any) {
            console.error('Error updating evaluation:', error);
            showToast({ type: 'error', title: `Error: ${error.message || 'Error desconocido'}` });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">✏️ Editar Evaluación</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Plantilla</span>
                                    <p className="font-semibold">{template?.name}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Período</span>
                                    <p className="font-semibold">{assignment.evaluation_period}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Nota Actual</span>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {calculateScore('supervisor').toFixed(2)} / 20
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'self' | 'supervisor')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="self" className="flex items-center gap-2">
                                📝 Autoevaluación
                                <Badge variant="outline">{calculateProgress('self')}%</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="supervisor" className="flex items-center gap-2">
                                👤 Eval. Supervisor
                                <Badge variant="outline">{calculateProgress('supervisor')}%</Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* Autoevaluación */}
                        <TabsContent value="self" className="space-y-4">
                            {template?.areas?.map(area => (
                                <Card key={area.id} className="border-l-4 border-l-green-500">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{area.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {area.subareas?.map(subarea => (
                                            <div key={subarea.id}>
                                                <h4 className="font-semibold text-sm mb-2">{subarea.name}</h4>
                                                {subarea.items?.map(item => (
                                                    <div key={item.id} className="mb-4 p-3 bg-green-50 rounded">
                                                        <p className="text-sm mb-2">{item.text}</p>
                                                        <div className="flex gap-2">
                                                            {[0.5, 1, 1.5, 2].map(score => (
                                                                <button
                                                                    key={score}
                                                                    onClick={() => handleScoreChange(item.id, 'self', score)}
                                                                    className={`px-3 py-1 rounded text-sm font-semibold ${getScoreColorClass(score, evaluationData[item.id]?.self_score === score)
                                                                        }`}
                                                                >
                                                                    {score === 0.5 && 'Un poco'}
                                                                    {score === 1 && 'A veces'}
                                                                    {score === 1.5 && 'Frecuente'}
                                                                    {score === 2 && 'Siempre'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Evaluación Supervisor */}
                        <TabsContent value="supervisor" className="space-y-4">
                            {template?.areas?.map(area => (
                                <Card key={area.id} className="border-l-4 border-l-blue-500">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{area.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {area.subareas?.map(subarea => (
                                            <div key={subarea.id}>
                                                <h4 className="font-semibold text-sm mb-2">{subarea.name}</h4>
                                                {subarea.items?.map(item => (
                                                    <div key={item.id} className="mb-4 p-3 bg-blue-50 rounded">
                                                        <p className="text-sm mb-2">{item.text}</p>
                                                        <div className="flex gap-2">
                                                            {[0.5, 1, 1.5, 2].map(score => (
                                                                <button
                                                                    key={score}
                                                                    onClick={() => handleScoreChange(item.id, 'supervisor', score)}
                                                                    className={`px-3 py-1 rounded text-sm font-semibold ${getScoreColorClass(score, evaluationData[item.id]?.supervisor_score === score)
                                                                        }`}
                                                                >
                                                                    {score === 0.5 && 'Un poco'}
                                                                    {score === 1 && 'A veces'}
                                                                    {score === 1.5 && 'Frecuente'}
                                                                    {score === 2 && 'Siempre'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>
                    </Tabs>

                    {/* Observaciones Finales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Observaciones Finales y Acuerdos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Observaciones Finales</Label>
                                <Textarea
                                    value={finalObservations}
                                    onChange={(e) => setFinalObservations(e.target.value)}
                                    placeholder="Observaciones generales de la evaluación..."
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label>Acuerdos y Compromisos</Label>
                                <Textarea
                                    value={agreements}
                                    onChange={(e) => setAgreements(e.target.value)}
                                    placeholder="Acuerdos alcanzados y compromisos..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
