/**
 * RRHH Evaluation Form
 * Formulario de evaluación renderizado dinámicamente desde la plantilla
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { SaveIcon, ArrowLeftIcon } from '../Icons';
import { Check, Clock } from 'lucide-react';
import {
    rrhhTemplatesService,
    rrhhAssignmentsService,
    rrhhResponsesService,
    type TemplateWithStructure,
    type RRHHAssignment,
    type RRHHResponse
} from '../../services/rrhhEvaluationService';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../ui/toast';

interface EvaluationFormProps {
    assignmentId: string;
    mode: 'self' | 'supervisor'; // Autoevaluación o evaluación por supervisor
    onComplete?: () => void;
    onCancel?: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
    assignmentId,
    mode,
    onComplete,
    onCancel
}) => {
    const [assignment, setAssignment] = useState<RRHHAssignment | null>(null);
    const [template, setTemplate] = useState<TemplateWithStructure | null>(null);
    const [responses, setResponses] = useState<Map<string, RRHHResponse>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    // Helper para obtener colores según el puntaje
    const getScoreColorClass = (score: number, isSelected: boolean, isDisabled: boolean) => {
        if (isDisabled) {
            const colors = {
                0.5: 'bg-red-300',
                1.0: 'bg-orange-300',
                1.5: 'bg-cyan-300',
                2.0: 'bg-green-300'
            };
            const baseColor = colors[score as keyof typeof colors] || 'bg-gray-300';
            return `${baseColor} text-white opacity-60 cursor-not-allowed`;
        }

        if (!isSelected) {
            return 'bg-white border-2 border-gray-200 hover:border-gray-400 cursor-pointer';
        }

        const colors = {
            0.5: 'bg-red-500',      // Rojo
            1.0: 'bg-orange-500',   // Naranja
            1.5: 'bg-cyan-400',     // Azul claro
            2.0: 'bg-green-400'     // Verde neón
        };

        const baseColor = colors[score as keyof typeof colors] || 'bg-gray-500';
        return `${baseColor} text-white shadow-lg scale-105`;
    };

    useEffect(() => {
        loadData();
    }, [assignmentId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar asignación
            const { data: assignmentData, error: assignmentError } = await supabase
                .from('rrhh_assignments')
                .select('*')
                .eq('id', assignmentId)
                .single();

            if (assignmentError) throw assignmentError;
            setAssignment(assignmentData);

            // Cargar plantilla con estructura
            const templateData = await rrhhTemplatesService.getById(assignmentData.template_id);
            setTemplate(templateData);

            // Cargar respuestas existentes
            const responsesData = await rrhhResponsesService.getByAssignmentId(assignmentId);
            const responsesMap = new Map(responsesData.map(r => [r.item_id, r]));
            setResponses(responsesMap);
        } catch (error) {
            console.error('Error loading evaluation:', error);
            showToast({ type: 'error', title: 'Error al cargar evaluación' });
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = async (itemId: string, score: number, comment?: string) => {
        try {
            const existingResponse = responses.get(itemId);

            const responseData = {
                assignment_id: assignmentId,
                item_id: itemId,
                self_score: mode === 'self' ? score : existingResponse?.self_score,
                supervisor_score: mode === 'supervisor' ? score : existingResponse?.supervisor_score,
                comment: comment !== undefined ? comment : existingResponse?.comment
            };

            const savedResponse = await rrhhResponsesService.upsert(responseData);

            setResponses(prev => new Map(prev).set(itemId, savedResponse));
        } catch (error) {
            console.error('Error saving response:', error);
            showToast({ type: 'error', title: 'Error al guardar respuesta' });
        }
    };

    const handleComplete = async () => {
        if (!confirm('¿Finalizar evaluación? No podrás modificarla después.')) return;

        setSaving(true);
        try {
            // Calcular score final
            const finalScore = await rrhhResponsesService.calculateFinalScore(assignmentId);

            // Actualizar asignación
            await rrhhAssignmentsService.update(assignmentId, {
                status: 'completed',
                final_score: finalScore,
                completed_at: new Date().toISOString()
            });

            showToast({ type: 'success', title: 'Evaluación completada exitosamente' });
            onComplete?.();
        } catch (error) {
            console.error('Error completing evaluation:', error);
            showToast({ type: 'error', title: 'Error al completar evaluación' });
        } finally {
            setSaving(false);
        }
    };

    const calculateProgress = (): number => {
        if (!template) return 0;

        const totalItems = template.areas?.reduce(
            (sum, area) =>
                sum +
                (area.subareas?.reduce(
                    (subSum, subarea) => subSum + (subarea.items?.length || 0),
                    0
                ) || 0),
            0
        ) || 0;

        if (totalItems === 0) return 0;

        const answeredItems = Array.from(responses.values()).filter(r =>
            mode === 'self' ? r.self_score !== undefined : r.supervisor_score !== undefined
        ).length;

        return Math.round((answeredItems / totalItems) * 100);
    };

    const calculateLiveScore = (): number => {
        if (!template) return 0;

        let totalPercentage = 0; // Suma de porcentajes de todas las áreas

        for (const area of template.areas || []) {
            let areaScoreSum = 0;
            let itemsWithScore = 0;

            // Sumar todos los scores en el área
            for (const subarea of area.subareas || []) {
                for (const item of subarea.items || []) {
                    const response = responses.get(item.id);
                    const score = mode === 'self' ? response?.self_score : response?.supervisor_score;

                    if (score !== undefined) {
                        areaScoreSum += score;
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
        return Math.round(finalScore * 100) / 100;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!template || !assignment) {
        return (
            <Alert variant="destructive">
                <AlertDescription>No se pudo cargar la evaluación</AlertDescription>
            </Alert>
        );
    }

    const progress = calculateProgress();
    const liveScore = calculateLiveScore();
    const isComplete = assignment.status === 'completed';

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                {onCancel && (
                                    <Button variant="ghost" size="sm" onClick={onCancel}>
                                        <ArrowLeftIcon />
                                    </Button>
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold">{template.name}</h1>
                                    <p className="text-gray-600">
                                        {mode === 'self' ? 'Autoevaluación' : 'Evaluación de Desempeño'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">
                                {liveScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">Score Actual</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Progreso</span>
                            <span className="text-sm font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {isComplete && (
                        <Alert className="mt-4">
                            <Check className="h-4 w-4" />
                            <AlertDescription>
                                Evaluación completada el{' '}
                                {new Date(assignment.completed_at!).toLocaleDateString()}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardHeader>
            </Card>

            {/* Evaluation Areas */}
            <div className="space-y-6">
                {template.areas?.map((area, areaIndex) => (
                    <Card key={area.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">{area.name}</CardTitle>
                                <Badge variant="secondary">
                                    Peso: {area.weight_percentage}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {area.subareas?.map((subarea, subareaIndex) => (
                                <div key={subarea.id} className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <h3 className="font-semibold text-lg flex-1">
                                            {subarea.name}
                                        </h3>
                                        <Badge variant="outline" size="sm">
                                            {subarea.relative_weight}%
                                        </Badge>
                                    </div>

                                    {subarea.items?.map((item, itemIndex) => {
                                        const response = responses.get(item.id);
                                        const currentScore =
                                            mode === 'self'
                                                ? response?.self_score
                                                : response?.supervisor_score;

                                        return (
                                            <div
                                                key={item.id}
                                                className="p-4 bg-gray-50 rounded-lg space-y-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-sm text-gray-500 font-medium mt-1">
                                                        {itemIndex + 1}.
                                                    </span>
                                                    <p className="flex-1 text-gray-800">
                                                        {item.text}
                                                    </p>
                                                </div>

                                                {/* Score Buttons */}
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { value: 0.5, label: 'Un poco' },
                                                        { value: 1, label: 'A veces' },
                                                        { value: 1.5, label: 'Frecuente' },
                                                        { value: 2, label: 'Siempre' }
                                                    ].map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() =>
                                                                !isComplete &&
                                                                handleScoreChange(item.id, option.value)
                                                            }
                                                            disabled={isComplete}
                                                            className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${getScoreColorClass(option.value, currentScore === option.value, isComplete)
                                                                }`}
                                                        >
                                                            <div className="text-lg">{option.value}</div>
                                                            <div className="text-xs opacity-75">{option.label}</div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Comment */}
                                                {mode === 'supervisor' && (
                                                    <Textarea
                                                        value={response?.comment || ''}
                                                        onChange={(e) =>
                                                            !isComplete &&
                                                            handleScoreChange(
                                                                item.id,
                                                                currentScore || 0,
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Comentarios (opcional)"
                                                        disabled={isComplete}
                                                        rows={2}
                                                        className="text-sm"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            {!isComplete && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Progreso: {progress}% completado
                                </p>
                                <p className="text-lg font-semibold">
                                    Score actual: {liveScore.toFixed(2)} / 5.00
                                </p>
                            </div>
                            <Button
                                onClick={handleComplete}
                                disabled={saving || progress < 100}
                                size="lg"
                            >
                                <Check className="mr-2" />
                                {saving ? 'Finalizando...' : 'Finalizar Evaluación'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
