import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../services/supabaseClient';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface StudentRow {
    nombres: string;
    apellidos: string;
    salon: string;
    genero: 'Niño' | 'Niña';
    grupo?: 'Grupo 1' | 'Grupo 2';
    cedula_escolar?: string;
    fecha_nacimiento?: string;
    lugar_nacimiento?: string;
    estado?: string;
    condicion?: string;
    nivel_ingles?: 'Basic' | 'Lower' | 'Upper' | 'Advanced' | 'IB' | '';
    email_alumno?: string;
    nombre_madre?: string;
    telefono_madre?: string;
    email_madre?: string;
    nombre_padre?: string;
    telefono_padre?: string;
    email_padre?: string;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [errors, setErrors] = useState<string[]>([]);
    const [successCount, setSuccessCount] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setErrors([]);
            setSuccessCount(0);
        }
    };

    const validateRow = (row: any, rowIndex: number): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Required fields
        if (!row.nombres || row.nombres.trim() === '') {
            errors.push(`Fila ${rowIndex + 2}: 'nombres' es requerido`);
        }
        if (!row.apellidos || row.apellidos.trim() === '') {
            errors.push(`Fila ${rowIndex + 2}: 'apellidos' es requerido`);
        }
        if (!row.salon || row.salon.trim() === '') {
            errors.push(`Fila ${rowIndex + 2}: 'salon' es requerido`);
        }
        if (!row.genero || !['Niño', 'Niña'].includes(row.genero)) {
            errors.push(`Fila ${rowIndex + 2}: 'genero' debe ser 'Niño' o 'Niña'`);
        }

        // Optional but validated fields
        if (row.grupo && !['Grupo 1', 'Grupo 2', ''].includes(row.grupo)) {
            errors.push(`Fila ${rowIndex + 2}: 'grupo' debe ser 'Grupo 1' o 'Grupo 2'`);
        }
        if (row.nivel_ingles && !['Basic', 'Lower', 'Upper', 'Advanced', 'IB', ''].includes(row.nivel_ingles)) {
            errors.push(`Fila ${rowIndex + 2}: 'nivel_ingles' inválido`);
        }

        return { valid: errors.length === 0, errors };
    };

    const processFile = async () => {
        if (!file) return;

        setIsProcessing(true);
        setErrors([]);
        setSuccessCount(0);
        const allErrors: string[] = [];

        try {
            // Read Excel file
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                setErrors(['El archivo está vacío']);
                setIsProcessing(false);
                return;
            }

            setProgress({ current: 0, total: jsonData.length });

            // Validate all rows first
            const validatedRows: StudentRow[] = [];
            jsonData.forEach((row, index) => {
                const validation = validateRow(row, index);
                if (!validation.valid) {
                    allErrors.push(...validation.errors);
                } else {
                    validatedRows.push(row as StudentRow);
                }
            });

            if (allErrors.length > 0) {
                setErrors(allErrors);
                setIsProcessing(false);
                return;
            }

            // Process in batches
            const batchSize = 50;
            let successfulInserts = 0;

            for (let i = 0; i < validatedRows.length; i += batchSize) {
                const batch = validatedRows.slice(i, i + batchSize);

                // Prepare data for insertion
                const studentsToInsert = batch.map(row => ({
                    nombres: row.nombres.trim(),
                    apellidos: row.apellidos.trim(),
                    salon: row.salon.trim(),
                    genero: row.genero,
                    grupo: row.grupo || null,
                    cedula_escolar: row.cedula_escolar || null,
                    fecha_nacimiento: row.fecha_nacimiento || null,
                    lugar_nacimiento: row.lugar_nacimiento || null,
                    estado: row.estado || null,
                    condicion: row.condicion || null,
                    nivel_ingles: row.nivel_ingles || '',
                    email_alumno: row.email_alumno || null,
                    info_madre: {
                        nombre: row.nombre_madre || '',
                        telefono: row.telefono_madre || '',
                        email: row.email_madre || ''
                    },
                    info_padre: {
                        nombre: row.nombre_padre || '',
                        telefono: row.telefono_padre || '',
                        email: row.email_padre || ''
                    },
                    hermanos: []
                }));

                // Insert batch
                const { data, error } = await supabase
                    .from('alumnos')
                    .insert(studentsToInsert)
                    .select();

                if (error) {
                    allErrors.push(`Error en lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
                } else {
                    successfulInserts += data?.length || 0;
                }

                setProgress({ current: Math.min(i + batchSize, validatedRows.length), total: validatedRows.length });
            }

            setSuccessCount(successfulInserts);

            if (successfulInserts > 0) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            }

        } catch (error: any) {
            allErrors.push(`Error al procesar archivo: ${error.message}`);
        } finally {
            setErrors(allErrors);
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Importar Alumnos desde Excel</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar archivo Excel
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                        disabled={isProcessing}
                    />
                </div>

                {file && !isProcessing && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                            Archivo seleccionado: <strong>{file.name}</strong>
                        </p>
                    </div>
                )}

                {isProcessing && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Procesando...</span>
                            <span>{progress.current} / {progress.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {successCount > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                            ✅ {successCount} alumno(s) importado(s) exitosamente
                        </p>
                    </div>
                )}

                {errors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md max-h-60 overflow-y-auto">
                        <p className="text-sm font-semibold text-red-800 mb-2">Errores encontrados:</p>
                        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex justify-between items-center mt-6">
                    <a
                        href="/plantilla_alumnos.xlsx"
                        download
                        className="text-sm text-blue-600 hover:underline"
                    >
                        📥 Descargar plantilla Excel
                    </a>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={isProcessing}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={processFile}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={!file || isProcessing}
                        >
                            {isProcessing ? 'Procesando...' : 'Importar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
