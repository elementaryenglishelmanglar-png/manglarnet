// Panel de Desglose de Indicadores para Clinical-Pedagogical Diagnostic System
// Este código debe integrarse dentro del componente EvaluationView

// 1. AGREGAR estos useEffects y handlers despues de los existentes en EvaluationView:

// Load indicators when class/subject is selected
useEffect(() => {
    if (filters.grado && filters.materia) {
        const claseSeleccionada = clases.find(
            c => c.grado_asignado === filters.grado && c.nombre_materia === filters.materia
        );
        if (claseSeleccionada) {
            maestraIndicadoresService.getByClase(claseSeleccionada.id_clase)
                .then(setIndicadoresDisponibles)
                .catch(err => console.error('Error loading indicators:', err));
        } else {
            setIndicadoresDisponibles([]);
        }
    } else {
        setIndicadoresDisponibles([]);
    }
}, [filters.grado, filters.materia, clases]);

// Handler to toggle student detail panel
const toggleExpandStudent = (idAlumno: string) => {
    setExpandedStudents(prev => {
        const newSet = new Set(prev);
        if (newSet.has(idAlumno)) {
            newSet.delete(idAlumno);
        } else {
            newSet.add(idAlumno);
        }
        return newSet;
    });
};

// Handler to update indicator level for a student
const handleIndicadorChange = (idAlumno: string, idIndicador: string, nivel: number) => {
    setDetallesIndicadores(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(idAlumno)) {
            newMap.set(idAlumno, new Map());
        }
        const studentMap = newMap.get(idAlumno)!;
        studentMap.set(idIndicador, nivel);
        return newMap;
    });
};

// 2. EN LA TABLA DE ALUMNOS, agregar este header después de "Observaciones":
<th className="px-4 py-3 text-left">Detalle</th>

// 3. EN EL TBODY, agregar esta columna para cada alumno después de las observaciones:
<td className="px-4 py-2">
    {indicadoresDisponibles.length > 0 && (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleExpandStudent(student.id_alumno)}
        >
            {expandedStudents.has(student.id_alumno) ? 'Ocultar ▲' : 'Ver Detalle 🔍'}
        </Button>
    )}
</td>

// 4. DESPUÉS DE CADA </tr> de alumno, agregar este panel desplegable:
{
    expandedStudents.has(student.id_alumno) && indicadoresDisponibles.length > 0 && (
        <tr>
            <td colSpan={6} className="bg-muted/30">
                <div className="p-6 space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="text-primary">📊</span>
                        Evaluación Detallada: {student.nombres} {student.apellidos}
                    </h4>

                    <div className="border rounded-lg p-4 bg-background">
                        <p className="text-sm text-muted-foreground mb-4">
                            Evalúa cada indicador en escala 1-5:
                            <span className="ml-2 font-semibold">1=No logrado</span> •
                            <span className="ml-1 font-semibold">3=En desarrollo</span> •
                            <span className="ml-1 font-semibold">5=Logrado con excelencia</span>
                        </p>

                        <div className="space-y-3">
                            {indicadoresDisponibles.map((indicador, idx) => {
                                const currentValue = detallesIndicadores.get(student.id_alumno)?.get(indicador.id_indicador) || 0;

                                return (
                                    <div key={indicador.id_indicador} className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                            {idx + 1}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{indicador.descripcion}</p>
                                            {indicador.categoria && (
                                                <span className="text-xs text-muted-foreground">{indicador.categoria}</span>
                                            )}
                                        </div>

                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(nivel => (
                                                <button
                                                    key={nivel}
                                                    type="button"
                                                    onClick={() => handleIndicadorChange(student.id_alumno, indicador.id_indicador, nivel)}
                                                    className={`w-10 h-10 rounded-md border-2 font-semibold transition-all ${currentValue === nivel
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-md scale-110'
                                                            : 'bg-background border-border hover:border-primary/50 hover:bg-muted'
                                                        }`}
                                                >
                                                    {nivel}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    )
}

// 5. AGREGAR SECTION DE DATOS BLANDOS antes de la sección de IA (después de la tabla principal):
<Card className="mt-6">
    <CardHeader>
        <CardTitle>Datos de Contexto (Opcional)</CardTitle>
        <p className="text-sm text-muted-foreground">
            Información complementaria sobre el desempeño general del grupo en esta evaluación
        </p>
    </CardHeader>
    <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nivel de Independencia */}
            <div className="space-y-2">
                <Label htmlFor="nivel-independencia">Nivel de Independencia</Label>
                <select
                    id="nivel-independencia"
                    value={softData.nivel_independencia}
                    onChange={(e) => setSoftData(prev => ({
                        ...prev,
                        nivel_independencia: e.target.value as any
                    }))}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">Seleccionar...</option>
                    <option value="Autónomo">Autónomo</option>
                    <option value="Apoyo Parcial">Apoyo Parcial</option>
                    <option value="Apoyo Total">Apoyo Total</option>
                </select>
            </div>

            {/* Estado Emocional */}
            <div className="space-y-2">
                <Label htmlFor="estado-emocional">Estado Emocional</Label>
                <select
                    id="estado-emocional"
                    value={softData.estado_emocional}
                    onChange={(e) => setSoftData(prev => ({
                        ...prev,
                        estado_emocional: e.target.value as any
                    }))}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">Seleccionar...</option>
                    <option value="Enfocado">Enfocado</option>
                    <option value="Ansioso">Ansioso</option>
                    <option value="Distraído">Distraído</option>
                    <option value="Participativo">Participativo</option>
                </select>
            </div>

            {/* Eficacia de Acción Anterior */}
            <div className="space-y-2">
                <Label htmlFor="eficacia-accion">Eficacia de Acción Anterior</Label>
                <select
                    id="eficacia-accion"
                    value={softData.eficacia_accion_anterior}
                    onChange={(e) => setSoftData(prev => ({
                        ...prev,
                        eficacia_accion_anterior: e.target.value as any
                    }))}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">Seleccionar...</option>
                    <option value="Resuelto">Resuelto</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Ineficaz">Ineficaz</option>
                </select>
            </div>
        </div>
    </CardContent>
</Card>

// NOTAS:
// - El handleSaveMinuta ya está actualizado para guardar todo esto
// - Los estados ya fueron agregados al componente
// - Solo falta integrar el JSX en los lugares indicados en EvaluationView
