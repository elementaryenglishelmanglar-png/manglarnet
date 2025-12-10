/**
 * RRHH Evaluation Detail View
 * Vista detallada de una evaluación con todos los puntajes y respuestas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { supabase } from '../../services/supabaseClient';
import { rrhhTemplatesService } from '../../services/rrhhEvaluationService';
import type { RRHHAssignment, RRHHResponse, TemplateWithStructure } from '../../services/rrhhEvaluationService';

interface EvaluationDetailProps {
    assignment: RRHHAssignment;
    onClose: () => void;
}

interface ResponseData {
    [itemId: string]: RRHHResponse;
}

export const EvaluationDetail: React.FC<EvaluationDetailProps> = ({ assignment, onClose }) => {
    const [template, setTemplate] = useState<TemplateWithStructure | null>(null);
    const [responses, setResponses] = useState<ResponseData>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [assignment.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar plantilla
            const templateData = await rrhhTemplatesService.getById(assignment.template_id);
            setTemplate(templateData);

            // Cargar respuestas
            const { data: responsesData, error } = await supabase
                .from('rrhh_responses')
                .select('*')
                .eq('assignment_id', assignment.id);

            if (error) throw error;

            // Mapear respuestas por item_id
            const responsesMap: ResponseData = {};
            (responsesData || []).forEach(response => {
                responsesMap[response.item_id] = response;
            });
            setResponses(responsesMap);
        } catch (error) {
            console.error('Error loading evaluation details:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAreaScore = (areaId: string, scoreType: 'self' | 'supervisor'): number => {
        if (!template) return 0;

        const area = template.areas?.find(a => a.id === areaId);
        if (!area) return 0;

        let totalScore = 0;
        let itemCount = 0;

        area.subareas?.forEach(subarea => {
            subarea.items?.forEach(item => {
                const response = responses[item.id];
                const score = scoreType === 'self' ? response?.self_score : response?.supervisor_score;
                if (score !== undefined) {
                    totalScore += score;
                    itemCount++;
                }
            });
        });

        if (itemCount === 0) return 0;
        const average = totalScore / itemCount;
        return (average / 2) * area.weight_percentage;
    };

    const getScoreLabel = (score: number): string => {
        if (score === 0.5) return 'Un poco';
        if (score === 1) return 'A veces';
        if (score === 1.5) return 'Frecuente';
        if (score === 2) return 'Siempre';
        return 'N/A';
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
                    <DialogTitle className="text-2xl">Detalles de Evaluación</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Plantilla</span>
                                    <p className="font-semibold">{template?.name}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Período</span>
                                    <p className="font-semibold">{assignment.evaluation_period}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Fecha</span>
                                    <p className="font-semibold">
                                        {assignment.completed_at
                                            ? new Date(assignment.completed_at).toLocaleDateString('es-VE')
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Nota Final</span>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {(assignment.final_score || 0).toFixed(2)} / 20
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs: Autoevaluación vs Evaluación Supervisor */}
                    <Tabs defaultValue="comparison" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="comparison">Comparación</TabsTrigger>
                            <TabsTrigger value="self">Autoevaluación</TabsTrigger>
                            <TabsTrigger value="supervisor">Eval. Supervisor</TabsTrigger>
                        </TabsList>

                        {/* Comparación */}
                        <TabsContent value="comparison" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comparación por Área</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {template?.areas?.map(area => {
                                        const selfScore = calculateAreaScore(area.id, 'self');
                                        const supervisorScore = calculateAreaScore(area.id, 'supervisor');

                                        return (
                                            <div key={area.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold">{area.name}</h4>
                                                    <Badge>Peso: {area.weight_percentage}%</Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="flex items-center justify-between text-sm mb-1">
                                                            <span className="text-green-600">Autoevaluación</span>
                                                            <span className="font-semibold">{selfScore.toFixed(2)}%</span>
                                                        </div>
                                                        <Progress
                                                            value={(selfScore / area.weight_percentage) * 100}
                                                            className="h-2 bg-green-100"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-sm mb-1">
                                                            <span className="text-blue-600">Supervisor</span>
                                                            <span className="font-semibold">{supervisorScore.toFixed(2)}%</span>
                                                        </div>
                                                        <Progress
                                                            value={(supervisorScore / area.weight_percentage) * 100}
                                                            className="h-2 bg-blue-100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Autoevaluación Detallada */}
                        <TabsContent value="self" className="space-y-4">
                            {template?.areas?.map(area => (
                                <Card key={area.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{area.name}</span>
                                            <Badge variant="outline">Peso: {area.weight_percentage}%</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {area.subareas?.map(subarea => (
                                            <div key={subarea.id} className="space-y-3">
                                                <h5 className="font-semibold text-sm text-muted-foreground">
                                                    {subarea.name}
                                                </h5>
                                                <div className="space-y-2">
                                                    {subarea.items?.map((item, idx) => {
                                                        const response = responses[item.id];
                                                        return (
                                                            <div key={item.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                                                                    {idx + 1}
                                                                </span>
                                                                <div className="flex-1">
                                                                    <p className="text-sm mb-2">{item.text}</p>
                                                                    <div className="flex items-center gap-4">
                                                                        <Badge className="bg-green-600">
                                                                            {getScoreLabel(response?.self_score || 0)}
                                                                        </Badge>
                                                                        {response?.comment && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Meta: {response.comment}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Evaluación Supervisor Detallada */}
                        <TabsContent value="supervisor" className="space-y-4">
                            {template?.areas?.map(area => (
                                <Card key={area.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{area.name}</span>
                                            <Badge variant="outline">Peso: {area.weight_percentage}%</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {area.subareas?.map(subarea => (
                                            <div key={subarea.id} className="space-y-3">
                                                <h5 className="font-semibold text-sm text-muted-foreground">
                                                    {subarea.name}
                                                </h5>
                                                <div className="space-y-2">
                                                    {subarea.items?.map((item, idx) => {
                                                        const response = responses[item.id];
                                                        return (
                                                            <div key={item.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                                                    {idx + 1}
                                                                </span>
                                                                <div className="flex-1">
                                                                    <p className="text-sm mb-2">{item.text}</p>
                                                                    <Badge className="bg-blue-600">
                                                                        {getScoreLabel(response?.supervisor_score || 0)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>
                    </Tabs>

                    {/* Observaciones Finales y Acuerdos */}
                    {(assignment.final_observations || assignment.agreements) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Observaciones Finales y Acuerdos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {assignment.final_observations && (
                                    <div>
                                        <h5 className="font-semibold text-sm mb-2">Observaciones Finales:</h5>
                                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                            {assignment.final_observations}
                                        </p>
                                    </div>
                                )}
                                {assignment.agreements && (
                                    <div>
                                        <h5 className="font-semibold text-sm mb-2">Acuerdos y Compromisos:</h5>
                                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                            {assignment.agreements}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cerrar
                        </Button>
                        <Button onClick={() => window.print()}>
                            Imprimir / Exportar PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
