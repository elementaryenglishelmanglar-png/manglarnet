import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

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

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="attendance" name="Inasistencias" unit="">
                        <Label value="Inasistencias (Cant.)" offset={-10} position="insideBottom" />
                    </XAxis>
                    <YAxis type="number" dataKey="grade" name="Nota" unit="">
                        <Label value="Nota (Escala Numérica)" angle={-90} position="insideLeft" />
                    </YAxis>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white p-2 border rounded shadow-md text-xs">
                                    <p className="font-bold">{data.name}</p>
                                    <p>Inasistencias: {data.attendance}</p>
                                    <p>Nota: {data.gradeLiteral}</p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <Scatter name="Estudiantes" data={data} fill="#82ca9d" />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
