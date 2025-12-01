'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { analyticsService } from '@/services/analyticsDataService';
import type { TelemetryKPIs, FilterOptions } from '@/types/analytics';

interface LiveKPICardsProps {
    filters?: FilterOptions;
    autoRefresh?: boolean;
    refreshInterval?: number; // milliseconds
}

export function LiveKPICards({
    filters,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds default
}: LiveKPICardsProps) {
    const [kpis, setKpis] = useState<TelemetryKPIs | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [trend, setTrend] = useState<{
        promedio: 'up' | 'down' | 'stable';
        asistencia: 'up' | 'down' | 'stable';
        aprobados: 'up' | 'down' | 'stable';
    }>({
        promedio: 'stable',
        asistencia: 'stable',
        aprobados: 'stable',
    });

    const fetchKPIs = async () => {
        try {
            const data = await analyticsService.getTelemetryKPIs(filters);

            if (data && data.length > 0) {
                const aggregated = aggregateKPIs(data);

                // Calculate trends if we have previous data
                if (kpis) {
                    setTrend({
                        promedio: calculateTrend(kpis.promedio_general, aggregated.promedio_general),
                        asistencia: calculateTrend(kpis.promedio_asistencia, aggregated.promedio_asistencia),
                        aprobados: calculateTrend(kpis.porcentaje_aprobados, aggregated.porcentaje_aprobados),
                    });
                }

                setKpis(aggregated);
            }

            setLastUpdate(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKPIs();

        if (autoRefresh) {
            const interval = setInterval(fetchKPIs, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [filters, autoRefresh, refreshInterval]);

    const aggregateKPIs = (data: TelemetryKPIs[]): TelemetryKPIs => {
        const totalStudents = data.reduce((sum, d) => sum + d.total_estudiantes, 0);
        const avgPromedio = data.reduce((sum, d) => sum + d.promedio_general * d.total_estudiantes, 0) / totalStudents;
        const avgAsistencia = data.reduce((sum, d) => sum + d.promedio_asistencia * d.total_estudiantes, 0) / totalStudents;
        const avgAprobados = data.reduce((sum, d) => sum + d.porcentaje_aprobados * d.total_estudiantes, 0) / totalStudents;

        return {
            grado: filters?.grado || 'Todos',
            materia: filters?.materia || 'Todas',
            lapso: filters?.lapso || data[0]?.lapso || '',
            ano_escolar: filters?.anoEscolar || data[0]?.ano_escolar || '',
            total_estudiantes: totalStudents,
            promedio_general: Math.round(avgPromedio * 100) / 100,
            promedio_asistencia: Math.round(avgAsistencia * 100) / 100,
            porcentaje_aprobados: Math.round(avgAprobados * 100) / 100,
            ultima_actualizacion: new Date().toISOString(),
        };
    };

    const calculateTrend = (previous: number, current: number): 'up' | 'down' | 'stable' => {
        const diff = current - previous;
        if (diff > 0.5) return 'up';
        if (diff < -0.5) return 'down';
        return 'stable';
    };

    const getTrendIcon = (trendValue: 'up' | 'down' | 'stable') => {
        switch (trendValue) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'stable':
                return <Minus className="h-4 w-4 text-gray-400" />;
        }
    };

    const getAsistenciaColor = (asistencia: number) => {
        if (asistencia >= 85) return 'text-green-600';
        if (asistencia >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getAprobadosColor = (aprobados: number) => {
        if (aprobados >= 85) return 'text-green-600';
        if (aprobados >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!kpis) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No hay datos disponibles para los filtros seleccionados
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Promedio Global */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Promedio Global</CardTitle>
                        {getTrendIcon(trend.promedio)}
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tabular-nums">
                            {kpis.promedio_general.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Escala 0-20 puntos
                        </p>
                    </CardContent>
                </Card>

                {/* Asistencia Promedio */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
                        {getTrendIcon(trend.asistencia)}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold tabular-nums ${getAsistenciaColor(kpis.promedio_asistencia)}`}>
                            {kpis.promedio_asistencia.toFixed(1)}%
                        </div>
                        <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${kpis.promedio_asistencia >= 85
                                        ? 'bg-green-500'
                                        : kpis.promedio_asistencia >= 70
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                    }`}
                                style={{ width: `${Math.min(kpis.promedio_asistencia, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* % Aprobados */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">% Aprobados</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold tabular-nums ${getAprobadosColor(kpis.porcentaje_aprobados)}`}>
                            {kpis.porcentaje_aprobados.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {getTrendIcon(trend.aprobados)}
                            <span className="ml-1">
                                vs objetivo 85%
                            </span>
                        </p>
                    </CardContent>
                </Card>

                {/* Total Estudiantes */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tabular-nums">
                            {kpis.total_estudiantes}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {filters?.grado || 'Todos los grados'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Last Update Badge */}
            <div className="flex justify-end">
                <Badge variant="outline" className="text-xs">
                    Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
                </Badge>
            </div>
        </div>
    );
}
