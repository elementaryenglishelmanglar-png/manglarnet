/**
 * RRHH Evaluations List View
 * Visualización de evaluaciones guardadas con filtros y evolución
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { SearchIcon, FilterIcon } from '../Icons';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../ui/toast';
import { EvaluationDetail } from './EvaluationDetail';
import { EditEvaluationForm } from './EditEvaluationForm';
import type { RRHHAssignment } from '../../services/rrhhEvaluationService';

interface EvaluationWithDetails extends RRHHAssignment {
    template_name?: string;
    evaluatee_name?: string;
    evaluatee_username?: string;
    evaluator_name?: string;
}

export const EvaluationsListView: React.FC = () => {
    const [evaluations, setEvaluations] = useState<EvaluationWithDetails[]>([]);
    const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedLapso, setSelectedLapso] = useState<string>('');
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithDetails | null>(null);
    const [evaluationToDelete, setEvaluationToDelete] = useState<EvaluationWithDetails | null>(null);
    const [evaluationToEdit, setEvaluationToEdit] = useState<EvaluationWithDetails | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadEvaluations();
    }, []);

    useEffect(() => {
        filterEvaluations();
    }, [evaluations, searchTerm, selectedYear, selectedLapso]);

    const loadEvaluations = async () => {
        setLoading(true);
        try {
            console.log('Loading evaluations...');

            // Primero cargar assignments
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('rrhh_assignments')
                .select('*')
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });

            if (assignmentsError) {
                console.error('Error loading assignments:', assignmentsError);
                throw assignmentsError;
            }

            console.log('Assignments loaded:', assignmentsData?.length || 0);

            if (!assignmentsData || assignmentsData.length === 0) {
                setEvaluations([]);
                setLoading(false);
                return;
            }

            // Cargar datos relacionados
            const templateIds = [...new Set(assignmentsData.map(a => a.template_id))];
            const evaluateeIds = [...new Set(assignmentsData.map(a => a.evaluatee_id))];
            const evaluatorIds = [...new Set(assignmentsData.map(a => a.evaluator_id).filter(Boolean))];

            // Cargar plantillas
            const { data: templatesData } = await supabase
                .from('rrhh_templates')
                .select('id, name')
                .in('id', templateIds);

            // Cargar usuarios (evaluados y evaluadores)
            const allUserIds = [...new Set([...evaluateeIds, ...evaluatorIds])];
            const { data: usersData } = await supabase
                .from('usuarios')
                .select('id, username, nombre, apellido')
                .in('id', allUserIds);

            console.log('Templates loaded:', templatesData?.length || 0);
            console.log('Users loaded:', usersData?.length || 0);

            // Mapear datos
            const templatesMap = new Map(templatesData?.map(t => [t.id, t]) || []);
            const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

            const mapped = assignmentsData.map(item => {
                const template = templatesMap.get(item.template_id);
                const evaluatee = usersMap.get(item.evaluatee_id);
                const evaluator = usersMap.get(item.evaluator_id);

                return {
                    ...item,
                    template_name: template?.name || 'Plantilla desconocida',
                    evaluatee_name: evaluatee ? `${evaluatee.nombre || ''} ${evaluatee.apellido || ''}`.trim() : 'N/A',
                    evaluatee_username: evaluatee?.username || 'N/A',
                    evaluator_name: evaluator ? `${evaluator.nombre || ''} ${evaluator.apellido || ''}`.trim() : 'N/A'
                };
            });

            console.log('Mapped evaluations:', mapped.length);
            setEvaluations(mapped);
        } catch (error: any) {
            console.error('Error loading evaluations:', error);
            showToast({ type: 'error', title: `Error al cargar evaluaciones: ${error.message}` });
            setEvaluations([]);
        } finally {
            setLoading(false);
        }
    };

    const filterEvaluations = () => {
        let filtered = [...evaluations];

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(evaluation =>
                evaluation.evaluatee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                evaluation.evaluatee_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                evaluation.template_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por año escolar
        if (selectedYear) {
            filtered = filtered.filter(evaluation =>
                evaluation.evaluation_period?.includes(selectedYear)
            );
        }

        // Filtrar por lapso
        if (selectedLapso) {
            filtered = filtered.filter(evaluation =>
                evaluation.evaluation_period?.includes(`${selectedLapso} Lapso`)
            );
        }

        setFilteredEvaluations(filtered);
    };

    const getScoreColor = (score: number): string => {
        if (score >= 18) return 'text-green-600';
        if (score >= 15) return 'text-blue-600';
        if (score >= 12) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadge = (score: number): string => {
        if (score >= 18) return 'Excelente';
        if (score >= 15) return 'Bueno';
        if (score >= 12) return 'Regular';
        return 'Necesita Mejorar';
    };

    const handleDelete = async (evaluation: EvaluationWithDetails) => {
        setIsDeleting(true);
        try {
            console.log('Deleting evaluation:', evaluation.id);

            // Eliminar assignment (las respuestas se eliminan en cascada)
            const { error } = await supabase
                .from('rrhh_assignments')
                .delete()
                .eq('id', evaluation.id);

            if (error) throw error;

            showToast({ type: 'success', title: 'Evaluación eliminada exitosamente' });
            setEvaluationToDelete(null);

            // Recargar evaluaciones
            await loadEvaluations();
        } catch (error: any) {
            console.error('Error deleting evaluation:', error);
            showToast({ type: 'error', title: `Error al eliminar: ${error.message}` });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (evaluation: EvaluationWithDetails) => {
        console.log('Opening edit form for:', evaluation.id);
        setEvaluationToEdit(evaluation);
    };

    // Obtener años únicos de las evaluaciones
    const uniqueYears = Array.from(new Set(
        evaluations
            .map(e => e.evaluation_period?.split(' - ')[0])
            .filter(Boolean)
    )).sort().reverse();

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-foreground">Evaluaciones RRHH</h2>
                <p className="text-muted-foreground mt-1">
                    Visualiza y analiza las evaluaciones completadas
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FilterIcon className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Buscar</Label>
                            <Input
                                placeholder="Nombre, usuario o plantilla..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Año Escolar</Label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Todos los años</option>
                                {uniqueYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Lapso</Label>
                            <select
                                value={selectedLapso}
                                onChange={(e) => setSelectedLapso(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Todos los lapsos</option>
                                <option value="I">I Lapso</option>
                                <option value="II">II Lapso</option>
                                <option value="III">III Lapso</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedYear('');
                                    setSelectedLapso('');
                                }}
                                className="w-full"
                            >
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                                {filteredEvaluations.length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Evaluaciones
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">
                                {filteredEvaluations.length > 0
                                    ? (filteredEvaluations.reduce((sum, e) => sum + (e.final_score || 0), 0) / filteredEvaluations.length).toFixed(2)
                                    : '0.00'}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Promedio General
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">
                                {new Set(filteredEvaluations.map(e => e.evaluatee_id)).size}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Docentes Evaluados
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600">
                                {filteredEvaluations.filter(e => (e.final_score || 0) >= 18).length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Excelentes
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Evaluations List */}
            <Card>
                <CardHeader>
                    <CardTitle>Evaluaciones Completadas</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredEvaluations.length === 0 ? (
                        <Alert>
                            <AlertDescription>
                                {evaluations.length === 0
                                    ? 'No hay evaluaciones completadas aún.'
                                    : 'No se encontraron evaluaciones con los filtros seleccionados.'}
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-4">
                            {filteredEvaluations.map((evaluation) => (
                                <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">
                                                        {evaluation.evaluatee_name}
                                                    </h3>
                                                    <Badge variant="outline">
                                                        @{evaluation.evaluatee_username}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Plantilla:</span>
                                                        <p className="font-medium">{evaluation.template_name}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Período:</span>
                                                        <p className="font-medium">{evaluation.evaluation_period}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Evaluador:</span>
                                                        <p className="font-medium">{evaluation.evaluator_name}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Fecha:</span>
                                                        <p className="font-medium">
                                                            {evaluation.completed_at
                                                                ? new Date(evaluation.completed_at).toLocaleDateString('es-VE')
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 ml-4">
                                                <div className="text-right">
                                                    <div className={`text-3xl font-bold ${getScoreColor(evaluation.final_score || 0)}`}>
                                                        {(evaluation.final_score || 0).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">/ 20</div>
                                                    <Badge className="mt-1">
                                                        {getScoreBadge(evaluation.final_score || 0)}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedEvaluation(evaluation)}
                                                        className="w-full"
                                                    >
                                                        <SearchIcon className="h-4 w-4 mr-1" />
                                                        Ver Detalles
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(evaluation)}
                                                        className="w-full"
                                                    >
                                                        ✏️ Editar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setEvaluationToDelete(evaluation)}
                                                        className="w-full"
                                                    >
                                                        🗑️ Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                <span>Progreso</span>
                                                <span>{((evaluation.final_score || 0) / 20 * 100).toFixed(0)}%</span>
                                            </div>
                                            <Progress value={(evaluation.final_score || 0) / 20 * 100} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de detalles de evaluación */}
            {selectedEvaluation && (
                <EvaluationDetail
                    assignment={selectedEvaluation}
                    onClose={() => setSelectedEvaluation(null)}
                />
            )}

            {/* Modal de confirmación de eliminación */}
            {evaluationToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle className="text-red-600">⚠️ Confirmar Eliminación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                ¿Estás seguro de que deseas eliminar esta evaluación?
                            </p>
                            <div className="bg-gray-50 p-3 rounded space-y-1">
                                <p className="font-semibold">{evaluationToDelete.evaluatee_name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Plantilla: {evaluationToDelete.template_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Período: {evaluationToDelete.evaluation_period}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Nota: {(evaluationToDelete.final_score || 0).toFixed(2)} / 20
                                </p>
                            </div>
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Esta acción no se puede deshacer. Se eliminarán todas las respuestas asociadas.
                                </AlertDescription>
                            </Alert>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEvaluationToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(evaluationToDelete)}
                                    disabled={isDeleting}
                                    className="flex-1"
                                >
                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal de edición */}
            {evaluationToEdit && (
                <EditEvaluationForm
                    assignment={evaluationToEdit}
                    onClose={() => setEvaluationToEdit(null)}
                    onSaved={() => {
                        setEvaluationToEdit(null);
                        loadEvaluations();
                    }}
                />
            )}
        </div>
    );
};
