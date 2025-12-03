import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mantener los colores actuales
export const gradeColors: { [key: string]: string } = {
    'A': '#22C55E', // Verde
    'B': '#3B82F6', // Azul
    'C': '#EAB308', // Amarillo
    'D': '#F97316', // Naranja
    'E': '#EF4444', // Rojo
    'SE': '#6B7280', // Gris
    '': '#D1D5DB'
};

export const adaptationColors: { [key: string]: string } = {
    'Reg': '#3B82F6', // Azul
    'AC+': '#22C55E', // Verde
    'AC-': '#EAB308', // Amarillo
    '': '#D1D5DB'
};

interface PieChartData {
    [key: string]: number;
}

interface EnhancedPieChartProps {
    data: PieChartData;
    title: string;
    colors: { [key: string]: string };
    height?: number;
}

const EnhancedPieChart: React.FC<EnhancedPieChartProps> = ({ 
    data, 
    title, 
    colors,
    height = 300 
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const total = Object.values(data).reduce((sum, value) => sum + value, 0);

    if (total === 0) {
        return (
            <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-center text-base font-semibold">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No hay datos para mostrar.</p>
                </CardContent>
            </Card>
        );
    }

    // Transformar datos para recharts
    const chartData = Object.entries(data).map(([key, value]) => ({
        name: key,
        value,
        percentage: ((value / total) * 100).toFixed(1)
    }));

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-background border border-border rounded-lg shadow-lg p-3 z-50">
                    <p className="font-semibold text-sm mb-1">{data.payload.name}</p>
                    <p className="text-xs text-muted-foreground">
                        Cantidad: <span className="font-medium text-foreground">{data.value}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Porcentaje: <span className="font-medium text-foreground">{data.payload.percentage}%</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-lg border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-center text-base font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={activeIndex !== null ? 85 : 80}
                                innerRadius={40}
                                paddingAngle={2}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                                animationDuration={300}
                                style={{ cursor: 'pointer' }}
                            >
                                {chartData.map((entry, index) => {
                                    const isActive = activeIndex === index || hoveredKey === entry.name;
                                    const color = colors[entry.name] || '#D1D5DB';
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            stroke={isActive ? color : 'transparent'}
                                            strokeWidth={isActive ? 3 : 0}
                                            style={{
                                                filter: isActive ? `drop-shadow(0 0 8px ${color}60)` : 'none',
                                                transition: 'all 0.3s ease',
                                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                                transformOrigin: 'center'
                                            }}
                                        />
                                    );
                                })}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    {chartData.map((entry, index) => {
                        const isHovered = hoveredKey === entry.name || activeIndex === index;
                        const color = colors[entry.name] || '#D1D5DB';
                        return (
                            <div
                                key={`detail-${index}`}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 cursor-pointer",
                                    isHovered ? "bg-muted" : "hover:bg-muted/50"
                                )}
                                onMouseEnter={() => {
                                    setHoveredKey(entry.name);
                                    setActiveIndex(index);
                                }}
                                onMouseLeave={() => {
                                    setHoveredKey(null);
                                    setActiveIndex(null);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full transition-all duration-200"
                                        style={{
                                            backgroundColor: color,
                                            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                                            boxShadow: isHovered ? `0 0 8px ${color}60` : 'none'
                                        }}
                                    />
                                    <span className={cn(
                                        "text-sm font-medium transition-colors",
                                        isHovered ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {entry.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-foreground">
                                        {entry.percentage}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({entry.value})
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

interface AdaptationGradeDistributionChartsProps {
    data: { [key: string]: { [key: string]: number } };
}

export const AdaptationGradeDistributionCharts: React.FC<AdaptationGradeDistributionChartsProps> = ({ data }) => {
    return (
        <Card className="mt-6 transition-all duration-200 hover:shadow-lg">
            <CardHeader>
                <CardTitle className="text-center text-lg font-semibold">
                    Distribución de Notas por Tipo de Adaptación
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <EnhancedPieChart
                        data={data['Reg'] || {}}
                        title="Regular"
                        colors={gradeColors}
                    />
                    <EnhancedPieChart
                        data={data['AC+'] || {}}
                        title="AC+"
                        colors={gradeColors}
                    />
                    <EnhancedPieChart
                        data={data['AC-'] || {}}
                        title="AC-"
                        colors={gradeColors}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default EnhancedPieChart;
export { EnhancedPieChart };

