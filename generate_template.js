import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create workbook
const wb = XLSX.utils.book_new();

// ============================================
// SHEET 1: Instrucciones
// ============================================
const instructionsData = [
    ['PLANTILLA DE IMPORTACIÓN DE COMPETENCIAS E INDICADORES'],
    [''],
    ['INSTRUCCIONES DE USO:'],
    [''],
    ['1. Esta plantilla permite importar competencias e indicadores de forma masiva al sistema ManglarNet.'],
    [''],
    ['2. ESTRUCTURA JERÁRQUICA:'],
    ['   - Cada COMPETENCIA puede tener múltiples INDICADORES'],
    ['   - Los indicadores se agrupan bajo su competencia correspondiente'],
    [''],
    ['3. COLUMNAS REQUERIDAS (en la hoja "Datos"):'],
    ['   - Grado: El grado escolar (ej: "6to Grado", "5to Grado")'],
    ['   - Asignatura: La materia (ej: "Matemáticas", "Lenguaje", "Ciencias")'],
    ['   - Competencia: Descripción de la competencia'],
    ['   - Indicador: Descripción del indicador (puede haber varios por competencia)'],
    ['   - Código: OPCIONAL - Si se deja vacío, se genera automáticamente'],
    [''],
    ['4. FORMATO DE CÓDIGOS (generados automáticamente):'],
    ['   - Formato: {GRADO}-{MATERIA}-{TIPO}-{NUM}'],
    ['   - Ejemplo Competencia: 6G-MAT-C-001'],
    ['   - Ejemplo Indicador: 6G-MAT-I-001'],
    [''],
    ['5. CÓMO LLENAR:'],
    ['   - Para cada competencia, escribe su descripción en la columna "Competencia"'],
    ['   - En las filas siguientes, deja "Competencia" vacía y llena solo "Indicador"'],
    ['   - El sistema agrupará automáticamente los indicadores bajo su competencia'],
    [''],
    ['6. EJEMPLO:'],
    ['   Grado      | Asignatura   | Competencia                    | Indicador                           | Código'],
    ['   6to Grado  | Matemáticas  | Resuelve problemas de álgebra  |                                     |'],
    ['   6to Grado  | Matemáticas  |                                | Identifica variables en ecuaciones  |'],
    ['   6to Grado  | Matemáticas  |                                | Despeja incógnitas correctamente    |'],
    [''],
    ['7. IMPORTANTE:'],
    ['   - Asegúrate de que Grado y Asignatura coincidan con las clases existentes en el sistema'],
    ['   - Si no coinciden, esos datos no se importarán'],
    ['   - Revisa la vista previa antes de confirmar la importación'],
];

const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
wsInstructions['!cols'] = [{ wch: 100 }];
XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

// ============================================
// SHEET 2: Datos (Template with examples)
// ============================================
const dataHeaders = [
    ['Grado', 'Asignatura', 'Competencia', 'Indicador', 'Código']
];

const exampleData = [
    // Ejemplo 1: Matemáticas 6to Grado
    ['6to Grado', 'Matemáticas', 'Resuelve problemas de álgebra básica', '', ''],
    ['6to Grado', 'Matemáticas', '', 'Identifica variables y constantes en expresiones algebraicas', ''],
    ['6to Grado', 'Matemáticas', '', 'Despeja incógnitas en ecuaciones de primer grado', ''],
    ['6to Grado', 'Matemáticas', '', 'Plantea y resuelve problemas utilizando ecuaciones', ''],
    ['', '', '', '', ''],

    ['6to Grado', 'Matemáticas', 'Comprende y aplica conceptos de geometría', '', ''],
    ['6to Grado', 'Matemáticas', '', 'Calcula áreas y perímetros de figuras planas', ''],
    ['6to Grado', 'Matemáticas', '', 'Identifica y clasifica ángulos según su medida', ''],
    ['', '', '', '', ''],

    // Ejemplo 2: Lenguaje 6to Grado
    ['6to Grado', 'Lenguaje', 'Comprende y produce textos narrativos', '', ''],
    ['6to Grado', 'Lenguaje', '', 'Identifica elementos de la narración (personajes, tiempo, espacio)', ''],
    ['6to Grado', 'Lenguaje', '', 'Escribe cuentos con estructura coherente', ''],
    ['6to Grado', 'Lenguaje', '', 'Utiliza recursos literarios en sus producciones', ''],
    ['', '', '', '', ''],

    // Ejemplo 3: Ciencias 5to Grado
    ['5to Grado', 'Ciencias', 'Comprende la estructura y función de los seres vivos', '', ''],
    ['5to Grado', 'Ciencias', '', 'Identifica las partes de la célula y sus funciones', ''],
    ['5to Grado', 'Ciencias', '', 'Diferencia entre célula animal y vegetal', ''],
    ['5to Grado', 'Ciencias', '', 'Explica procesos de nutrición y respiración celular', ''],
];

const wsData = XLSX.utils.aoa_to_sheet([...dataHeaders, ...exampleData]);

// Set column widths
wsData['!cols'] = [
    { wch: 15 },  // Grado
    { wch: 20 },  // Asignatura
    { wch: 50 },  // Competencia
    { wch: 60 },  // Indicador
    { wch: 15 },  // Código
];

XLSX.utils.book_append_sheet(wb, wsData, 'Datos');

// ============================================
// SHEET 3: Datos Vacíos (para uso real)
// ============================================
const wsEmpty = XLSX.utils.aoa_to_sheet([dataHeaders[0]]);
wsEmpty['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 50 },
    { wch: 60 },
    { wch: 15 },
];
XLSX.utils.book_append_sheet(wb, wsEmpty, 'Plantilla Vacía');

// Write file
const outputPath = path.join(__dirname, 'public', 'plantilla_competencias_indicadores.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Plantilla Excel creada exitosamente en:', outputPath);
