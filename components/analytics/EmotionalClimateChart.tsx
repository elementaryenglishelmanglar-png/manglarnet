'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, Loader2 } from 'lucide-react';
import { analyzeSentiment } from '@/services/analyticsEngine';
import type { SentimentInput, SentimentAnalysis } from '@/types/analytics';

interface EmotionalClimateChartProps {
    observaciones: SentimentInput[];
    idMinuta: string;
}

export function EmotionalClimateChart({ observaciones, idMinuta }: EmotionalClimateChartProps) {
    const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await analyzeSentiment(observaciones, idMinuta);

            if (result) {
                setAnalysis(result);
            } else {
                setError('No se pudo completar el análisis. Intenta nuevamente.');
            }
        } catch (err) {
            console.error('Error analyzing sentiment:', err);
            setError('Error al conectar con el servicio de IA.');
        } finally {
            setLoading(false);
        }
    };

    const getEmotionColor = (emotion: string): string => {
        const colors: Record<string, string> = {
            enfocado: '#22c55e',
            participativo: '#10b981',
            ansioso: '#ef4444',
            apatia: '#dc2626',
            distraido: '#f59e0b',
            cansado: '#eab308',
        };
        return colors[emotion.toLowerCase()] || '#94a3b8';
    };

    const getScoreColor = (score: number): string => {
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
        if (score >= 70) return 'default';
        if (score >= 50) return 'secondary';
        return 'destructive';
    };

    const chartData = analysis
        ? Object.entries(analysis.climaEmocional).map(([key, value]) => ({
            emotion: key.charAt(0).toUpperCase() + key.slice(1),
            count: value,
            color: getEmotionColor(key),
        }))
        : [];

    return (
        <div className="space-y-6">
            {/* Header with Analyze Button */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Análisis de Clima Emocional</CardTitle>
                            <CardDescription>
                                Análisis con IA de {observaciones.length} observaciones de estudiantes
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || observaciones.length === 0}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analizando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Analizar con IA
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-sm text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results */}
            {analysis && !loading && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Emotional Distribution Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribución Emocional</CardTitle>
                            <CardDescription>Cantidad de estudiantes por estado emocional</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="emotion" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Estudiantes">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="space-y-6">
                        {/* Positive Score Gauge */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Score de Clima Positivo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className={`text-5xl font-bold tabular-nums ${getScoreColor(analysis.scorePositivo)}`}>
                                        {analysis.scorePositivo.toFixed(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${analysis.scorePositivo >= 70
                                                        ? 'bg-green-500'
                                                        : analysis.scorePositivo >= 50
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${analysis.scorePositivo}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Basado en {analysis.totalObservaciones} observaciones
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Predominant Sentiment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Sentimiento Predominante</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-12 w-12 rounded-full"
                                        style={{ backgroundColor: getEmotionColor(analysis.sentimientoPredominante.toLowerCase()) }}
                                    />
                                    <div>
                                        <div className="text-2xl font-bold">{analysis.sentimientoPredominante}</div>
                                        <p className="text-sm text-muted-foreground">
                                            Estado emocional más común
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Keywords Cloud */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Palabras Clave</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.palabrasClave.slice(0, 10).map((palabra, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-sm"
                                            style={{
                                                fontSize: `${Math.max(0.75, 1 - index * 0.05)}rem`,
                                            }}
                                        >
                                            {palabra}
                                        </Badge>
                                    ))}
                                </div>
                                {analysis.palabrasClave.length > 10 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        +{analysis.palabrasClave.length - 10} palabras más
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!analysis && !loading && !error && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">Análisis de Sentimiento con IA</p>
                        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                            Haz clic en "Analizar con IA" para obtener un análisis detallado del clima emocional
                            del grupo basado en las observaciones de los estudiantes.
                        </p>
                        {observaciones.length === 0 && (
                            <Badge variant="outline" className="text-xs">
                                No hay observaciones disponibles
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Emotional Distribution Grid */}
            {analysis && (
                <Card>
                    <CardHeader>
                        <CardTitle>Desglose Detallado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(analysis.climaEmocional).map(([emotion, count]) => (
                                <div
                                    key={emotion}
                                    className="flex items-center gap-3 p-3 rounded-lg border"
                                >
                                    <div
                                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: getEmotionColor(emotion) }}
                                    >
                                        {count}
                                    </div>
                                    <div>
                                        <div className="font-medium capitalize">{emotion}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {((count / analysis.totalObservaciones) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
