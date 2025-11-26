import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface IndicadorRadarData {
    indicador: string;
    valor: number; // 1-5 scale
    fullMark: number;
}

interface AlumnoRadarChartProps {
    indicadores: IndicadorRadarData[];
    title?: string;
    subtitulo?: string;
}

export const AlumnoRadarChart: React.FC<AlumnoRadarChartProps> = ({
    indicadores,
    title = "Radar Pedagógico",
    subtitulo
}) => {
    if (!indicadores || indicadores.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        No hay datos de indicadores para mostrar en el radar pedagógico.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={indicadores}>
                        <PolarGrid />
                        <PolarAngleAxis
                            dataKey="indicador"
                            tick={{ fill: '#666', fontSize: 12 }}
                            style={{ maxWidth: '150px' }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 5]}
                            tick={{ fill: '#666' }}
                        />
                        <Radar
                            name="Nivel de Logro"
                            dataKey="valor"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px'
                            }}
                        />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">Interpretación del Radar:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Áreas hacia afuera</strong>: Fortalezas del estudiante (nivel 4-5)</li>
                        <li><strong>Áreas hacia el centro</strong>: Debilidades que requieren apoyo (nivel 1-2)</li>
                        <li><strong>Nivel 3</strong>: Desempeño en proceso, en desarrollo</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};
