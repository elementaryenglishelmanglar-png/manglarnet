import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { maestraIndicadoresService, type MaestraIndicador, type Clase } from '../../services/supabaseDataService';
import { ImportIndicadoresExcel } from './ImportIndicadoresExcel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PlusIcon, DeleteIcon, EditIcon } from '../Icons';
import { Badge } from '../ui/badge';

interface GestionIndicadoresProps {
    clases: Clase[];
}

export const GestionIndicadores: React.FC<GestionIndicadoresProps> = ({ clases }) => {
    const [indicadores, setIndicadores] = useState<MaestraIndicador[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClaseFilter, setSelectedClaseFilter] = useState<string>('all');

    const loadIndicadores = async () => {
        setIsLoading(true);
        try {
            const data = await maestraIndicadoresService.getAll();
            setIndicadores(data);
        } catch (error) {
            console.error('Error loading indicators:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadIndicadores();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este indicador?')) return;

        try {
            await maestraIndicadoresService.delete(id);
            await loadIndicadores();
        } catch (error: any) {
            alert('Error al eliminar indicador: ' + error.message);
        }
    };

    const filteredIndicadores = selectedClaseFilter === 'all'
        ? indicadores
        : indicadores.filter(ind => ind.id_clase === selectedClaseFilter);

    // Group by clase
    const indicadoresPorClase: { [key: string]: MaestraIndicador[] } = {};
    filteredIndicadores.forEach(ind => {
        if (!indicadoresPorClase[ind.id_clase]) {
            indicadoresPorClase[ind.id_clase] = [];
        }
        indicadoresPorClase[ind.id_clase].push(ind);
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Indicadores Pedagógicos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Administra los indicadores que se utilizarán para evaluar el desempeño detallado de los estudiantes.
                    </p>
                </CardHeader>
            </Card>

            <Tabs defaultValue="view" className="w-full">
                <TabsList>
                    <TabsTrigger value="view">Ver Indicadores</TabsTrigger>
                    <TabsTrigger value="import">Importar desde Excel</TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="space-y-4">
                    {/* Filter */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <label className="font-semibold text-sm">Filtrar por clase:</label>
                                <select
                                    className="border rounded px-3 py-2 flex-1 max-w-md"
                                    value={selectedClaseFilter}
                                    onChange={(e) => setSelectedClaseFilter(e.target.value)}
                                >
                                    <option value="all">Todas las clases</option>
                                    {clases
                                        .sort((a, b) => a.grado_asignado.localeCompare(b.grado_asignado))
                                        .map(clase => (
                                            <option key={clase.id_clase} value={clase.id_clase}>
                                                {clase.grado_asignado} - {clase.nombre_materia}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Indicadores List */}
                    {isLoading ? (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                Cargando indicadores...
                            </CardContent>
                        </Card>
                    ) : filteredIndicadores.length === 0 ? (
                        <Alert>
                            <AlertDescription>
                                No hay indicadores registrados aún. Usa la pestaña "Importar desde Excel" para cargar indicadores.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        Object.entries(indicadoresPorClase).map(([idClase, inds]) => {
                            const clase = clases.find(c => c.id_clase === idClase);
                            if (!clase) return null;

                            return (
                                <Card key={idClase}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {clase.grado_asignado} - {clase.nombre_materia}
                                            <Badge variant="secondary" className="ml-2">{inds.length} indicadores</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {inds
                                                .sort((a, b) => a.orden - b.orden)
                                                .map((ind) => (
                                                    <div
                                                        key={ind.id_indicador}
                                                        className="flex items-start justify-between gap-4 p-3 border rounded hover:bg-muted/50"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-mono text-sm text-muted-foreground">
                                                                    #{ind.orden}
                                                                </span>
                                                                <Badge variant={ind.categoria === 'Competencia' ? 'default' : 'outline'}>
                                                                    {ind.categoria}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm">{ind.descripcion}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(ind.id_indicador)}
                                                            >
                                                                <DeleteIcon className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </TabsContent>

                <TabsContent value="import">
                    <ImportIndicadoresExcel clases={clases} onImportComplete={loadIndicadores} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
