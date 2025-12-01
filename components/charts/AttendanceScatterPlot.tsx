import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Cell } from 'recharts';

interface AttendanceScatterPlotProps {
    data: {
        attendance: number; // Count of absences
        grade: number; // Numeric grade (converted from literal if needed)
        name: string;
        gradeLiteral: string;
    }[];
}

export const AttendanceScatterPlot: React.FC<AttendanceScatterPlotProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No hay datos suficientes para el gráfico.</div>;
    }

    const getColor = (grade: number) => {
        // Simple heuristic to detect scale. If any grade > 5, assume 0-20 scale.
        // However, here we check per item. Ideally we check the max of the dataset, but per item is safe enough if mixed.
        // Actually, let's just check the value itself.
        if (grade > 5) {
            if (grade >= 14) return '#22c55e'; // Good
            if (grade >= 11) return '#eab308'; // Regular
            return '#ef4444'; // Bad
        }
        // 0-5 Scale
        if (grade >= 4.0) return '#22c55e';
        if (grade >= 3.0) return '#eab308';
        return '#ef4444';
    };

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="attendance" name="Inasistencias" unit="">
                        <Label value="Inasistencias (Cant.)" offset={-10} position="insideBottom" style={{ fontSize: '12px', fill: '#6b7280' }} />
                    </XAxis>
                    <YAxis type="number" dataKey="grade" name="Nota" unit="" tick={{ fontSize: 12 }}>
                        <Label value="Nota (Escala Numérica)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                    </YAxis>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white p-3 border rounded shadow-md text-sm">
                                    <p className="font-bold">{data.name}</p>
                                    <p>Inasistencias: {data.attendance}</p>
                                    <p>Nota: <span style={{ color: getColor(data.grade), fontWeight: 'bold' }}>{data.gradeLiteral}</span></p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <Scatter name="Estudiantes" data={data}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry.grade)} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
