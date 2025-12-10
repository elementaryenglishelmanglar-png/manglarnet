/**
 * Direct Evaluation Form
 * Permite al coordinador ingresar autoevaluación y evaluación del supervisor directamente
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { SaveIcon, ArrowLeftIcon } from '../Icons';
import {
    rrhhTemplatesService,
    rrhhAssignmentsService,
    rrhhResponsesService,
    type TemplateWithStructure
} from '../../services/rrhhEvaluationService';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../ui/toast';

interface DirectEvaluationFormProps {
    templateId: string;
    onComplete?: () => void;
    onCancel?: () => void;
}

interface EvaluationData {
    [itemId: string]: {
        self_score?: number;
        supervisor_score?: number;
        goals?: string;
        observations?: string;
    };
}

interface AreaScore {
    name: string;
    weight: number;
    obtained: number;
    max: number;
}

export const DirectEvaluationForm: React.FC<DirectEvaluationFormProps> = ({
    templateId,
    onComplete,
    onCancel
}) => {
    const [template, setTemplate] = useState<TemplateWithStructure | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedLapso, setSelectedLapso] = useState<string>('');
    const [evaluationData, setEvaluationData] = useState<EvaluationData>({});
    const [finalObservations, setFinalObservations] = useState<string>('');
    const [agreements, setAgreements] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'self' | 'supervisor'>('self');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    // Helper para obtener colores según el puntaje
    const getScoreColorClass = (score: number, isSelected: boolean, tabType: 'self' | 'supervisor') => {
        if (!isSelected) {
            return 'bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-700';
        }

        // Colores según puntaje
        const baseColors = {
            0.5: 'bg-red-500',      // Rojo
            1.0: 'bg-orange-500',   // Naranja
            1.5: 'bg-cyan-400',     // Azul claro
            2.0: 'bg-green-400'     // Verde neón
        };

        const ringColors = {
            0.5: 'ring-red-300',
            1.0: 'ring-orange-300',
            1.5: 'ring-cyan-300',
            2.0: 'ring-green-300'
        };

        const baseColor = baseColors[score as keyof typeof baseColors] || 'bg-gray-500';
        const ringColor = ringColors[score as keyof typeof ringColors] || 'ring-gray-300';

        return `${baseColor} text-white shadow-lg scale-105 ring-2 ${ringColor}`;
    };

    useEffect(() => {
        loadData();
    }, [templateId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar plantilla
            const templateData = await rrhhTemplatesService.getById(templateId);
            setTemplate(templateData);

            // Cargar usuarios registrados en la plataforma
            console.log('Cargando usuarios...');
            const { data: usersData, error: usersError } = await supabase
                .from('usuarios')
                .select('id, username, nombre, apellido, email, role, is_active')
                .eq('is_active', true) // Solo usuarios activos
                .order('apellido, nombre');

            if (usersError) {
                console.error('Error cargando usuarios:', usersError);
                showToast({ type: 'error', title: 'Error al cargar usuarios' });
                setUsers([]);
            } else {
                console.log('Usuarios cargados:', usersData);
                // Mapear a la estructura esperada
                const mappedUsers = (usersData || []).map(user => ({
                    id_usuario: user.id,
                    nombre: user.nombre || user.username,
                    apellido: user.apellido || '',
                    role: user.role
                }));
                setUsers(mappedUsers);
            }

            // Establecer año y lapso por defecto
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            // Determinar lapso basado en el mes
            let lapso = 'I';
            if (currentMonth >= 4 && currentMonth < 8) lapso = 'II';
            else if (currentMonth >= 8) lapso = 'III';

            setSelectedYear(`${currentYear}-${currentYear + 1}`);
            setSelectedLapso(lapso);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast({ type: 'error', title: 'Error al cargar datos' });
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (itemId: string, field: 'self_score' | 'supervisor_score', value: number) => {
        setEvaluationData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    const handleTextChange = (itemId: string, field: 'goals' | 'observations', value: string) => {
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

        let totalPercentage = 0; // Suma de porcentajes de todas las áreas

        template.areas?.forEach(area => {
            // Calcular total de ítems en el área
            let totalItemsInArea = 0;
            area.subareas?.forEach(subarea => {
                totalItemsInArea += subarea.items?.length || 0;
            });

            if (totalItemsInArea === 0) return;

            // Calcular puntaje promedio del área (0-2)
            let areaScoreSum = 0;
            let itemsWithScore = 0;

            area.subareas?.forEach(subarea => {
                subarea.items?.forEach(item => {
                    const data = evaluationData[item.id];
                    const score = scoreType === 'self' ? data?.self_score : data?.supervisor_score;

                    if (score !== undefined) {
                        areaScoreSum += score;
                        itemsWithScore++;
                    }
                });
            });

            // Calcular porcentaje del área obtenido
            if (itemsWithScore > 0) {
                const areaAverage = areaScoreSum / itemsWithScore; // Promedio de 0-2
                const areaPercentage = (areaAverage / 2) * area.weight_percentage; // Porcentaje obtenido del área
                totalPercentage += areaPercentage;
            }
        });

        // Fórmula: (suma de porcentajes) * 20 / 100
        return (totalPercentage * 20) / 100;
    };

    const calculateAreaScores = (scoreType: 'self' | 'supervisor'): AreaScore[] => {
        if (!template) return [];

        return template.areas?.map(area => {
            let totalItemsInArea = 0;
            area.subareas?.forEach(subarea => {
                totalItemsInArea += subarea.items?.length || 0;
            });

            // Calcular puntaje promedio del área
            let areaScoreSum = 0;
            let itemsWithScore = 0;

            area.subareas?.forEach(subarea => {
                subarea.items?.forEach(item => {
                    const data = evaluationData[item.id];
                    const score = scoreType === 'self' ? data?.self_score : data?.supervisor_score;

                    if (score !== undefined) {
                        areaScoreSum += score;
                        itemsWithScore++;
                    }
                });
            });

            // Calcular porcentaje obtenido del área
            let areaPercentage = 0;
            if (itemsWithScore > 0) {
                const areaAverage = areaScoreSum / itemsWithScore; // Promedio de 0-2
                areaPercentage = (areaAverage / 2) * area.weight_percentage; // Porcentaje obtenido
            }

            return {
                name: area.name,
                weight: area.weight_percentage,
                obtained: areaPercentage,
                max: area.weight_percentage
            };
        }) || [];
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
        if (!selectedUserId) {
            showToast({ type: 'warning', title: 'Selecciona un docente' });
            return;
        }

        if (!selectedYear || !selectedLapso) {
            showToast({ type: 'warning', title: 'Selecciona el año escolar y el lapso' });
            return;
        }

        setSaving(true);
        try {
            // Obtener usuario actual (coordinador) de la tabla usuarios
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // Obtener el id_usuario de la tabla usuarios
            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuarios')
                .select('id')
                .eq('email', user.email)
                .single();

            if (usuarioError || !usuarioData) {
                throw new Error('Usuario no encontrado en la base de datos');
            }

            // Crear asignación
            console.log('Creating assignment with data:', {
                template_id: templateId,
                evaluator_id: usuarioData.id,
                evaluatee_id: selectedUserId,
                evaluation_period: `${selectedYear} - ${selectedLapso} Lapso`,
                final_score: calculateScore('supervisor')
            });

            const assignment = await rrhhAssignmentsService.create({
                template_id: templateId,
                evaluator_id: usuarioData.id,
                evaluatee_id: selectedUserId,
                status: 'completed',
                evaluation_period: `${selectedYear} - ${selectedLapso} Lapso`,
                final_score: calculateScore('supervisor'),
                final_observations: finalObservations,
                agreements: agreements,
                completed_at: new Date().toISOString()
            });

            console.log('Assignment created:', assignment);

            // Guardar todas las respuestas
            let savedResponses = 0;
            for (const [itemId, data] of Object.entries(evaluationData)) {
                if (data.self_score || data.supervisor_score) {
                    const comment = [data.goals, data.observations].filter(Boolean).join(' | ');
                    await rrhhResponsesService.upsert({
                        assignment_id: assignment.id,
                        item_id: itemId,
                        self_score: data.self_score,
                        supervisor_score: data.supervisor_score,
                        comment: comment || undefined
                    });
                    savedResponses++;
                }
            }

            console.log(`Saved ${savedResponses} responses`);
            showToast({ type: 'success', title: `Evaluación guardada exitosamente (${savedResponses} respuestas)` });
            onComplete?.();
        } catch (error: any) {
            console.error('Error saving evaluation:', error);
            showToast({
                type: 'error',
                title: `Error: ${error.message || 'Error desconocido'}`
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!template) return null;

    const selfScore = calculateScore('self');
    const supervisorScore = calculateScore('supervisor');
    const selfPercentage = (selfScore / 20) * 100;
    const supervisorPercentage = (supervisorScore / 20) * 100;
    const areaScoresSelf = calculateAreaScores('self');
    const areaScoresSupervisor = calculateAreaScores('supervisor');

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {onCancel && (
                                    <Button variant="outline" onClick={onCancel}>
                                        <ArrowLeftIcon />
                                    </Button>
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold">{template.name}</h1>
                                    <p className="text-gray-600">Evaluación Directa</p>
                                </div>
                            </div>
                        </div>

                        {/* Selección de Docente y Período */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Docente a Evaluar *</Label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">
                                        {users.length === 0 ? 'No hay usuarios disponibles' : 'Seleccionar docente...'}
                                    </option>
                                    {users.map(user => (
                                        <option key={user.id_usuario} value={user.id_usuario}>
                                            {user.nombre} {user.apellido} - {user.role}
                                        </option>
                                    ))}
                                </select>
                                {users.length === 0 && (
                                    <p className="text-xs text-red-600 mt-1">
                                        No se encontraron usuarios. Verifica la consola del navegador.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Año Escolar y Lapso */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Año Escolar *</Label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Seleccionar año...</option>
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year = new Date().getFullYear() - 1 + i;
                                        return (
                                            <option key={year} value={`${year}-${year + 1}`}>
                                                {year}-{year + 1}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <Label>Lapso *</Label>
                                <select
                                    value={selectedLapso}
                                    onChange={(e) => setSelectedLapso(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Seleccionar lapso...</option>
                                    <option value="I">I Lapso</option>
                                    <option value="II">II Lapso</option>
                                    <option value="III">III Lapso</option>
                                </select>
                            </div>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">
                                    {selfScore.toFixed(2)} / 20
                                </div>
                                <div className="text-sm text-gray-600">Autoevaluación</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {selfPercentage.toFixed(1)}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {supervisorScore.toFixed(2)} / 20
                                </div>
                                <div className="text-sm text-gray-600">Evaluación Supervisor</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {supervisorPercentage.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Area Scores Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle>Puntajes por Área</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {areaScoresSupervisor.map((area, idx) => {
                            const selfArea = areaScoresSelf[idx];
                            const selfPercent = (selfArea.obtained / selfArea.max) * 100;
                            const supervisorPercent = (area.obtained / area.max) * 100;

                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">
                                            {area.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Peso: {area.weight}%
                                        </span>
                                    </div>

                                    {/* Autoevaluación Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-green-600">Autoevaluación</span>
                                            <span className="font-semibold text-green-600">
                                                {selfArea.obtained.toFixed(2)} / {selfArea.max}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-green-500 h-3 rounded-full transition-all"
                                                style={{ width: `${selfPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Supervisor Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-blue-600">Evaluación Supervisor</span>
                                            <span className="font-semibold text-blue-600">
                                                {area.obtained.toFixed(2)} / {area.max}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full transition-all"
                                                style={{ width: `${supervisorPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Evaluation Tabs */}
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        {/* Tab Navigation */}
                        <div className="flex gap-2 border-b">
                            <button
                                onClick={() => setActiveTab('self')}
                                className={`flex-1 py-4 px-6 font-semibold text-lg transition-all border-b-4 ${activeTab === 'self'
                                    ? 'border-green-600 text-green-700 bg-green-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <span>📝 Autoevaluación</span>
                                    <Badge variant={activeTab === 'self' ? 'default' : 'outline'} className="bg-green-600">
                                        {calculateProgress('self')}%
                                    </Badge>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('supervisor')}
                                className={`flex-1 py-4 px-6 font-semibold text-lg transition-all border-b-4 ${activeTab === 'supervisor'
                                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <span>👤 Evaluación del Supervisor</span>
                                    <Badge variant={activeTab === 'supervisor' ? 'default' : 'outline'} className="bg-blue-600">
                                        {calculateProgress('supervisor')}%
                                    </Badge>
                                </div>
                            </button>
                        </div>

                        {/* Tab Description */}
                        <div className={`p-4 rounded-lg ${activeTab === 'self' ? 'bg-green-50 border-l-4 border-green-600' : 'bg-blue-50 border-l-4 border-blue-600'
                            }`}>
                            <p className="text-sm font-medium">
                                {activeTab === 'self'
                                    ? '📝 Complete la autoevaluación del docente. Ingrese los puntajes y metas según corresponda.'
                                    : '👤 Complete la evaluación del supervisor. Ingrese los puntajes y observaciones según corresponda.'}
                            </p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Evaluation Content */}
            <div className="space-y-6">
                {template.areas?.map((area) => (
                    <Card key={area.id} className={`border-l-4 ${activeTab === 'self' ? 'border-l-green-500' : 'border-l-blue-500'
                        }`}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">{area.name}</CardTitle>
                                <Badge variant="secondary">
                                    Peso: {area.weight_percentage}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {area.subareas?.map((subarea) => (
                                <div key={subarea.id} className="space-y-4">
                                    <div className={`flex items-center justify-between p-3 rounded-lg ${activeTab === 'self' ? 'bg-green-50' : 'bg-blue-50'
                                        }`}>
                                        <h3 className="font-semibold text-gray-800">
                                            {subarea.name}
                                        </h3>
                                        <Badge variant="outline">
                                            {subarea.relative_weight}%
                                        </Badge>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-3">
                                        {subarea.items?.map((item, idx) => {
                                            const data = evaluationData[item.id] || {};
                                            const currentScore = activeTab === 'self' ? data.self_score : data.supervisor_score;
                                            const textField = activeTab === 'self' ? data.goals : data.observations;

                                            return (
                                                <div key={item.id} className={`p-4 border-2 rounded-lg transition-all ${currentScore
                                                    ? (activeTab === 'self' ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30')
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}>
                                                    {/* Indicador */}
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeTab === 'self'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {idx + 1}
                                                        </span>
                                                        <p className="text-sm text-gray-800 flex-1 leading-relaxed pt-1">
                                                            {item.text}
                                                        </p>
                                                    </div>

                                                    {/* Score Buttons */}
                                                    <div className="mb-4">
                                                        <Label className="text-xs text-gray-600 mb-2 block">
                                                            {activeTab === 'self' ? 'Autoevaluación:' : 'Evaluación:'}
                                                        </Label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[
                                                                { value: 0.5, label: 'Un poco' },
                                                                { value: 1, label: 'A veces' },
                                                                { value: 1.5, label: 'Frecuente' },
                                                                { value: 2, label: 'Siempre' }
                                                            ].map((option) => (
                                                                <button
                                                                    key={option.value}
                                                                    onClick={() => handleScoreChange(
                                                                        item.id,
                                                                        activeTab === 'self' ? 'self_score' : 'supervisor_score',
                                                                        option.value
                                                                    )}
                                                                    className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${getScoreColorClass(
                                                                        option.value,
                                                                        currentScore === option.value,
                                                                        activeTab
                                                                    )
                                                                        }`}
                                                                >
                                                                    <div className="text-lg font-bold">{option.value}</div>
                                                                    <div className="text-xs opacity-90">{option.label}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Text Field */}
                                                    <div>
                                                        <Label className="text-xs text-gray-600 mb-2 block">
                                                            {activeTab === 'self' ? 'Metas:' : 'Observaciones:'}
                                                        </Label>
                                                        <Textarea
                                                            value={textField || ''}
                                                            onChange={(e) => handleTextChange(
                                                                item.id,
                                                                activeTab === 'self' ? 'goals' : 'observations',
                                                                e.target.value
                                                            )}
                                                            placeholder={activeTab === 'self' ? 'Escriba las metas...' : 'Escriba las observaciones...'}
                                                            rows={3}
                                                            className={`text-sm ${activeTab === 'self'
                                                                ? 'border-green-200 focus:border-green-400'
                                                                : 'border-blue-200 focus:border-blue-400'
                                                                }`}
                                                        />
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
            </div>

            {/* Final Observations and Agreements */}
            <Card>
                <CardHeader>
                    <CardTitle>Observaciones Finales y Acuerdos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Observaciones Finales</Label>
                        <p className="text-sm text-gray-600 mb-2">
                            Comentarios generales sobre el desempeño del evaluado
                        </p>
                        <Textarea
                            value={finalObservations}
                            onChange={(e) => setFinalObservations(e.target.value)}
                            placeholder="Escriba aquí las observaciones finales sobre el desempeño general del evaluado..."
                            rows={6}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <Label className="text-base font-semibold">Acuerdos y Compromisos</Label>
                        <p className="text-sm text-gray-600 mb-2">
                            Acuerdos establecidos entre el evaluador y el evaluado para el próximo período
                        </p>
                        <Textarea
                            value={agreements}
                            onChange={(e) => setAgreements(e.target.value)}
                            placeholder="Escriba aquí los acuerdos y compromisos establecidos..."
                            rows={6}
                            className="w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-end gap-4">
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel}>
                                Cancelar
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={saving || !selectedUserId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="mr-2" />
                                    Guardar Evaluación
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
