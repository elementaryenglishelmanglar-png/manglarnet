import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetencyRadarChart } from './CompetencyRadarChart';
import { AttendanceScatterPlot } from './AttendanceScatterPlot';
import { EvaluacionAlumno, Alumno } from '@/services/supabaseDataService';

interface PedagogicalDashboardProps {
    students: Alumno[];
    studentEvals: Map<string, EvaluacionAlumno>;
    detallesIndicadores: Map<string, Map<string, string>>; // StudentID -> IndicatorID -> Level (A-E)
    indicators: any[]; // List of indicators to get names/competencies
}

export const PedagogicalDashboard: React.FC<PedagogicalDashboardProps> = ({
    students,
    studentEvals,
    detallesIndicadores,
    indicators
}) => {

    // 1. Prepare Scatter Plot Data (Attendance vs Grade)
    const scatterData = useMemo(() => {
        return students.map(student => {
            const evalData = studentEvals.get(student.id_alumno);
            if (!evalData) return null;

            const attendance = evalData.inasistencias || 0;
            const gradeLiteral = evalData.nota?.toString() || '';

            // Convert literal grade to number for plotting if possible, or just use 0 if not numeric
            // Assuming grades might be A-E or 0-20. If A-E, map to 5-1. If 0-20, use as is.
            let gradeNumber = 0;
            const gradeMap: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };

            if (gradeMap[gradeLiteral]) {
                gradeNumber = gradeMap[gradeLiteral];
            } else {
                gradeNumber = parseFloat(gradeLiteral) || 0;
            }

            return {
                name: `${student.nombres} ${student.apellidos}`,
                attendance,
                grade: gradeNumber,
                gradeLiteral
            };
        }).filter(item => item !== null && (item.attendance > 0 || item.grade > 0));
    }, [students, studentEvals]);

    // 2. Prepare Radar Chart Data (Class Average by Competency/Indicator)
    const radarData = useMemo(() => {
        if (!indicators || indicators.length === 0) return [];

        // Map A-E to 5-1
        const levelMap: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };

        // Aggregate scores by Indicator
        const indicatorScores: Record<string, { sum: number, count: number, name: string }> = {};

        detallesIndicadores.forEach((studentIndicators) => {
            studentIndicators.forEach((level, indicatorId) => {
                const score = levelMap[level] || 0;
                if (score > 0) {
                    if (!indicatorScores[indicatorId]) {
                        const ind = indicators.find(i => i.id_indicador === indicatorId);
                        indicatorScores[indicatorId] = {
                            sum: 0,
                            count: 0,
                            name: ind ? ind.descripcion.substring(0, 15) + '...' : 'Indicador'
                        };
                    }
                    indicatorScores[indicatorId].sum += score;
                    indicatorScores[indicatorId].count += 1;
                }
            });
        });

        return Object.values(indicatorScores).map(item => ({
            subject: item.name,
            A: parseFloat((item.sum / item.count).toFixed(2)),
            fullMark: 5
        }));
    }, [detallesIndicadores, indicators]);

    if (scatterData.length === 0 && radarData.length === 0) {
        return null; // Don't show if no data
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Correlación: Inasistencias vs Nota</CardTitle>
                </CardHeader>
                <CardContent>
                    <AttendanceScatterPlot data={scatterData as any} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Promedio de Indicadores (Clase)</CardTitle>
                </CardHeader>
                <CardContent>
                    <CompetencyRadarChart data={radarData} />
                </CardContent>
            </Card>
        </div>
    );
};
