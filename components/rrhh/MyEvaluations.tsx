/**
 * RRHH My Evaluations Dashboard
 * Vista de evaluaciones asignadas al usuario actual
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { EvaluationIcon } from '../Icons';
import { Clock } from 'lucide-react';
import {
    rrhhAssignmentsService,
    rrhhTemplatesService,
    type RRHHAssignment,
    type RRHHTemplate
} from '../../services/rrhhEvaluationService';
import { useToast } from '../ui/toast';
import { EvaluationForm } from './EvaluationForm';

interface MyEvaluationsProps {
    userId: string;
}

interface AssignmentWithTemplate extends RRHHAssignment {
    template?: RRHHTemplate;
}

export const MyEvaluations: React.FC<MyEvaluationsProps> = ({ userId }) => {
    const [assignments, setAssignments] = useState<AssignmentWithTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        loadAssignments();
    }, [userId]);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const data = await rrhhAssignmentsService.getMyAssignments(userId);

            // Cargar información de las plantillas
            const assignmentsWithTemplates = await Promise.all(
                data.map(async (assignment) => {
                    const template = await rrhhTemplatesService.getById(assignment.template_id);
                    return {
                        ...assignment,
                        template: template || undefined
                    };
                })
            );

            setAssignments(assignmentsWithTemplates);
        } catch (error) {
            console.error('Error loading assignments:', error);
            showToast({ type: 'error', title: 'Error al cargar evaluaciones' });
        } finally {
            setLoading(false);
        }
    };

    const handleStartEvaluation = (assignmentId: string) => {
        setSelectedAssignment(assignmentId);
    };

    const handleEvaluationComplete = () => {
        setSelectedAssignment(null);
        loadAssignments();
    };

    if (selectedAssignment) {
        return (
            <EvaluationForm
                assignmentId={selectedAssignment}
                mode="self"
                onComplete={handleEvaluationComplete}
                onCancel={() => setSelectedAssignment(null)}
            />
        );
    }

    const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress');
    const completedAssignments = assignments.filter(a => a.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
                <p className="text-gray-600 mt-1">
                    Gestiona tus autoevaluaciones de desempeño
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pendientes</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    {pendingAssignments.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completadas</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {completedAssignments.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <EvaluationIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Score Promedio</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {completedAssignments.length > 0
                                        ? (
                                            completedAssignments.reduce((sum, a) => sum + (a.final_score || 0), 0) /
                                            completedAssignments.length
                                        ).toFixed(2)
                                        : '-'}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Evaluations */}
            {pendingAssignments.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Evaluaciones Pendientes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingAssignments.map((assignment) => (
                            <Card key={assignment.id} className="border-l-4 border-l-orange-500">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                {assignment.template?.name || 'Cargando...'}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {assignment.evaluation_period}
                                            </p>
                                        </div>
                                        <Badge variant="warning">Pendiente</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {assignment.due_date && (
                                        <p className="text-sm text-gray-600 mb-3">
                                            Fecha límite:{' '}
                                            {new Date(assignment.due_date).toLocaleDateString()}
                                        </p>
                                    )}
                                    <Button
                                        onClick={() => handleStartEvaluation(assignment.id)}
                                        className="w-full"
                                    >
                                        {assignment.status === 'in_progress'
                                            ? 'Continuar Evaluación'
                                            : 'Iniciar Evaluación'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Evaluations */}
            {completedAssignments.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Evaluaciones Completadas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedAssignments.map((assignment) => (
                            <Card key={assignment.id} className="border-l-4 border-l-green-500">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                {assignment.template?.name || 'Cargando...'}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {assignment.evaluation_period}
                                            </p>
                                        </div>
                                        <Badge variant="success">Completada</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Score Final:</span>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {assignment.final_score?.toFixed(2) || '-'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Completada el{' '}
                                            {assignment.completed_at &&
                                                new Date(assignment.completed_at).toLocaleDateString()}
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleStartEvaluation(assignment.id)}
                                            className="w-full"
                                        >
                                            Ver Detalles
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {loading && (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )}

            {!loading && assignments.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <EvaluationIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No tienes evaluaciones asignadas</h3>
                        <p className="text-gray-600">
                            Cuando se te asigne una evaluación, aparecerá aquí
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
