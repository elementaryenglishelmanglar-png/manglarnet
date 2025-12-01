'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    LineChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getHistoricalBenchmark } from '@/services/analyticsEngine';
import type { HistoricalBenchmark } from '@/types/analytics';

interface GhostCarChartProps {
    grado: string;
    materia: string;
    lapso: string;
    anoEscolar: string;
    onGradoChange?: (grado: string) => void;
    onMateriaChange?: (materia: string) => void;
    availableGrados?: string[];
    availableMaterias?: string[];
}

export function GhostCarChart({
    grado,
    materia,
    lapso,
    anoEscolar,
    onGradoChange,
    onMateriaChange,
    availableGrados = [],
    availableMaterias = [],
}: GhostCarChartProps) {
    const [benchmark, setBenchmark] = useState<HistoricalBenchmark | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBenchmark();
    }, [grado, materia, lapso, anoEscolar]);

    const fetchBenchmark = async () => {
        try {
            setLoading(true);
            const data = await getHistoricalBenchmark(grado, materia, lapso, anoEscolar);
            setBenchmark(data);
        } catch (error) {
            console.error('Error fetching benchmark:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend: 'mejorando' | 'declinando' | 'estable') => {
        switch (trend) {
            case 'mejorando':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'declinando':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'estable':
                return <Minus className="h-4 w-4 text-gray-400" />;
        }
    };

    const getTrendBadgeVariant = (trend: string): 'default' | 'destructive' | 'secondary' => {
        switch (trend) {
            case 'mejorando':
                return 'default';
            case 'declinando':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getTrendLabel = (trend: string): string => {
        const labels = {
            mejorando: 'Mejorando',
            declinando: 'Declinando',
            estable: 'Estable',
        };
        return labels[trend as keyof typeof labels] || trend;
    };

    // Merge current and historical data for the chart
    const chartData = benchmark
        ? benchmark.current.map((curr) => {
            const hist = benchmark.historical.find((h) => h.mes === curr.mes);
            return {
                mes: curr.label || `M${curr.mes}`,
                Actual: curr.promedio,
                Histórico: hist?.promedio || null,
            };
        })
        : [];

    // Calculate average for reference line
    const avgActual = benchmark
        ? benchmark.current.reduce((sum, d) => sum + d.promedio, 0) / benchmark.current.length
        : 0;

    const avgHistorical = benchmark
        ? benchmark.historical.reduce((sum, d) => sum + d.promedio, 0) / benchmark.historical.length
        : 0;

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-80 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!benchmark || (benchmark.current.length === 0 && benchmark.historical.length === 0)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Comparación Histórica (Ghost Car)</CardTitle>
                    <CardDescription>No hay datos históricos disponibles</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">
                        No se encontraron datos para {grado} - {materia} en {lapso}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            {(availableGrados.length > 0 || availableMaterias.length > 0) && (
                <div className="flex gap-4">
                    {availableGrados.length > 0 && onGradoChange && (
                        <Select value={grado} onValueChange={onGradoChange}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Seleccionar grado" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableGrados.map((g) => (
                                    <SelectItem key={g} value={g}>
                                        {g}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {availableMaterias.length > 0 && onMateriaChange && (
                        <Select value={materia} onValueChange={onMateriaChange}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Seleccionar materia" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMaterias.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}

            {/* Chart Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Comparación Histórica (Ghost Car)</CardTitle>
                            <CardDescription>
                                {grado} - {materia} | {lapso} {anoEscolar}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {getTrendIcon(benchmark.trend)}
                            <Badge variant={getTrendBadgeVariant(benchmark.trend)}>
                                {getTrendLabel(benchmark.trend)}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis domain={[0, 20]} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                <p className="font-medium mb-2">{payload[0].payload.mes}</p>
                                                {payload.map((entry, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                        <span className="text-muted-foreground">{entry.name}:</span>
                                                        <span className="font-medium tabular-nums">
                                                            {entry.value !== null ? (entry.value as number).toFixed(2) : 'N/A'}
                                                        </span>
                                                    </div>
                                                ))}
                                                {payload[0].value !== null && payload[1]?.value !== null && (
                                                    <div className="mt-2 pt-2 border-t text-xs">
                                                        <span className="text-muted-foreground">Diferencia: </span>
                                                        <span
                                                            className={`font-medium ${(payload[0].value as number) > (payload[1].value as number)
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600'
                                                                }`}
                                                        >
                                                            {((payload[0].value as number) - (payload[1].value as number) > 0
                                                                ? '+'
                                                                : '') +
                                                                ((payload[0].value as number) - (payload[1].value as number)).toFixed(
                                                                    2
                                                                )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />

                            {/* Reference lines for averages */}
                            <ReferenceLine
                                y={avgActual}
                                stroke="#3b82f6"
                                strokeDasharray="5 5"
                                label={{ value: `Prom. Actual: ${avgActual.toFixed(2)}`, position: 'right' }}
                            />
                            <ReferenceLine
                                y={avgHistorical}
                                stroke="#94a3b8"
                                strokeDasharray="5 5"
                                label={{ value: `Prom. Histórico: ${avgHistorical.toFixed(2)}`, position: 'right' }}
                            />

                            {/* Area between lines */}
                            <defs>
                                <linearGradient id="colorDiff" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor={benchmark.difference > 0 ? '#22c55e' : '#ef4444'}
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={benchmark.difference > 0 ? '#22c55e' : '#ef4444'}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            {/* Lines */}
                            <Line
                                type="monotone"
                                dataKey="Actual"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 5 }}
                                activeDot={{ r: 7 }}
                                name="Actual"
                            />
                            <Line
                                type="monotone"
                                dataKey="Histórico"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 4 }}
                                name="Histórico"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Promedio Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tabular-nums text-blue-600">
                            {avgActual.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Basado en {benchmark.current.length} meses
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Promedio Histórico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tabular-nums text-gray-600">
                            {avgHistorical.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Años anteriores
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Diferencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-3xl font-bold tabular-nums ${benchmark.difference > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                        >
                            {benchmark.difference > 0 ? '+' : ''}
                            {benchmark.difference.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {getTrendIcon(benchmark.trend)}
                            <span className="ml-1">{getTrendLabel(benchmark.trend)}</span>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
