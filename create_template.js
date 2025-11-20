import XLSX from 'xlsx';

// Crear datos de ejemplo para la plantilla
const templateData = [
    {
        // CAMPOS REQUERIDOS
        nombres: 'Juan Carlos',
        apellidos: 'Pérez García',
        salon: '5to Grado',
        genero: 'Niño',

        // CAMPOS OPCIONALES - Información del Alumno
        grupo: 'Grupo 1',
        cedula_escolar: 'V-12345678',
        fecha_nacimiento: '2015-03-15',
        lugar_nacimiento: 'Caracas',
        estado: 'Activo',
        condicion: 'Regular',
        nivel_ingles: 'Basic',
        email_alumno: 'juan.perez@ejemplo.com',

        // CAMPOS OPCIONALES - Información de la Madre
        nombre_madre: 'María García',
        telefono_madre: '0412-1234567',
        email_madre: 'maria.garcia@ejemplo.com',

        // CAMPOS OPCIONALES - Información del Padre
        nombre_padre: 'Carlos Pérez',
        telefono_padre: '0414-7654321',
        email_padre: 'carlos.perez@ejemplo.com'
    },
    {
        nombres: 'María Fernanda',
        apellidos: 'López Martínez',
        salon: '6to Grado',
        genero: 'Niña',
        grupo: 'Grupo 2',
        cedula_escolar: 'V-87654321',
        fecha_nacimiento: '2014-07-22',
        lugar_nacimiento: 'Valencia',
        estado: 'Activo',
        condicion: 'Regular',
        nivel_ingles: 'Lower',
        email_alumno: 'maria.lopez@ejemplo.com',
        nombre_madre: 'Ana Martínez',
        telefono_madre: '0416-9876543',
        email_madre: 'ana.martinez@ejemplo.com',
        nombre_padre: 'José López',
        telefono_padre: '0424-3456789',
        email_padre: 'jose.lopez@ejemplo.com'
    },
    {
        nombres: 'Pedro José',
        apellidos: 'Rodríguez Silva',
        salon: '5to Grado',
        genero: 'Niño',
        grupo: 'Grupo 1',
        nivel_ingles: 'Upper',
        email_alumno: 'pedro.rodriguez@ejemplo.com',
        nombre_madre: 'Carmen Silva',
        telefono_madre: '0426-5551234',
        email_madre: 'carmen.silva@ejemplo.com'
    }
];

// Crear un nuevo libro de trabajo
const workbook = XLSX.utils.book_new();

// Convertir los datos a una hoja de cálculo
const worksheet = XLSX.utils.json_to_sheet(templateData);

// Ajustar el ancho de las columnas
const columnWidths = [
    { wch: 20 }, // nombres
    { wch: 20 }, // apellidos
    { wch: 15 }, // salon
    { wch: 10 }, // genero
    { wch: 12 }, // grupo
    { wch: 15 }, // cedula_escolar
    { wch: 15 }, // fecha_nacimiento
    { wch: 20 }, // lugar_nacimiento
    { wch: 12 }, // estado
    { wch: 12 }, // condicion
    { wch: 15 }, // nivel_ingles
    { wch: 25 }, // email_alumno
    { wch: 25 }, // nombre_madre
    { wch: 15 }, // telefono_madre
    { wch: 25 }, // email_madre
    { wch: 25 }, // nombre_padre
    { wch: 15 }, // telefono_padre
    { wch: 25 }  // email_padre
];

worksheet['!cols'] = columnWidths;

// Agregar la hoja al libro
XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

// Guardar el archivo
XLSX.writeFile(workbook, 'public/plantilla_alumnos.xlsx');

console.log('✅ Plantilla creada exitosamente en public/plantilla_alumnos.xlsx');
