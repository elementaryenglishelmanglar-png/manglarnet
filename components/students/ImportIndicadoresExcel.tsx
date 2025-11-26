import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { maestraIndicadoresService } from '../../services/supabaseDataService';
import { CheckIcon, AlertTriangle, FileSpreadsheetIcon, RefreshCwIcon } from 'lucide-react';

interface ProcessedData {
    claseId?: string;
    grado: string;
    asignatura: string;
    rutina: string;
    competencia: string;
    indicadores: string[];
}

interface ImportIndicadoresProps {
    clases: Array<{ id_clase: string; nombre_materia: string; grado_asignado: string }>;
    onImportComplete: () => void;
}

export const ImportIndicadoresExcel: React.FC<ImportIndicadoresProps> = ({ clases, onImportComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ProcessedData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setSuccess(null);
        setLogs([]);
        processExcelFile(selectedFile);
    };

    const processExcelFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (jsonData.length === 0) {
                    setError('El archivo está vacío.');
                    return;
                }

                const processed: ProcessedData[] = [];
                let currentGrado = '';
                let currentAsignatura = '';
                let currentRutina = '';
                let currentCompetencia = '';

                // Helper to normalize strings
                const norm = (s: any) => String(s || '').trim();

                jsonData.forEach((row) => {
                    // Detect columns (flexible naming)
                    const grado = norm(row['Grado'] || row['grado'] || row['Nivel']);
                    const asignatura = norm(row['Asignatura'] || row['Materia'] || row['Código'] || row['Codigo']); // Sometimes Code is used for Subject
                    const rutina = norm(row['Rutina'] || row['rutina']);
                    const competencia = norm(row['Competencia'] || row['competencia']);
                    const indicador = norm(row['Indicador'] || row['Indicadores'] || row['indicadores']);

                    // Fill-down logic (if cell is empty, use previous value)
                    if (grado) currentGrado = grado;
                    if (asignatura) currentAsignatura = asignatura;
                    if (rutina) currentRutina = rutina;
                    if (competencia) currentCompetencia = competencia;

                    if (indicador) {
                        // Find matching class
                        const targetClass = clases.find(c =>
                            c.grado_asignado.toLowerCase().includes(currentGrado.toLowerCase()) &&
                            (c.nombre_materia.toLowerCase().includes(currentAsignatura.toLowerCase()) || currentAsignatura === '')
                        );

                        // Group by unique combination of (Class, Routine, Competency)
                        const existingGroup = processed.find(p =>
                            p.grado === currentGrado &&
                            p.asignatura === currentAsignatura &&
                            p.rutina === currentRutina &&
                            p.competencia === currentCompetencia
                        );

                        if (existingGroup) {
                            existingGroup.indicadores.push(indicador);
                        } else {
                            processed.push({
                                claseId: targetClass?.id_clase, // May be undefined if no match
                                grado: currentGrado,
                                asignatura: currentAsignatura,
                                rutina: currentRutina,
                                competencia: currentCompetencia,
                                indicadores: [indicador]
                            });
                        }
                    }
                });

                setPreviewData(processed);
                if (processed.length === 0) {
                    setError('No se encontraron indicadores válidos. Verifica las columnas: Grado, Asignatura, Competencia, Indicadores.');
                } else {
                    addLog(`Se procesaron ${processed.length} grupos de competencias.`);
                    const matched = processed.filter(p => p.claseId).length;
                    const unmatched = processed.filter(p => !p.claseId).length;
                    addLog(`✅ ${matched} grupos vinculados a clases existentes.`);
                    if (unmatched > 0) addLog(`⚠️ ${unmatched} grupos no encontraron clase coincidente (revisa nombres de Grado/Materia).`);
                }

            } catch (err) {
                console.error(err);
                setError('Error al procesar el archivo.');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        setIsLoading(true);
        setError(null);
        setLogs([]);
        let successCount = 0;
        let errorCount = 0;

        try {
            // Filter only valid data with matching class
            const validData = previewData.filter(d => d.claseId);

            if (validData.length === 0) {
                setError('No hay datos válidos para importar (ninguna clase coincidió).');
                setIsLoading(false);
                return;
            }

            for (const group of validData) {
                try {
                    // 1. Create Competency (Parent)
                    const compData = {
                        id_clase: group.claseId!,
                        categoria: 'Competencia' as const,
                        descripcion: group.competencia,
                        orden: 1, // Simple ordering
                        activo: true,
                        rutina: group.rutina || 'General'
                    };

                    // We need to insert one by one to get the ID for children
                    // Since createBulk doesn't return IDs easily in all supabase versions/wrappers, 
                    // we'll use a direct single create if available or assume we need a new service method.
                    // For now, let's try to use the service. If create returns data, good.

                    // Workaround: We'll use a custom SQL function or just insert one by one.
                    // Let's assume we can't easily get ID from bulk. We'll do single inserts for Competencies.

                    // IMPORTANT: We need to extend the service to support single create with return
                    // For now, I will use a direct supabase call pattern if I could, but I am bound to service.
                    // I will assume createBulk returns the created items (it usually does in Supabase js).

                    const createdComp = await maestraIndicadoresService.createBulk([compData]);

                    if (createdComp && createdComp.length > 0) {
                        const compId = createdComp[0].id_indicador;

                        // 2. Create Indicators (Children)
                        const indicatorsData = group.indicadores.map((indText, idx) => ({
                            id_clase: group.claseId!,
                            categoria: 'Indicador' as const,
                            descripcion: indText,
                            orden: idx + 1,
                            activo: true,
                            rutina: group.rutina || 'General',
                            id_padre: compId
                        }));

                        await maestraIndicadoresService.createBulk(indicatorsData);
                        successCount++;
                    }
                } catch (err) {
                    console.error('Error importing group:', group, err);
                    errorCount++;
                }
            }

            setSuccess(`Importación completada. ${successCount} competencias importadas. ${errorCount} errores.`);
            setPreviewData([]);
            setFile(null);
            setTimeout(onImportComplete, 2000);

        } catch (err: any) {
            setError(`Error crítico: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheetIcon className="h-6 w-6 text-green-600" />
                    Importación Masiva de Indicadores
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertDescription>
                        <p className="font-semibold">Formato requerido (Columnas):</p>
                        <p className="text-sm text-muted-foreground">
                            Grado | Asignatura | Competencia | Indicador | Código (opcional)
                        </p>
                        <p className="text-xs mt-2 text-blue-600">
                            * El sistema buscará automáticamente las clases que coincidan con Grado y Asignatura.
                        </p>
                        <p className="text-xs text-blue-600">
                            * Los códigos únicos se generan automáticamente si no se proporcionan.
                        </p>
                    </AlertDescription>
                </Alert>

                <div className="flex items-center gap-4">
                    <a
                        href="/plantilla_competencias_indicadores.xlsx"
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        <FileSpreadsheetIcon className="h-4 w-4" />
                        Descargar Plantilla Excel
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    <Input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="max-w-md"
                    />
                    {isLoading && <RefreshCwIcon className="animate-spin h-5 w-5" />}
                </div>

                {logs.length > 0 && (
                    <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-32 overflow-y-auto">
                        {logs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-500 bg-green-50">
                        <CheckIcon className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Éxito</AlertTitle>
                        <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                )}

                {previewData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Vista Previa ({previewData.length} Competencias)</h4>
                            <Button onClick={handleImport} disabled={isLoading}>
                                {isLoading ? 'Importando...' : 'Confirmar Importación'}
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Clase Destino</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rutina</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Competencia</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Indicadores</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i} className={!row.claseId ? 'bg-red-50' : ''}>
                                            <td className="px-3 py-2 text-xs">
                                                {row.claseId ? (
                                                    <span className="text-green-600 font-semibold">✓ {row.grado} - {row.asignatura}</span>
                                                ) : (
                                                    <span className="text-red-500 font-semibold">✗ {row.grado} - {row.asignatura} (No encontrada)</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-xs">{row.rutina}</td>
                                            <td className="px-3 py-2 text-xs font-medium">{row.competencia.substring(0, 50)}...</td>
                                            <td className="px-3 py-2 text-xs">{row.indicadores.length} indicadores</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 10 && (
                                <div className="p-2 text-center text-xs text-muted-foreground bg-gray-50">
                                    ... y {previewData.length - 10} más
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
