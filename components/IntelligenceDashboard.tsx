'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw } from 'lucide-react';

// Analytics Components
import { LiveKPICards } from './analytics/LiveKPICards';
import { RiskTelemetryTable } from './analytics/RiskTelemetryTable';
import { StrategySimulator } from './analytics/StrategySimulator';
import { EmotionalClimateChart } from './analytics/EmotionalClimateChart';
import { GhostCarChart } from './analytics/GhostCarChart';
import { IntelligentNotifications } from './analytics/IntelligentNotifications';

import type { FilterOptions, CurrentMetrics } from '@/types/analytics';

interface IntelligenceDashboardProps {
    availableGrados?: string[];
    availableMaterias?: string[];
    currentAnoEscolar?: string;
    currentLapso?: string;
}

export function IntelligenceDashboard({
    availableGrados = [],
    availableMaterias = [],
    currentAnoEscolar = '2024-2025',
    currentLapso = 'I Lapso',
}: IntelligenceDashboardProps) {
    const [filters, setFilters] = useState<FilterOptions>({
        anoEscolar: currentAnoEscolar,
        lapso: currentLapso,
    });

    const [currentMetrics, setCurrentMetrics] = useState<CurrentMetrics>({
        promedio: 14.5,
        asistencia: 75,
        aprobados: 68,
        totalEstudiantes: 25,
    });

    const handleFilterChange = (key: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value === 'all' ? undefined : value,
        }));
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleExportPDF = () => {
        // TODO: Implement PDF export
        alert('Exportación a PDF en desarrollo');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Intelligence Suite</h1>
                        <p className="text-gray-600 mt-2">
                            Plataforma de Ciencia de Datos Educativos - Inspirada en Telemetría F1
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualizar
                        </Button>
                        <Button onClick={handleExportPDF}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar PDF
                        </Button>
                    </div>
                </div>

                {/* Global Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filtros Globales</CardTitle>
                        <CardDescription>Aplica filtros a todas las visualizaciones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Año Escolar</label>
                                <Select
                                    value={filters.anoEscolar || 'all'}
                                    onValueChange={(v) => handleFilterChange('anoEscolar', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                                        <SelectItem value="2023-2024">2023-2024</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Lapso</label>
                                <Select
                                    value={filters.lapso || 'all'}
                                    onValueChange={(v) => handleFilterChange('lapso', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="I Lapso">I Lapso</SelectItem>
                                        <SelectItem value="II Lapso">II Lapso</SelectItem>
                                        <SelectItem value="III Lapso">III Lapso</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {availableGrados.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Grado</label>
                                    <Select
                                        value={filters.grado || 'all'}
                                        onValueChange={(v) => handleFilterChange('grado', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los grados" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {availableGrados.map((grado) => (
                                                <SelectItem key={grado} value={grado}>
                                                    {grado}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {availableMaterias.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Materia</label>
                                    <Select
                                        value={filters.materia || 'all'}
                                        onValueChange={(v) => handleFilterChange('materia', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las materias" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {availableMaterias.map((materia) => (
                                                <SelectItem key={materia} value={materia}>
                                                    {materia}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content - Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Vista General</TabsTrigger>
                    <TabsTrigger value="risk">Telemetría de Riesgo</TabsTrigger>
                    <TabsTrigger value="simulator">Simulador</TabsTrigger>
                    <TabsTrigger value="sentiment">Clima Emocional</TabsTrigger>
                    <TabsTrigger value="benchmark">Ghost Car</TabsTrigger>
                    <TabsTrigger value="notifications">
                        Alertas
                        <Badge variant="destructive" className="ml-2 rounded-full">
                            3
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <LiveKPICards filters={filters} autoRefresh={true} refreshInterval={30000} />

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Estudiantes en Riesgo</CardTitle>
                                <CardDescription>Top 10 estudiantes con mayor risk score</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RiskTelemetryTable filters={filters} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Alertas Recientes</CardTitle>
                                <CardDescription>Últimas notificaciones inteligentes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <IntelligentNotifications
                                    filters={{ ...filters, estado: 'pendiente' }}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Risk Telemetry Tab */}
                <TabsContent value="risk" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla de Telemetría de Riesgo</CardTitle>
                            <CardDescription>
                                Análisis completo de estudiantes con factores de riesgo
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RiskTelemetryTable filters={filters} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Strategy Simulator Tab */}
                <TabsContent value="simulator" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Simulador de Estrategia (What-If)</CardTitle>
                            <CardDescription>
                                Proyecta el impacto de diferentes intervenciones pedagógicas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StrategySimulator
                                currentMetrics={currentMetrics}
                                onSaveStrategy={(result, modifiers) => {
                                    console.log('Strategy saved:', result, modifiers);
                                    alert('Estrategia guardada exitosamente');
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Emotional Climate Tab */}
                <TabsContent value="sentiment" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Análisis de Clima Emocional</CardTitle>
                            <CardDescription>
                                Análisis con IA del estado emocional del grupo
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmotionalClimateChart
                                observaciones={[
                                    {
                                        id_alumno: 'alumno-1',
                                        observaciones: 'Muy participativo y enfocado en la clase',
                                    },
                                    {
                                        id_alumno: 'alumno-2',
                                        observaciones: 'Se ve cansado, algo distraído',
                                    },
                                ]}
                                idMinuta="minuta-test-123"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Ghost Car Tab */}
                <TabsContent value="benchmark" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparación Histórica (Ghost Car)</CardTitle>
                            <CardDescription>
                                Compara el rendimiento actual vs. años anteriores
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GhostCarChart
                                grado={filters.grado || '5to Grado'}
                                materia={filters.materia || 'Matemáticas'}
                                lapso={filters.lapso || 'I Lapso'}
                                anoEscolar={filters.anoEscolar || '2024-2025'}
                                availableGrados={availableGrados}
                                availableMaterias={availableMaterias}
                                onGradoChange={(g) => handleFilterChange('grado', g)}
                                onMateriaChange={(m) => handleFilterChange('materia', m)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notificaciones Inteligentes</CardTitle>
                            <CardDescription>
                                Sistema de alertas basado en detección de anomalías
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IntelligentNotifications filters={filters} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
