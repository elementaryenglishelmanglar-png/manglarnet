import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface CompetencyBarChartProps {
    data: {
        subject: string; // Indicator Name
        A: number; // Average Score (1-5)
        fullMark: number;
    }[];
}

export const CompetencyBarChart: React.FC<CompetencyBarChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No hay datos suficientes para el gráfico.</div>;
    }

    // Sort data by score descending for better visualization
    const sortedData = [...data].sort((a, b) => b.A - a.A);

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={sortedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} hide />
                    <YAxis
                        type="category"
                        dataKey="subject"
                        width={200}
                        tick={{ fontSize: 13, fill: '#374151' }}
                        interval={0}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-3 border rounded shadow-md text-sm max-w-[250px]">
                                        <p className="font-bold mb-1">{data.subject}</p>
                                        <p>Promedio: <span className="font-semibold text-blue-600">{data.A.toFixed(2)}</span> / 5.0</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="A" radius={[0, 4, 4, 0]} barSize={24}>
                        {sortedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.A >= 4.0 ? '#22c55e' : entry.A >= 3.0 ? '#eab308' : '#ef4444'} />
                        ))}
                        <LabelList dataKey="A" position="right" formatter={(val: any) => Number(val).toFixed(1)} fontSize={12} fontWeight="bold" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
