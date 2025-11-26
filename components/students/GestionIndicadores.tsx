import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { maestraIndicadoresService, type MaestraIndicador, type Clase } from '../../services/supabaseDataService';
import { ImportIndicadoresExcel } from './ImportIndicadoresExcel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DeleteIcon, EditIcon, SaveIcon, CloseIcon, SearchIcon } from '../Icons';
import { Badge } from '../ui/badge';

interface GestionIndicadoresProps {
    clases: Clase[];
}

// Grade color mapping (from App.tsx)
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

export const GestionIndicadores: React.FC<GestionIndicadoresProps> = ({ clases }) => {
    const [indicadores, setIndicadores] = useState<MaestraIndicador[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClaseFilter, setSelectedClaseFilter] = useState<string>('all');
    const [searchCodigo, setSearchCodigo] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

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

    const handleEdit = (id: string, currentText: string) => {
        setEditingId(id);
        setEditingText(currentText);
    };

    const handleSave = async (id: string) => {
        try {
            await maestraIndicadoresService.update(id, { descripcion: editingText });
            setEditingId(null);
            setEditingText('');
            await loadIndicadores();
        } catch (error: any) {
            alert('Error al actualizar: ' + error.message);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditingText('');
    };

    const handleSearchCodigo = async () => {
        if (!searchCodigo.trim()) {
            loadIndicadores();
            return;
        }

        try {
            const results = await maestraIndicadoresService.searchByCodigo(searchCodigo);
            setIndicadores(results);
        } catch (error) {
            console.error('Error searching by code:', error);
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
                    {/* Filters and Search */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="font-semibold text-sm whitespace-nowrap">Filtrar por clase:</label>
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

                            <div className="flex items-center gap-2">
                                <label className="font-semibold text-sm whitespace-nowrap">Buscar por código:</label>
                                <Input
                                    type="text"
                                    placeholder="Ej: 6G-MAT-C-001"
                                    value={searchCodigo}
                                    onChange={(e) => setSearchCodigo(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchCodigo()}
                                    className="max-w-xs"
                                />
                                <Button onClick={handleSearchCodigo} size="sm">
                                    <SearchIcon />
                                    Buscar
                                </Button>
                                {searchCodigo && (
                                    <Button onClick={() => { setSearchCodigo(''); loadIndicadores(); }} variant="outline" size="sm">
                                        Limpiar
                                    </Button>
                                )}
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

                            const gradeColor = getGradeColor(clase.grado_asignado);

                            return (
                                <Card key={idClase} style={{ borderLeft: `4px solid ${gradeColor}` }}>
                                    <CardHeader style={{ backgroundColor: `${gradeColor}15` }}>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <span>{clase.grado_asignado} - {clase.nombre_materia}</span>
                                            <Badge variant="secondary">{inds.length} indicadores</Badge>
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
                                                                {ind.codigo_unico && (
                                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                                        {ind.codigo_unico}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {editingId === ind.id_indicador ? (
                                                                <Input
                                                                    value={editingText}
                                                                    onChange={(e) => setEditingText(e.target.value)}
                                                                    className="mt-2"
                                                                />
                                                            ) : (
                                                                <p className="text-sm">{ind.descripcion}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {editingId === ind.id_indicador ? (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleSave(ind.id_indicador)}
                                                                    >
                                                                        <SaveIcon />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={handleCancel}
                                                                    >
                                                                        <CloseIcon />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(ind.id_indicador, ind.descripcion)}
                                                                    >
                                                                        <EditIcon className="h-4 w-4 text-blue-600" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(ind.id_indicador)}
                                                                    >
                                                                        <DeleteIcon className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </>
                                                            )}
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
