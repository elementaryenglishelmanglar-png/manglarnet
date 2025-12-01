'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, RotateCcw, Save } from 'lucide-react';
import { simulateScenario } from '@/services/analyticsEngine';
import type { CurrentMetrics, ScenarioModifiers, SimulationResult } from '@/types/analytics';

interface StrategySimulatorProps {
    currentMetrics: CurrentMetrics;
    onSaveStrategy?: (result: SimulationResult, modifiers: ScenarioModifiers) => void;
}

export function StrategySimulator({ currentMetrics, onSaveStrategy }: StrategySimulatorProps) {
    const [asistenciaModifier, setAsistenciaModifier] = useState<number>(0);
    const [notasModifier, setNotasModifier] = useState<number>(0);
    const [apoyoPedagogico, setApoyoPedagogico] = useState<'ninguno' | 'bajo' | 'medio' | 'alto'>('ninguno');
    const [result, setResult] = useState<SimulationResult | null>(null);

    useEffect(() => {
        runSimulation();
    }, [asistenciaModifier, notasModifier, apoyoPedagogico, currentMetrics]);

    const runSimulation = () => {
        const modifiers: ScenarioModifiers = {
            asistenciaModifier,
            notasModifier,
            apoyoPedagogico,
        };

        const simulationResult = simulateScenario(currentMetrics, modifiers);
        setResult(simulationResult);
    };

    const resetSimulation = () => {
        setAsistenciaModifier(0);
        setNotasModifier(0);
        setApoyoPedagogico('ninguno');
    };

    const handleSaveStrategy = () => {
        if (result && onSaveStrategy) {
            onSaveStrategy(result, {
                asistenciaModifier,
                notasModifier,
                apoyoPedagogico,
            });
        }
    };

    const chartData = result
        ? [
            {
                name: 'Promedio',
                Actual: currentMetrics.promedio,
                Proyectado: result.promedioProyectado,
            },
            {
                name: '% Aprobados',
                Actual: currentMetrics.aprobados,
                Proyectado: result.aprobadosProyectados,
            },
        ]
        : [];

    const getApoyoLabel = (apoyo: string) => {
        const labels = {
            ninguno: 'Sin apoyo adicional',
            bajo: 'Apoyo bajo (+15%)',
            medio: 'Apoyo medio (+30%)',
            alto: 'Apoyo alto (+50%)',
        };
        return labels[apoyo as keyof typeof labels];
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="h-4 w-4 inline" />;
        if (change < 0) return <TrendingDown className="h-4 w-4 inline" />;
        return null;
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Control Panel */}
            <Card>
                <CardHeader>
                    <CardTitle>Controles de Simulación</CardTitle>
                    <CardDescription>
                        Ajusta los parámetros para simular diferentes estrategias pedagógicas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Asistencia Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="asistencia-slider">Cambio en Asistencia</Label>
                            <Badge variant="outline" className="tabular-nums">
                                {asistenciaModifier > 0 ? '+' : ''}
                                {asistenciaModifier}%
                            </Badge>
                        </div>
                        <Slider
                            id="asistencia-slider"
                            min={-20}
                            max={20}
                            step={1}
                            value={[asistenciaModifier]}
                            onValueChange={(value) => setAsistenciaModifier(value[0])}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Simula el efecto de mejorar o empeorar la asistencia promedio
                        </p>
                    </div>

                    <Separator />

                    {/* Notas Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="notas-slider">Cambio en Promedio de Notas</Label>
                            <Badge variant="outline" className="tabular-nums">
                                {notasModifier > 0 ? '+' : ''}
                                {notasModifier.toFixed(1)} pts
                            </Badge>
                        </div>
                        <Slider
                            id="notas-slider"
                            min={-3}
                            max={3}
                            step={0.1}
                            value={[notasModifier]}
                            onValueChange={(value) => setNotasModifier(value[0])}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Simula el efecto de intervenciones que mejoren o empeoren el rendimiento
                        </p>
                    </div>

                    <Separator />

                    {/* Apoyo Pedagógico */}
                    <div className="space-y-3">
                        <Label htmlFor="apoyo-select">Nivel de Apoyo Pedagógico</Label>
                        <Select value={apoyoPedagogico} onValueChange={(v) => setApoyoPedagogico(v as any)}>
                            <SelectTrigger id="apoyo-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ninguno">Sin apoyo adicional</SelectItem>
                                <SelectItem value="bajo">Apoyo bajo (+15% efectividad)</SelectItem>
                                <SelectItem value="medio">Apoyo medio (+30% efectividad)</SelectItem>
                                <SelectItem value="alto">Apoyo alto (+50% efectividad)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            El apoyo pedagógico multiplica la efectividad de las intervenciones
                        </p>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button onClick={resetSimulation} variant="outline" className="flex-1">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Resetear
                        </Button>
                        <Button onClick={handleSaveStrategy} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Estrategia
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6">
                {/* Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Comparación: Actual vs Proyectado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Actual" fill="#94a3b8" name="Actual" />
                                <Bar dataKey="Proyectado" name="Proyectado">
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                entry.Proyectado > entry.Actual
                                                    ? '#22c55e'
                                                    : entry.Proyectado < entry.Actual
                                                        ? '#ef4444'
                                                        : '#94a3b8'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Metrics Cards */}
                {result && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Promedio Proyectado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tabular-nums">
                                    {result.promedioProyectado.toFixed(2)}
                                </div>
                                <p className={`text-sm mt-1 ${getChangeColor(result.cambioAbsoluto)}`}>
                                    {getChangeIcon(result.cambioAbsoluto)}
                                    <span className="ml-1">
                                        {result.cambioAbsoluto > 0 ? '+' : ''}
                                        {result.cambioAbsoluto.toFixed(2)} pts ({result.cambioRelativo.toFixed(1)}%)
                                    </span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">% Aprobados Proyectado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tabular-nums">
                                    {result.aprobadosProyectados.toFixed(1)}%
                                </div>
                                <p className={`text-sm mt-1 ${getChangeColor(result.aprobadosProyectados - currentMetrics.aprobados)}`}>
                                    {getChangeIcon(result.aprobadosProyectados - currentMetrics.aprobados)}
                                    <span className="ml-1">
                                        {result.aprobadosProyectados > currentMetrics.aprobados ? '+' : ''}
                                        {(result.aprobadosProyectados - currentMetrics.aprobados).toFixed(1)}%
                                    </span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Estudiantes que Mejorarían</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tabular-nums">
                                    {result.estudiantesMejorados}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    de {currentMetrics.totalEstudiantes} estudiantes
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Desglose de Efectos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Efecto asistencia:</span>
                                    <span className="font-medium tabular-nums">
                                        {result.detalles.efectoAsistencia > 0 ? '+' : ''}
                                        {result.detalles.efectoAsistencia.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Efecto notas:</span>
                                    <span className="font-medium tabular-nums">
                                        {result.detalles.efectoNotas > 0 ? '+' : ''}
                                        {result.detalles.efectoNotas.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Multiplicador apoyo:</span>
                                    <span className="font-medium tabular-nums">
                                        +{result.detalles.efectoApoyo}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Current Strategy Summary */}
                <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Estrategia Actual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cambio en asistencia:</span>
                            <span className="font-medium">
                                {asistenciaModifier > 0 ? '+' : ''}
                                {asistenciaModifier}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cambio en notas:</span>
                            <span className="font-medium">
                                {notasModifier > 0 ? '+' : ''}
                                {notasModifier.toFixed(1)} pts
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Apoyo pedagógico:</span>
                            <span className="font-medium">{getApoyoLabel(apoyoPedagogico)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
