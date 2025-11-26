import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { maestraIndicadoresService, type Clase } from '../../services/supabaseDataService';
import { PlusIcon, DeleteIcon, SaveIcon } from '../Icons';

interface CargarCompetenciasProps {
    clases: Clase[];
    onSaveComplete: () => void;
}

// Grade color mapping
const getGradeColor = (grade: string): string => {
    const gradeColors: { [key: string]: string } = {
        '1er Grado': '#00ff01',
        '2do Grado': '#99cdff',
        '3er Grado': '#ff00fe',
        '4to Grado': '#99cdff',
        '5to Grado': '#3e85c7',
        '6to Grado': '#00ffff',
    };
    return gradeColors[grade] || '#F3F4F6';
};

export const CargarCompetencias: React.FC<CargarCompetenciasProps> = ({ clases, onSaveComplete }) => {
    const [selectedClase, setSelectedClase] = useState<string>('');
    const [competenciaDescripcion, setCompetenciaDescripcion] = useState<string>('');
    const [indicadores, setIndicadores] = useState<string[]>(['']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Define all available subjects by level
    const ASIGNATURAS_POR_NIVEL: { [key: string]: string[] } = {
        "Nivel Primaria": [
            "Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Proyecto", "Inglés",
            "Evaluación", "Francés", "Literatura", "Música", "Arte", "Tecnología",
            "Ajedrez", "Ed. Física y Deporte", "Valores"
        ],
    };

    const GRADOS = [
        "1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"
    ];

    // English levels for grades 5-6
    const ENGLISH_LEVELS = ["Basic", "Lower", "Upper"];

    // Generate all possible grade-subject combinations
    const getAllPossibleClases = () => {
        const allClases: Array<{ id: string; grado: string; materia: string; nivel_ingles?: string; isVirtual: boolean }> = [];

        // Add existing classes
        clases.forEach(clase => {
            allClases.push({
                id: clase.id_clase,
                grado: clase.grado_asignado,
                materia: clase.nombre_materia,
                nivel_ingles: clase.nivel_ingles || undefined,
                isVirtual: false
            });
        });

        // Generate virtual classes for all grade-subject combinations
        GRADOS.forEach(grado => {
            const subjects = ASIGNATURAS_POR_NIVEL["Nivel Primaria"] || [];

            subjects.forEach(materia => {
                // Special handling for English in grades 5-6
                if (materia === "Inglés" && ["5to Grado", "6to Grado"].includes(grado)) {
                    ENGLISH_LEVELS.forEach(level => {
                        const exists = allClases.some(c =>
                            c.grado === grado &&
                            c.materia.toLowerCase().includes('inglés') &&
                            c.nivel_ingles === level
                        );
                        if (!exists) {
                            allClases.push({
                                id: `virtual-${grado}-ingles-${level}`,
                                grado: grado,
                                materia: `Inglés (${level})`,
                                nivel_ingles: level,
                                isVirtual: true
                            });
                        }
                    });
                } else {
                    // Check if this combination already exists
                    const exists = allClases.some(c =>
                        c.grado === grado &&
                        c.materia === materia
                    );
                    if (!exists) {
                        allClases.push({
                            id: `virtual-${grado}-${materia.replace(/\s+/g, '-')}`,
                            grado: grado,
                            materia: materia,
                            isVirtual: true
                        });
                    }
                }
            });
        });

        return allClases;
    };

    const allPossibleClases = getAllPossibleClases();

    // Find selected class data (could be real or virtual)
    const selectedClaseData = clases.find(c => c.id_clase === selectedClase);
    const selectedVirtualClase = allPossibleClases.find(c => c.id === selectedClase);
    const gradeColor = selectedClaseData
        ? getGradeColor(selectedClaseData.grado_asignado)
        : selectedVirtualClase
            ? getGradeColor(selectedVirtualClase.grado)
            : '#F3F4F6';

    // Group English classes for better UX
    const getGroupedClases = () => {
        const grouped: { [key: string]: typeof allPossibleClases } = {};

        allPossibleClases.forEach(clase => {
            const isEnglish = clase.materia.toLowerCase().includes('inglés') ||
                clase.materia.toLowerCase().includes('ingles');

            // Check if it's grades 1-4
            const isGrades1to4 = ['1er Grado', '2do Grado', '3er Grado', '4to Grado'].includes(clase.grado);

            // Check if it's grades 5-6 with level
            const isGrades5to6 = ['5to Grado', '6to Grado'].includes(clase.grado);

            if (isEnglish && isGrades1to4) {
                // Group all English routines for grades 1-4 under "Inglés"
                const groupKey = `${clase.grado} - Inglés`;
                if (!grouped[groupKey]) {
                    grouped[groupKey] = [];
                }
                grouped[groupKey].push(clase);
            } else if (isEnglish && isGrades5to6 && clase.nivel_ingles) {
                // For grades 5-6, show by English level
                const groupKey = `${clase.grado} - Inglés (${clase.nivel_ingles})`;
                if (!grouped[groupKey]) {
                    grouped[groupKey] = [];
                }
                grouped[groupKey].push(clase);
            } else {
                // Regular classes, no grouping
                const groupKey = `${clase.grado} - ${clase.materia}`;
                grouped[groupKey] = [clase];
            }
        });

        return grouped;
    };

    const groupedClases = getGroupedClases();

    const handleAddIndicador = () => {
        setIndicadores([...indicadores, '']);
    };

    const handleRemoveIndicador = (index: number) => {
        if (indicadores.length > 1) {
            setIndicadores(indicadores.filter((_, i) => i !== index));
        }
    };

    const handleIndicadorChange = (index: number, value: string) => {
        const newIndicadores = [...indicadores];
        newIndicadores[index] = value;
        setIndicadores(newIndicadores);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validations
        if (!selectedClase) {
            setError('Por favor selecciona una clase');
            return;
        }

        if (!competenciaDescripcion.trim()) {
            setError('Por favor ingresa la descripción de la competencia');
            return;
        }

        const validIndicadores = indicadores.filter(ind => ind.trim() !== '');
        if (validIndicadores.length === 0) {
            setError('Por favor agrega al menos un indicador');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Create Competency
            const competenciaData = {
                id_clase: selectedClase,
                categoria: 'Competencia' as const,
                descripcion: competenciaDescripcion.trim(),
                orden: 1,
                activo: true,
            };

            const createdCompetencia = await maestraIndicadoresService.create(competenciaData);

            // 2. Create Indicators
            const indicadoresData = validIndicadores.map((indText, idx) => ({
                id_clase: selectedClase,
                categoria: 'Indicador' as const,
                descripcion: indText.trim(),
                orden: idx + 1,
                activo: true,
                id_padre: createdCompetencia.id_indicador,
            }));

            await maestraIndicadoresService.createBulk(indicadoresData);

            setSuccess(`✅ Competencia creada exitosamente con ${validIndicadores.length} indicadores. Código: ${createdCompetencia.codigo_unico || 'Generado automáticamente'}`);

            // Reset form
            setSelectedClase('');
            setCompetenciaDescripcion('');
            setIndicadores(['']);

            // Notify parent to reload
            setTimeout(() => {
                onSaveComplete();
                setSuccess(null);
            }, 2000);

        } catch (err: any) {
            console.error('Error saving competencia:', err);
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setSelectedClase('');
        setCompetenciaDescripcion('');
        setIndicadores(['']);
        setError(null);
        setSuccess(null);
    };

    return (
        <Card>
            <CardHeader style={{
                backgroundColor: selectedClaseData ? `${gradeColor}15` : undefined,
                borderLeft: selectedClaseData ? `4px solid ${gradeColor}` : undefined
            }}>
                <CardTitle className="flex items-center gap-2">
                    Cargar Nueva Competencia
                    {(selectedClaseData || selectedVirtualClase) && (
                        <Badge style={{ backgroundColor: gradeColor, color: '#000' }}>
                            {selectedClaseData
                                ? `${selectedClaseData.grado_asignado} - ${selectedClaseData.nombre_materia}`
                                : selectedVirtualClase
                                    ? `${selectedVirtualClase.grado} - ${selectedVirtualClase.materia}`
                                    : ''}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Clase Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="clase">Clase (Grado - Asignatura) *</Label>
                        <select
                            id="clase"
                            value={selectedClase}
                            onChange={(e) => setSelectedClase(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        >
                            <option value="">Selecciona una clase...</option>
                            {Object.entries(groupedClases)
                                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                .map(([groupName, clasesInGroup]) => {
                                    const firstClase = clasesInGroup[0];
                                    const color = getGradeColor(firstClase.grado);

                                    // If there's only one class in the group, show it directly
                                    if (clasesInGroup.length === 1) {
                                        return (
                                            <option
                                                key={firstClase.id}
                                                value={firstClase.id}
                                                style={{ backgroundColor: `${color}20` }}
                                            >
                                                {groupName}
                                            </option>
                                        );
                                    }

                                    // If there are multiple classes (English routines), show as optgroup
                                    return (
                                        <optgroup key={groupName} label={groupName}>
                                            {clasesInGroup.map(clase => (
                                                <option
                                                    key={clase.id}
                                                    value={clase.id}
                                                    style={{ backgroundColor: `${color}20` }}
                                                >
                                                    {clase.materia}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                        </select>
                    </div>

                    {/* Competencia Description */}
                    <div className="space-y-2">
                        <Label htmlFor="competencia">Descripción de la Competencia *</Label>
                        <Input
                            id="competencia"
                            type="text"
                            value={competenciaDescripcion}
                            onChange={(e) => setCompetenciaDescripcion(e.target.value)}
                            placeholder="Ej: Resuelve problemas de álgebra básica"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            El código único se generará automáticamente al guardar
                        </p>
                    </div>

                    {/* Indicadores */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Indicadores *</Label>
                            <Button
                                type="button"
                                onClick={handleAddIndicador}
                                size="sm"
                                variant="outline"
                            >
                                <PlusIcon />
                                <span className="ml-2">Agregar Indicador</span>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {indicadores.map((indicador, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={indicador}
                                            onChange={(e) => handleIndicadorChange(index, e.target.value)}
                                            placeholder={`Indicador ${index + 1}`}
                                            required={index === 0}
                                        />
                                    </div>
                                    {indicadores.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => handleRemoveIndicador(index)}
                                            size="sm"
                                            variant="ghost"
                                        >
                                            <DeleteIcon className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Agrega al menos un indicador. Puedes agregar más haciendo clic en "Agregar Indicador"
                        </p>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="border-green-500 bg-green-50">
                            <AlertDescription className="text-green-800">{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            onClick={handleCancel}
                            variant="outline"
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                'Guardando...'
                            ) : (
                                <>
                                    <SaveIcon />
                                    <span className="ml-2">Guardar Competencia</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
