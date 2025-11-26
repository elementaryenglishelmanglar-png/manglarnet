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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const PedagogicalDistributionCharts: React.FC<PedagogicalDistributionChartsProps> = ({ data }) => {

    const renderPieChart = (title: string, chartData: { name: string; value: number }[]) => (
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
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
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
            {renderPieChart("Nivel de Independencia", data.independence)}

            {/* 2. Estado Emocional (Pie) */}
            {renderPieChart("Estado Emocional", data.emotion)}

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
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]}>
                                    {data.efficacy.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Ineficaz' ? '#f87171' : entry.name === 'Resuelto' ? '#4ade80' : '#fbbf24'} />
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
