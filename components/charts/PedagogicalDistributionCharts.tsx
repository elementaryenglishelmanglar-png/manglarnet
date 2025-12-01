import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistributionData {
    independence: { name: string; value: number }[];
    emotion: { name: string; value: number }[];
    efficacy: { name: string; value: number }[];
}

interface PedagogicalDistributionChartsProps {
    data: DistributionData;
}



const getIndependenceColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('alto')) return '#22c55e';
    if (n.includes('medio') || n.includes('regular')) return '#eab308';
    if (n.includes('bajo')) return '#ef4444';
    return '#94a3b8'; // Slate-400 for unknown
};

const getEmotionColor = (name: string) => {
    const n = name.toLowerCase();
    // Positive
    if (['alegre', 'feliz', 'contento', 'entusiasmado', 'tranquilo', 'motivado', 'bien'].some(e => n.includes(e))) return '#22c55e';
    // Negative
    if (['triste', 'enojado', 'molesto', 'frustrado', 'aburrido', 'miedo', 'ansioso', 'mal'].some(e => n.includes(e))) return '#ef4444';
    // Neutral/Mixed
    if (['normal', 'indiferente', 'cansado', 'regular'].some(e => n.includes(e))) return '#eab308';
    return '#94a3b8';
};

const getEfficacyColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('resuelto') || n.includes('eficaz')) return '#22c55e';
    if (n.includes('proceso') || n.includes('parcial')) return '#eab308';
    if (n.includes('ineficaz') || n.includes('no resuelto')) return '#ef4444';
    return '#94a3b8';
};

export const PedagogicalDistributionCharts: React.FC<PedagogicalDistributionChartsProps> = ({ data }) => {

    const renderPieChart = (title: string, chartData: { name: string; value: number }[], colorFn: (name: string) => string) => (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colorFn(entry.name)} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                            <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sin datos</div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* 1. Nivel de Independencia (Pie) */}
            {renderPieChart("Nivel de Independencia", data.independence, getIndependenceColor)}

            {/* 2. Estado Emocional (Pie) */}
            {renderPieChart("Estado Emocional", data.emotion, getEmotionColor)}

            {/* 3. Eficacia Acciones (Bar) */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-center">Eficacia Acciones Previas</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-[200px]">
                    {data.efficacy.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.efficacy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {data.efficacy.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getEfficacyColor(entry.name)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sin datos</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
