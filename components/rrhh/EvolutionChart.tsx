/**
 * RRHH Evolution Chart
 * Gráfico de evolución histórica de evaluaciones por docente
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../ui/toast';

interface EvolutionData {
    period: string;
    score: number;
    date: string;
}

interface TeacherEvolution {
    teacher_id: string;
    teacher_name: string;
    evaluations: EvolutionData[];
}

export const EvolutionChart: React.FC = () => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        loadTeachers();
    }, []);

    useEffect(() => {
        if (selectedTeacher) {
            loadEvolutionData(selectedTeacher);
        }
    }, [selectedTeacher]);

    const loadTeachers = async () => {
        setLoading(true);
        try {
            // Obtener docentes que tienen evaluaciones
            const { data, error } = await supabase
                .from('rrhh_assignments')
                .select(`
                    evaluatee_id,
                    evaluatee:usuarios!rrhh_assignments_evaluatee_id_fkey(nombre, apellido)
                `)
                .eq('status', 'completed');

            if (error) throw error;

            // Obtener docentes únicos
            const uniqueTeachers = Array.from(
                new Map(
                    (data || []).map(item => [
                        item.evaluatee_id,
                        {
                            id: item.evaluatee_id,
                            name: `${item.evaluatee.nombre} ${item.evaluatee.apellido}`
                        }
                    ])
                ).values()
            );

            setTeachers(uniqueTeachers);
        } catch (error) {
            console.error('Error loading teachers:', error);
            showToast({ type: 'error', title: 'Error al cargar docentes' });
        } finally {
            setLoading(false);
        }
    };

    const loadEvolutionData = async (teacherId: string) => {
        try {
            const { data, error } = await supabase
                .from('rrhh_assignments')
                .select('evaluation_period, final_score, completed_at')
                .eq('evaluatee_id', teacherId)
                .eq('status', 'completed')
                .order('completed_at', { ascending: true });

            if (error) throw error;

            const evolution: EvolutionData[] = (data || []).map(item => ({
                period: item.evaluation_period || 'N/A',
                score: item.final_score || 0,
                date: item.completed_at || ''
            }));

            setEvolutionData(evolution);
        } catch (error) {
            console.error('Error loading evolution data:', error);
            showToast({ type: 'error', title: 'Error al cargar evolución' });
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 18) return 'bg-green-500';
        if (score >= 15) return 'bg-blue-500';
        if (score >= 12) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getTrend = (): string => {
        if (evolutionData.length < 2) return 'neutral';
        const lastScore = evolutionData[evolutionData.length - 1].score;
        const previousScore = evolutionData[evolutionData.length - 2].score;
        if (lastScore > previousScore) return 'up';
        if (lastScore < previousScore) return 'down';
        return 'stable';
    };

    const getAverage = (): number => {
        if (evolutionData.length === 0) return 0;
        const sum = evolutionData.reduce((acc, item) => acc + item.score, 0);
        return sum / evolutionData.length;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Evolución Histórica</h2>
                <p className="text-muted-foreground mt-1">
                    Analiza la evolución del desempeño de los docentes a lo largo del tiempo
                </p>
            </div>

            {/* Selector de Docente */}
            <Card>
                <CardHeader>
                    <CardTitle>Seleccionar Docente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Docente</Label>
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Seleccionar docente...</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Estadísticas */}
            {selectedTeacher && evolutionData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {evolutionData.length}
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
                                    {getAverage().toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Promedio Histórico
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">
                                    {evolutionData[evolutionData.length - 1].score.toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Última Evaluación
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl">
                                    {getTrend() === 'up' && '📈'}
                                    {getTrend() === 'down' && '📉'}
                                    {getTrend() === 'stable' && '➡️'}
                                    {getTrend() === 'neutral' && '—'}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Tendencia
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Gráfico de Evolución */}
            {selectedTeacher && evolutionData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Evolución de Desempeño</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Timeline Visual */}
                            <div className="relative">
                                {evolutionData.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 mb-6">
                                        {/* Línea de tiempo */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full ${getScoreColor(item.score)}`}></div>
                                            {index < evolutionData.length - 1 && (
                                                <div className="w-0.5 h-12 bg-gray-300"></div>
                                            )}
                                        </div>

                                        {/* Información */}
                                        <div className="flex-1">
                                            <Card className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-semibold">{item.period}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(item.date).toLocaleDateString('es-VE')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-blue-600">
                                                                {item.score.toFixed(2)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">/ 20</div>
                                                        </div>
                                                    </div>
                                                    {/* Barra de progreso */}
                                                    <div className="mt-3">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${getScoreColor(item.score)}`}
                                                                style={{ width: `${(item.score / 20) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : selectedTeacher ? (
                <Alert>
                    <AlertDescription>
                        No hay evaluaciones registradas para este docente.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert>
                    <AlertDescription>
                        Selecciona un docente para ver su evolución histórica.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
