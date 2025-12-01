'use client';

import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Download, AlertCircle, Info } from 'lucide-react';
import { analyticsService } from '@/services/analyticsDataService';
import type { StudentWithRisk, FilterOptions } from '@/types/analytics';

interface RiskTelemetryTableProps {
    filters?: FilterOptions;
}

export function RiskTelemetryTable({ filters }: RiskTelemetryTableProps) {
    const [students, setStudents] = useState<StudentWithRisk[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'riskScore' | 'nombre'>('riskScore');
    const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, [filters]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const data = await analyticsService.getStudentsWithRisk(filters);
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students with risk:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level: string): string => {
        switch (level) {
            case 'Crítico':
                return 'bg-red-500';
            case 'Alto':
                return 'bg-orange-500';
            case 'Medio':
                return 'bg-yellow-500';
            case 'Bajo':
                return 'bg-lime-500';
            case 'Mínimo':
                return 'bg-green-500';
            default:
                return 'bg-gray-400';
        }
    };

    const getRiskBadgeVariant = (level: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
        switch (level) {
            case 'Crítico':
            case 'Alto':
                return 'destructive';
            case 'Medio':
                return 'default';
            default:
                return 'secondary';
        }
    };

    const exportToCSV = () => {
        const headers = ['Nombre', 'Apellido', 'Grado', 'Risk Score', 'Nivel de Riesgo', 'Promedio', 'Asistencia'];
        const rows = filteredAndSortedStudents.map((s) => [
            s.nombres,
            s.apellidos,
            s.salon,
            s.riskScore.toFixed(2),
            s.riskLevel,
            s.factores.promedio_notas.toFixed(2),
            s.factores.asistencia_promedio.toFixed(1) + '%',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `risk_telemetry_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredAndSortedStudents = students
        .filter((s) => {
            if (filterRiskLevel !== 'all' && s.riskLevel !== filterRiskLevel) {
                return false;
            }
            if (searchTerm) {
                const fullName = `${s.nombres} ${s.apellidos}`.toLowerCase();
                return fullName.includes(searchTerm.toLowerCase());
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'riskScore') {
                return b.riskScore - a.riskScore; // Descending
            } else {
                return `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`);
            }
        });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Calculando risk scores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <Input
                        placeholder="Buscar estudiante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-xs"
                    />

                    <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por riesgo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los niveles</SelectItem>
                            <SelectItem value="Crítico">Crítico</SelectItem>
                            <SelectItem value="Alto">Alto</SelectItem>
                            <SelectItem value="Medio">Medio</SelectItem>
                            <SelectItem value="Bajo">Bajo</SelectItem>
                            <SelectItem value="Mínimo">Mínimo</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'riskScore' | 'nombre')}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="riskScore">Risk Score (↓)</SelectItem>
                            <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={exportToCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                </Button>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
                Mostrando {filteredAndSortedStudents.length} de {students.length} estudiantes
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Grado</TableHead>
                            <TableHead className="text-center">Risk Score</TableHead>
                            <TableHead className="text-center">Nivel de Riesgo</TableHead>
                            <TableHead className="text-center">Factores</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No se encontraron estudiantes
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedStudents.map((student) => (
                                <TableRow key={student.id_alumno} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        {student.apellidos}, {student.nombres}
                                    </TableCell>
                                    <TableCell>{student.salon}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-lg font-bold tabular-nums">
                                                {student.riskScore.toFixed(1)}
                                            </span>
                                            <Progress
                                                value={student.riskScore}
                                                className="h-2 w-24"
                                                indicatorClassName={getRiskColor(student.riskLevel)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getRiskBadgeVariant(student.riskLevel)}>
                                            {student.riskLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <div className="space-y-2 text-sm">
                                                        <div className="font-semibold border-b pb-1">
                                                            Factores de Riesgo
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-muted-foreground">Promedio:</span>
                                                                <span className="ml-1 font-medium">
                                                                    {student.factores.promedio_notas.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Asistencia:</span>
                                                                <span className="ml-1 font-medium">
                                                                    {student.factores.asistencia_promedio.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Evaluaciones:</span>
                                                                <span className="ml-1 font-medium">
                                                                    {student.factores.total_evaluaciones}
                                                                </span>
                                                            </div>
                                                            {student.factores.evaluaciones_reprobadas !== undefined && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Reprobadas:</span>
                                                                    <span className="ml-1 font-medium text-red-600">
                                                                        {student.factores.evaluaciones_reprobadas}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(student.factores.promedio_bajo ||
                                                            student.factores.asistencia_critica ||
                                                            student.factores.problemas_emocionales) && (
                                                                <div className="pt-2 border-t">
                                                                    <div className="font-semibold text-xs mb-1">Alertas:</div>
                                                                    <div className="space-y-1">
                                                                        {student.factores.promedio_bajo && (
                                                                            <div className="flex items-center gap-1 text-xs text-red-600">
                                                                                <AlertCircle className="h-3 w-3" />
                                                                                Promedio bajo
                                                                            </div>
                                                                        )}
                                                                        {student.factores.asistencia_critica && (
                                                                            <div className="flex items-center gap-1 text-xs text-red-600">
                                                                                <AlertCircle className="h-3 w-3" />
                                                                                Asistencia crítica
                                                                            </div>
                                                                        )}
                                                                        {student.factores.problemas_emocionales && (
                                                                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                                                                                <AlertCircle className="h-3 w-3" />
                                                                                Problemas emocionales
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Risk Distribution Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                {['Crítico', 'Alto', 'Medio', 'Bajo', 'Mínimo'].map((level) => {
                    const count = students.filter((s) => s.riskLevel === level).length;
                    const percentage = students.length > 0 ? (count / students.length) * 100 : 0;

                    return (
                        <div key={level} className="text-center">
                            <div className="text-2xl font-bold tabular-nums">{count}</div>
                            <div className="text-xs text-muted-foreground">{level}</div>
                            <div className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
