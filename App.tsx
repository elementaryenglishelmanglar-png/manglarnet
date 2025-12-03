
import React, { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { DashboardIcon, StudentsIcon, TeachersIcon, PlusIcon, CloseIcon, EditIcon, DeleteIcon, ChevronDownIcon, LogoutIcon, PlanningIcon, CalendarIcon, SearchIcon, SparklesIcon, ArrowLeftIcon, UserCircleIcon, AcademicCapIcon, UsersIcon, IdentificationIcon, CakeIcon, LocationMarkerIcon, MailIcon, PhoneIcon, ClipboardCheckIcon, SendIcon, BellIcon, TagIcon, DownloadIcon, EvaluationIcon, SaveIcon, MenuIcon, MagicWandIcon, ScheduleGeneratorIcon, TeamSchedulesIcon } from './components/Icons';
import { AlertTriangle, AlertCircle, XCircle, Heart, UserMinus } from 'lucide-react';
import { Button } from './components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { InputField } from './components/ui/InputField';
import { Separator } from './components/ui/separator';
import { Skeleton, LoadingState, LoadingSpinner } from './components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { useToast } from './components/ui/toast';
import { ConfirmDialog } from './components/ui/confirm-dialog';
import { EmptyState, EmptyStateStudents, EmptyStateTeachers, EmptyStateSearch } from './components/ui/empty-state';
import { Breadcrumbs } from './components/ui/breadcrumbs';
import { ThemeToggle } from './components/ui/theme-toggle';
import { HelpTooltip } from './components/ui/help-tooltip';
import { OnboardingTour } from './components/ui/onboarding-tour';
import { OptimisticButton } from './components/ui/optimistic-button';
import { UserPreferencesDialog } from './components/ui/user-preferences-dialog';
import { KeyboardShortcutsHelp } from './components/ui/keyboard-shortcuts-help';
import { CommandPalette } from './components/ui/command-palette';
import { useGlobalShortcuts, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { GraduationCap, Home, Settings } from 'lucide-react';
import { Badge } from './components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { PedagogicalDashboard } from './components/charts/PedagogicalDashboard';
import { EnhancedPieChart, AdaptationGradeDistributionCharts, gradeColors, adaptationColors } from './components/charts/AdaptationCharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Label } from './components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

// Colores de notas (duplicados aquí para asegurar que estén disponibles)
const NOTE_COLORS: { [key: string]: string } = {
    'A': '#22C55E', // Verde
    'B': '#3B82F6', // Azul
    'C': '#EAB308', // Amarillo
    'D': '#F97316', // Naranja
    'E': '#EF4444', // Rojo
    'SE': '#6B7280', // Gris
    '': '#D1D5DB'
};

// Componente helper para mostrar badges de notas con colores uniformes
const GradeBadge: React.FC<{ nota: string }> = ({ nota }) => {
    if (!nota || nota.trim() === '') {
        return (
            <span
                className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                    backgroundColor: '#D1D5DB',
                    color: '#FFFFFF',
                    border: 'none',
                    minWidth: '2rem',
                    height: '2rem'
                }}
            >
                -
            </span>
        );
    }
    
    // Normalizar la nota: eliminar signos + y - para buscar el color base
    const notaUpper = nota.toUpperCase().trim();
    const notaNormalizada = notaUpper.replace(/[+-]/g, '').replace(/\s+/g, '');
    
    // Usar los colores locales primero (más confiable)
    let color = NOTE_COLORS[notaNormalizada];
    if (!color && notaNormalizada !== notaUpper) {
        color = NOTE_COLORS[notaUpper];
    }
    if (!color) {
        // Si aún no encuentra, intentar con solo la primera letra
        const primeraLetra = notaUpper.charAt(0);
        color = NOTE_COLORS[primeraLetra];
    }
    // Fallback a gradeColors importado
    if (!color) {
        color = gradeColors[notaNormalizada] || gradeColors[notaUpper] || gradeColors[notaUpper.charAt(0)];
    }
    // Color por defecto si no se encuentra
    if (!color) {
        color = '#D1D5DB';
    }
    
    const textColor = '#FFFFFF'; // Todos usan texto blanco para mejor contraste
    
    return (
        <span
            className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 hover:scale-105"
            style={{
                backgroundColor: color,
                color: textColor,
                border: 'none',
                minWidth: '2rem',
                height: '2rem'
            }}
        >
            {nota}
        </span>
    );
};

// Icono de check para tareas completadas
const CheckIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
import { getAIPlanSuggestions, getAIEvaluationAnalysis } from './services/geminiService';
import { supabase } from './services/supabaseClient';
// Lazy loading para componentes pesados
const LoginScreen = lazy(() => import('./components/LoginScreen').then(module => ({ default: module.LoginScreen })));
const AuthorizedUsersView = lazy(() => import('./components/AuthorizedUsersView').then(module => ({ default: module.AuthorizedUsersView })));
import BulkImportModal from './components/students/BulkImportModal';
import { GestionIndicadores } from './components/students/GestionIndicadores';
import StudentDetailView from './components/students/StudentDetailView';
import StudentListView from './components/students/StudentListView';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { lapsosService, semanasLapsoService } from './services/supabaseDataService';
import { analyticsService } from './services/supabaseDataService';
import { getWeekFromDate, formatDateRange } from './services/weekCalculator';
import {
    alumnosService,
    docentesService,
    logReunionesService,
    eventosCalendarioService,
    tareasCoordinadorService,
    type LogReunionCoordinacion,
    type TareaCoordinador,
    clasesService,
    planificacionesService,
    horariosService,
    minutasService,
    notificacionesService,
    aulasService,
    configuracionHorariosService,
    generacionesHorariosService,
    maestraIndicadoresService,
    detalleEvaluacionService,
    resumenEvaluacionService,
    type Alumno as AlumnoDB,
    type Clase as ClaseDB,
    type Horario as HorarioDB,
    type ConfiguracionHorario,
    type GeneracionHorario,
    type Aula,
    type MaestraIndicador,
    type DetalleEvaluacionAlumno,
    type ResumenEvaluacionAlumno,
    type EvaluacionAlumno,
    type Nota,
    type Adaptacion
} from './services/supabaseDataService';


// --- DATABASE SCHEMA TYPES ---
// Based on the provided PostgreSQL schema

type UserRole = 'docente' | 'coordinador' | 'directivo' | 'administrativo';

interface Usuario {
    id: string; // UUID
    email: string;
    username: string; // Username/nickname
    role: UserRole;
    // Mapped from docentes table for convenience
    docenteId?: string; // UUID
    fullName?: string;
}

interface Docente {
    id_docente: string; // UUID
    id_usuario: string; // UUID
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    especialidad: string;
}

interface Alumno {
    id_alumno: string; // UUID
    nombres: string;
    apellidos: string;
    email_alumno: string;
    lugar_nacimiento: string;
    estado: string;
    fecha_nacimiento: string; // DATE
    cedula_escolar: string;
    condicion: string;
    hermanos: string[]; // Array of grades/classrooms
    genero: 'Niño' | 'Niña';
    salon: string;
    grupo: 'Grupo 1' | 'Grupo 2';
    info_madre: {
        nombre: string;
        email: string;
        telefono: string;
    };
    info_padre: {
        nombre: string;
        email: string;
        telefono: string;
    };
    nivel_ingles: 'Basic' | 'Lower' | 'Upper' | 'Advanced' | 'IB' | '';
}

interface Clase {
    id_clase: string; // UUID
    nombre_materia: string;
    grado_asignado: string;
    id_docente_asignado: string; // UUID
    id_aula?: string | null; // UUID - Aula/salón asignado
    // Not in schema, but useful for frontend logic
    studentIds: string[];
    // English-specific fields
    nivel_ingles?: string | null; // 'Basic', 'Lower', 'Upper', null
    skill_rutina?: string | null; // 'Reading', 'Writing', 'Speaking', 'Listening', 'Use of English', 'Phonics', 'Project', null
    es_ingles_primaria?: boolean;
    es_proyecto?: boolean;
}

interface Planificacion {
    id_planificacion: string; // UUID
    id_docente: string | null; // UUID - Can be null if docente is deleted
    id_clase: string; // UUID
    semana: number;
    lapso: 'I Lapso' | 'II Lapso' | 'III Lapso';
    ano_escolar: string;
    fecha_creacion: string; // TIMESTAMPTZ
    competencia_indicadores: string;
    inicio: string;
    desarrollo: string;
    cierre: string;
    recursos_links?: string;
    status: 'Borrador' | 'Enviado' | 'Revisado' | 'Aprobado';
    observaciones?: string;
    nombres_docente?: string; // Preserved docente name
    apellidos_docente?: string; // Preserved docente last name
}

interface Horario {
    id_horario: string;
    id_docente: string | null; // Can be null for events
    id_clase: string | null; // Can be null for events
    id_aula?: string | null; // Aula/salón asignado
    lapso?: string | null; // NUEVO: Lapso académico (I Lapso, II Lapso, III Lapso)
    ano_escolar?: string | null; // NUEVO: Año escolar
    dia_semana: number; // 1: Lunes, 2: Martes, ..., 5: Viernes
    hora_inicio: string; // e.g., "08:00"
    hora_fin: string; // e.g., "09:00"
    evento_descripcion?: string; // For non-class events
}

interface Lapso {
    id_lapso: string;
    ano_escolar: string;
    lapso: 'I Lapso' | 'II Lapso' | 'III Lapso';
    fecha_inicio: string;
    fecha_fin: string;
    semanas_totales: number;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

interface SemanaInfo {
    numero_semana: number;
    fecha_inicio: string;
    fecha_fin: string;
    lapso: string;
    ano_escolar: string;
    id_lapso?: string;
}

interface EventoCalendario {
    id_evento: string;
    titulo: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    tipo_evento: 'Actividades Generales' | 'Actos Cívicos' | 'Entregas Administrativas' | 'Reuniones de Etapa';
    nivel_educativo: string[];
    color?: string;
    todo_dia: boolean;
    creado_por?: string;
    created_at?: string;
    updated_at?: string;
}

// --- NEW TYPES FOR EVALUATION MODULE ---


interface AnalisisDificultad {
    dificultad: string;
    categoria: string;
    frecuencia: number;
    estudiantes: string;
    accionesSugeridas: string;
}

interface MinutaEvaluacion {
    id_minuta: string;
    ano_escolar: string;
    lapso: string;
    evaluacion: string;
    grado: string;
    materia: string;
    fecha_creacion: string;
    datos_alumnos: EvaluacionAlumno[];
    analisis_ia: AnalisisDificultad[];
    // Clinical-Pedagogical Diagnostic System: "Soft data" fields
    nivel_independencia?: 'Autónomo' | 'Apoyo Parcial' | 'Apoyo Total';
    estado_emocional?: 'Enfocado' | 'Ansioso' | 'Distraído' | 'Participativo';
    eficacia_accion_anterior?: 'Resuelto' | 'En Proceso' | 'Ineficaz';
}


type WeeklySchedules = {
    [grade: string]: {
        [week: number]: Horario[];
    };
};

interface Assignment {
    subject: string;
    grade: string;
    nivel_ingles?: string; // Solo para inglés en 5to-6to (Basic, Lower, Upper)
    id_aula?: string; // Aula/salón asignado para esta clase
}

interface Notification {
    id: string;
    recipientId: string; // docenteId
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    linkTo: {
        view: string;
        params?: any;
    };
}


// --- MOCK DATABASE & USERS ---
// mockUsuarios removed - not used in production code

const mockDocentes: Docente[] = [
    { id_docente: 'docente-01', id_usuario: 'user-teacher-01', nombres: 'Juan', apellidos: 'Pérez', email: 'j.perez@school.edu', telefono: '0412-1234567', especialidad: 'Matemáticas' },
    { id_docente: 'docente-02', id_usuario: 'user-teacher-02', nombres: 'Maria', apellidos: 'Gómez', email: 'm.gomez@school.edu', telefono: '0414-7654321', especialidad: 'Ciencias' },
];

const mockAlumnosData: Alumno[] = [
    {
        id_alumno: 'alumno-01',
        nombres: 'Carlos',
        apellidos: 'Rodriguez',
        email_alumno: 'carlos.r@school.edu',
        lugar_nacimiento: 'Caracas',
        estado: 'Distrito Capital',
        fecha_nacimiento: '2010-05-15',
        cedula_escolar: 'V28123456',
        condicion: 'Regular',
        hermanos: ['3er Grado'],
        genero: 'Niño',
        salon: '6to Grado',
        grupo: 'Grupo 1',
        info_madre: { nombre: 'Ana Rodriguez', email: 'ana.r@email.com', telefono: '0414-1234567' },
        info_padre: { nombre: 'Pedro Rodriguez', email: 'pedro.r@email.com', telefono: '0412-7654321' },
        nivel_ingles: 'Advanced',
    },
    {
        id_alumno: 'alumno-02',
        nombres: 'Sofia',
        apellidos: 'Martinez',
        email_alumno: 'sofia.m@school.edu',
        lugar_nacimiento: 'Maracaibo',
        estado: 'Zulia',
        fecha_nacimiento: '2011-02-20',
        cedula_escolar: 'V29987654',
        condicion: 'Nuevo Ingreso',
        hermanos: [],
        genero: 'Niña',
        salon: '5to Grado',
        grupo: 'Grupo 2',
        info_madre: { nombre: 'Laura Martinez', email: 'laura.m@email.com', telefono: '0424-2345678' },
        info_padre: { nombre: 'Luis Martinez', email: 'luis.m@email.com', telefono: '0416-8765432' },
        nivel_ingles: 'Upper',
    },
    {
        id_alumno: 'alumno-03',
        nombres: 'Mateo',
        apellidos: 'Garcia',
        email_alumno: 'mateo.g@school.edu',
        lugar_nacimiento: 'Valencia',
        estado: 'Carabobo',
        fecha_nacimiento: '2010-11-10',
        cedula_escolar: 'V28345678',
        condicion: 'Regular',
        hermanos: [],
        genero: 'Niño',
        salon: '6to Grado',
        grupo: 'Grupo 1',
        info_madre: { nombre: 'Isabel Garcia', email: 'isabel.g@email.com', telefono: '0414-3456789' },
        info_padre: { nombre: 'David Garcia', email: 'david.g@email.com', telefono: '0412-9876543' },
        nivel_ingles: 'Advanced',
    },
    {
        id_alumno: 'alumno-04',
        nombres: 'Valentina',
        apellidos: 'Lopez',
        email_alumno: 'valentina.l@school.edu',
        lugar_nacimiento: 'Barquisimeto',
        estado: 'Lara',
        fecha_nacimiento: '2012-08-01',
        cedula_escolar: 'V30123123',
        condicion: 'Regular',
        hermanos: ['1er Grado', 'III Grupo'],
        genero: 'Niña',
        salon: '4to Grado',
        grupo: 'Grupo 2',
        info_madre: { nombre: 'Carmen Lopez', email: 'carmen.l@email.com', telefono: '0426-4567890' },
        info_padre: { nombre: 'Jose Lopez', email: 'jose.l@email.com', telefono: '0414-0987654' },
        nivel_ingles: 'Lower',
    },
    {
        id_alumno: 'alumno-05',
        nombres: 'Daniel',
        apellidos: 'Hernandez',
        email_alumno: 'daniel.h@school.edu',
        lugar_nacimiento: 'Maracay',
        estado: 'Aragua',
        fecha_nacimiento: '2011-09-05',
        cedula_escolar: 'V29555444',
        condicion: 'Regular',
        hermanos: [],
        genero: 'Niño',
        salon: '5to Grado',
        grupo: 'Grupo 1',
        info_madre: { nombre: 'Patricia Hernandez', email: 'patricia.h@email.com', telefono: '0412-1112233' },
        info_padre: { nombre: 'Roberto Hernandez', email: 'roberto.h@email.com', telefono: '0414-4445566' },
        nivel_ingles: 'Upper',
    },
];

const mockClases: Clase[] = [
    // 6th Grade
    { id_clase: 'clase-01', nombre_materia: 'Matemáticas', grado_asignado: '6to Grado', id_docente_asignado: 'docente-01', studentIds: ['alumno-01', 'alumno-03'] },
    { id_clase: 'clase-04', nombre_materia: 'Ed, Física y Deporte', grado_asignado: '6to Grado', id_docente_asignado: 'docente-02', studentIds: ['alumno-01', 'alumno-03'] },
    { id_clase: 'clase-11', nombre_materia: 'Lenguaje', grado_asignado: '6to Grado', id_docente_asignado: 'docente-02', studentIds: ['alumno-01', 'alumno-03'] },
    { id_clase: 'clase-12', nombre_materia: 'Inglés', grado_asignado: '6to Grado', id_docente_asignado: 'docente-01', studentIds: ['alumno-01', 'alumno-03'] },

    // 5th Grade
    { id_clase: 'clase-02', nombre_materia: 'Ciencias', grado_asignado: '5to Grado', id_docente_asignado: 'docente-02', studentIds: ['alumno-02', 'alumno-05'] },
    { id_clase: 'clase-05', nombre_materia: 'Inglés', grado_asignado: '5to Grado', id_docente_asignado: 'docente-01', studentIds: ['alumno-02', 'alumno-05'] },
    { id_clase: 'clase-09', nombre_materia: 'Matemáticas', grado_asignado: '5to Grado', id_docente_asignado: 'docente-01', studentIds: ['alumno-02', 'alumno-05'] },
    { id_clase: 'clase-10', nombre_materia: 'Lenguaje', grado_asignado: '5to Grado', id_docente_asignado: 'docente-02', studentIds: ['alumno-02', 'alumno-05'] },

    // 4th Grade
    { id_clase: 'clase-03', nombre_materia: 'Sociales', grado_asignado: '4to Grado', id_docente_asignado: 'docente-01', studentIds: ['alumno-04'] },
    { id_clase: 'clase-06', nombre_materia: 'Matemáticas', grado_asignado: '4to Grado', id_docente_asignado: 'docente-01', studentIds: ['alumno-04'] },
    { id_clase: 'clase-07', nombre_materia: 'Lenguaje', grado_asignado: '4to Grado', id_docente_asignado: 'docente-02', studentIds: ['alumno-04'] },
    { id_clase: 'clase-08', nombre_materia: 'Inglés', grado_asignado: '4to Grado', id_docente_asignado: 'docente-01', studentIds: ['alumno-04'] },
];


const mockPlanificaciones: Planificacion[] = [
    {
        id_planificacion: 'plan-01',
        id_docente: 'docente-01',
        id_clase: 'clase-01',
        semana: 1,
        lapso: 'I Lapso',
        ano_escolar: '2025-2026',
        fecha_creacion: new Date().toISOString(),
        competencia_indicadores: 'Resolver problemas de multiplicación con números decimales.',
        inicio: 'Repaso de las tablas de multiplicar y concepto de decimales.',
        desarrollo: 'Ejercicios prácticos en la pizarra y en el cuaderno. Problemas de la vida real (compras en el supermercado).',
        cierre: 'Crear un problema de multiplicación con decimales en grupos y exponerlo a la clase.',
        recursos_links: 'https://www.ejemplos.co/problemas-con-decimales/',
        status: 'Enviado',
        observaciones: '',
    },
    {
        id_planificacion: 'plan-02',
        id_docente: 'docente-02',
        id_clase: 'clase-02',
        semana: 1,
        lapso: 'I Lapso',
        ano_escolar: '2025-2026',
        fecha_creacion: new Date().toISOString(),
        competencia_indicadores: 'Identificar las partes de una célula animal y vegetal.',
        inicio: 'Lluvia de ideas: ¿De qué estamos hechos los seres vivos?',
        desarrollo: 'Presentación con diapositivas. Dibujo y rotulación de las células en el cuaderno. Uso de microscopios para observar muestras.',
        cierre: 'Comparar los dos tipos de células en un diagrama de Venn.',
        status: 'Aprobado',
        observaciones: 'Excelente planificación. Muy completa y con buenos recursos.',
    },
    {
        id_planificacion: 'plan-03',
        id_docente: 'docente-01',
        id_clase: 'clase-03',
        semana: 2,
        lapso: 'I Lapso',
        ano_escolar: '2025-2026',
        fecha_creacion: new Date().toISOString(),
        competencia_indicadores: 'Conocer los eventos principales de la independencia.',
        inicio: 'Discusión sobre héroes nacionales.',
        desarrollo: 'Línea de tiempo colaborativa.',
        cierre: 'Breve dramatización de un evento.',
        status: 'Borrador',
        observaciones: '',
    }
];

const mockHorarios: Horario[] = [
    { id_horario: 'h-01', id_docente: 'docente-01', id_clase: 'clase-01', dia_semana: 1, hora_inicio: '08:00', hora_fin: '09:00' }, // Lunes 8am, 6to Grado, Matematicas, Juan Perez
    { id_horario: 'h-02', id_docente: 'docente-02', id_clase: 'clase-02', dia_semana: 1, hora_inicio: '08:00', hora_fin: '09:00' }, // Lunes 8am, 5to Grado, Ciencias, Maria Gomez
    { id_horario: 'h-03', id_docente: 'docente-01', id_clase: 'clase-03', dia_semana: 2, hora_inicio: '10:00', hora_fin: '11:00' }, // Martes 10am, 4to Grado, Historia, Juan Perez
    { id_horario: 'h-04', id_docente: 'docente-02', id_clase: 'clase-02', dia_semana: 3, hora_inicio: '09:00', hora_fin: '10:00' }, // Miercoles 9am, 5to Grado, Ciencias, Maria Gomez
];

const mockNotifications: Notification[] = [
    {
        id: 'notif-01',
        recipientId: 'docente-01',
        title: 'Planificación Revisada',
        message: 'Tu planificación de "Sociales" para la Semana 2 ha sido revisada. Por favor, atiende las observaciones.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        isRead: false,
        linkTo: { view: 'planning', params: { planId: 'plan-03' } }
    }
];

// --- CONSTANTS ---
const ASIGNATURAS_POR_NIVEL = {
    "Nivel Preescolar": [
        "Personal y Social", "Relación con el ambiente", "Comunicación y Representación", "Inglés", "EDUCACIÓN FÍSICA Y DEPORTE", "Música", "Arte", "Francés", "Robótica", "Computación", "Ajedrez"
    ],
    "Nivel Primaria": [
        "Matemáticas (EAC)", "Matemáticas (AC)", "Matemáticas (OB)", "Matemáticas (Prob)", "Matemáticas (EV)", "Matemáticas (Geometría)", "Lenguaje (AC)", "Lenguaje (EAC)", "Lenguaje (CL)", "Lenguaje (LO)", "Lenguaje (PT)", "Lenguaje (Gram)", "Ciencias", "Sociales", "Proyecto", "Inglés (reading)", "Inglés (Use of English)", "Inglés (Writting)", "Inglés (Speaking)", "Inglés (Project)", "Inglés (Basic)", "Inglés (Lower)", "Inglés (Upper)", "Evaluación", "Francés", "Literatura", "Música", "Arte", "Tecnología (Robótica)", "Tecnología (Computación)", "Tecnología (financiera)", "Ajedrez", "Ed, Física y Deporte", "Valores", "ADP", "Taller Mañanero", "Metacogción", "Psicomotricidad", "Conciencia fonológica", "Club (Estudiantina)", "Club (Teatro)", "Club (Ajedrez)", "English Club (Board Games Club)", "English Club (Reading Club)", "English Club (Entertainment Club)", "English Club (Drawing and Animation Club)"
    ],
    "Nivel Bachillerato": [
        "MATEMATICA", "Física", "FÍSICA (Inglés)", "QUÍMICA", "BIOLOGÍA", "EDUCACIÓN FÍSICA Y DEPORTE", "CASTELLANO", "GHC (Geografía, Historia y Ciudadanía)", "INGLES", "FRANCES", "COMPUTACION", "ARTE Y PATRIMONIO", "MUSICA", "HUB (Gastronomia)", "HUB (MUN)", "HUB (Música)", "HUB (Robótica/Programación)", "HUB (Arte)", "ELECTIVA (Oratoria)", "ELECTIVA (Inteligencia Artificial)", "ELECTIVA (Seguridad y Prevención de Emergencias)", "ELECTIVA (Edición videos)", "ELECTIVA (Lab de Soluciones Verdes)", "SISTEMAS AMBIENTALES", "TDC (Teoría del Conocimiento)", "CAS (Creatividad, Actividad y Servicio)", "MONOGRAFIA", "GESTION EMPRESARIAL", "CIENCIAS DE LA TIERRA"
    ]
};

const GRADOS = [
    "Maternal", "Pre-Kinder", "Kinder", "Preparatorio",
    "1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado",
    "1er Año", "2do Año", "3er Año", "4to Año", "5to Año",
    "Niveles de Inglés (5to-6to)" // Special option for English levels across 5th and 6th grade
];

// Función helper para generar años escolares desde 2025-2026 hasta 2040-2041
const generateAnosEscolares = (): string[] => {
    const anos: string[] = [];
    for (let inicio = 2025; inicio <= 2040; inicio++) {
        anos.push(`${inicio}-${inicio + 1}`);
    }
    return anos;
};

const ANOS_ESCOLARES = generateAnosEscolares();


// Paleta de colores refinada para materias - Mejor accesibilidad y consistencia
const SUBJECT_COLORS = {
    // Matemáticas - Azul profesional
    MATEMATICAS: '#3B82F6', // Blue-500
    
    // Lenguaje - Rosa suave
    LENGUAJE: '#EC4899', // Pink-500
    
    // Ciencias - Verde natural
    CIENCIAS: '#10B981', // Emerald-500
    
    // Sociales - Naranja cálido (inspirado en colores del colegio)
    SOCIALES: '#F97316', // Orange-500
    
    // Proyecto - Amarillo suave
    PROYECTO: '#FBBF24', // Amber-400
    
    // Inglés - Púrpura
    INGLES: '#8B5CF6', // Violet-500
    
    // Francés - Magenta
    FRANCES: '#D946EF', // Fuchsia-500
    
    // Literatura - Rojo suave
    LITERATURA: '#EF4444', // Red-500
    
    // Música - Verde esmeralda
    MUSICA: '#14B8A6', // Teal-500
    
    // Arte - Rosa vibrante
    ARTE: '#F43F5E', // Rose-500
    
    // Tecnología - Índigo
    TECNOLOGIA: '#6366F1', // Indigo-500
    
    // Ajedrez - Gris neutro
    AJEDREZ: '#6B7280', // Gray-500
    
    // Educación Física - Naranja vibrante
    EDUCACION_FISICA: '#FB923C', // Orange-400
    
    // Valores/ADP - Amarillo del colegio
    VALORES: '#FADB16', // Amarillo Manglar
    
    // Clubes y actividades - Verde del colegio
    CLUBES: '#78AC40', // Verde Manglar
    
    // Default - Gris claro
    DEFAULT: '#E5E7EB', // Gray-200
};

// Función helper para obtener el color de una materia (refinada)
const getSubjectColor = (subjectName: string): string => {
    const normalizedName = subjectName?.trim() || '';

    // Matemáticas
    if (normalizedName.includes('Matemáticas') || normalizedName.includes('MATEMATICA')) {
        return SUBJECT_COLORS.MATEMATICAS;
    }

    // Lenguaje
    if (normalizedName.includes('Lenguaje') || normalizedName.includes('CASTELLANO')) {
        return SUBJECT_COLORS.LENGUAJE;
    }

    // Ciencias (verificar antes que Física sola)
    if (normalizedName === 'Ciencias' || normalizedName.includes('Ciencias') || 
        normalizedName.includes('QUÍMICA') || normalizedName.includes('BIOLOGÍA') ||
        normalizedName.includes('CIENCIAS DE LA TIERRA') || normalizedName.includes('SISTEMAS AMBIENTALES')) {
        return SUBJECT_COLORS.CIENCIAS;
    }

    // Educación Física y Deporte (verificar antes que Física sola)
    if (normalizedName.includes('Deporte') || normalizedName.includes('EDUCACIÓN FÍSICA') || 
        normalizedName.includes('Ed, Física') || normalizedName === 'FÍSICA (Inglés)') {
        return SUBJECT_COLORS.EDUCACION_FISICA;
    }

    // Física (como materia de ciencias)
    if (normalizedName === 'Física') {
        return SUBJECT_COLORS.CIENCIAS;
    }

    // Sociales
    if (normalizedName === 'Sociales' || normalizedName.includes('GHC')) {
        return SUBJECT_COLORS.SOCIALES;
    }

    // Proyecto
    if (normalizedName === 'Proyecto') {
        return SUBJECT_COLORS.PROYECTO;
    }

    // Inglés
    if (normalizedName.includes('Inglés') || normalizedName.includes('English') || normalizedName.includes('INGLES')) {
        return SUBJECT_COLORS.INGLES;
    }

    // Francés
    if (normalizedName === 'Francés' || normalizedName === 'FRANCES') {
        return SUBJECT_COLORS.FRANCES;
    }

    // Literatura
    if (normalizedName === 'Literatura') {
        return SUBJECT_COLORS.LITERATURA;
    }

    // Música
    if (normalizedName === 'Música' || normalizedName === 'MUSICA' || normalizedName.includes('Música')) {
        return SUBJECT_COLORS.MUSICA;
    }

    // Arte
    if (normalizedName === 'Arte' || normalizedName.includes('Arte') || normalizedName.includes('ARTE Y PATRIMONIO')) {
        return SUBJECT_COLORS.ARTE;
    }

    // Tecnología
    if (normalizedName.includes('Tecnología') || normalizedName.includes('Tecnologia') || 
        normalizedName.includes('Computación') || normalizedName.includes('Robótica') || 
        normalizedName.includes('Robotica') || normalizedName.includes('COMPUTACION')) {
        return SUBJECT_COLORS.TECNOLOGIA;
    }

    // Ajedrez
    if (normalizedName === 'Ajedrez') {
        return SUBJECT_COLORS.AJEDREZ;
    }

    // Valores y ADP
    if (normalizedName === 'Valores' || normalizedName === 'ADP') {
        return SUBJECT_COLORS.VALORES;
    }

    // Clubes y actividades especiales
    if (normalizedName.includes('Club') || normalizedName.includes('HUB') || 
        normalizedName === 'Metacognición' || normalizedName === 'Metacogción' ||
        normalizedName === 'Psicomotricidad' || normalizedName.includes('Conciencia')) {
        return SUBJECT_COLORS.CLUBES;
    }

    // Taller Mañanero
    if (normalizedName === 'Taller Mañanero') {
        return SUBJECT_COLORS.PROYECTO;
    }

    // Color por defecto
    return SUBJECT_COLORS.DEFAULT;
};

// Objeto de colores para compatibilidad con código existente (usando paleta refinada)
const subjectColors: { [key: string]: string } = {
    // Matemáticas
    'Matemáticas': SUBJECT_COLORS.MATEMATICAS,
    'Matemáticas (EAC)': SUBJECT_COLORS.MATEMATICAS,
    'Matemáticas (AC)': SUBJECT_COLORS.MATEMATICAS,
    'Matemáticas (OB)': SUBJECT_COLORS.MATEMATICAS,
    'Matemáticas (Prob)': SUBJECT_COLORS.MATEMATICAS,
    'Matemáticas (Geometría)': SUBJECT_COLORS.MATEMATICAS,
    'Matemáticas (EV)': SUBJECT_COLORS.MATEMATICAS,
    'MATEMATICA': SUBJECT_COLORS.MATEMATICAS,

    // Lenguaje
    'Lenguaje': SUBJECT_COLORS.LENGUAJE,
    'Lenguaje (AC)': SUBJECT_COLORS.LENGUAJE,
    'Lenguaje (EAC)': SUBJECT_COLORS.LENGUAJE,
    'Lenguaje (CL)': SUBJECT_COLORS.LENGUAJE,
    'Lenguaje (LO)': SUBJECT_COLORS.LENGUAJE,
    'Lenguaje (PT)': SUBJECT_COLORS.LENGUAJE,
    'Lenguaje (Gram)': SUBJECT_COLORS.LENGUAJE,
    'CASTELLANO': SUBJECT_COLORS.LENGUAJE,

    // Ciencias
    'Ciencias': SUBJECT_COLORS.CIENCIAS,
    'Física': SUBJECT_COLORS.CIENCIAS,
    'QUÍMICA': SUBJECT_COLORS.CIENCIAS,
    'BIOLOGÍA': SUBJECT_COLORS.CIENCIAS,
    'CIENCIAS DE LA TIERRA': SUBJECT_COLORS.CIENCIAS,
    'SISTEMAS AMBIENTALES': SUBJECT_COLORS.CIENCIAS,

    // Sociales
    'Sociales': SUBJECT_COLORS.SOCIALES,
    'GHC (Geografía, Historia y Ciudadanía)': SUBJECT_COLORS.SOCIALES,

    // Proyecto
    'Proyecto': SUBJECT_COLORS.PROYECTO,
    'Taller Mañanero': SUBJECT_COLORS.PROYECTO,

    // Inglés
    'Inglés': SUBJECT_COLORS.INGLES,
    'Inglés (reading)': SUBJECT_COLORS.INGLES,
    'Inglés (Use of English)': SUBJECT_COLORS.INGLES,
    'Inglés (Writing)': SUBJECT_COLORS.INGLES,
    'Inglés (Writting)': SUBJECT_COLORS.INGLES,
    'Inglés (Speaking)': SUBJECT_COLORS.INGLES,
    'Inglés (Project)': SUBJECT_COLORS.INGLES,
    'Inglés (Basic)': SUBJECT_COLORS.INGLES,
    'Inglés (Lower)': SUBJECT_COLORS.INGLES,
    'Inglés (Upper)': SUBJECT_COLORS.INGLES,
    'INGLES': SUBJECT_COLORS.INGLES,
    'English Club (Board Games Club)': SUBJECT_COLORS.INGLES,
    'English Club (Reading Club)': SUBJECT_COLORS.INGLES,
    'English Club (Entertainment Club)': SUBJECT_COLORS.INGLES,
    'English Club (Drawing and Animation Club)': SUBJECT_COLORS.INGLES,

    // Francés
    'Francés': SUBJECT_COLORS.FRANCES,
    'FRANCES': SUBJECT_COLORS.FRANCES,

    // Literatura
    'Literatura': SUBJECT_COLORS.LITERATURA,

    // Música
    'Música': SUBJECT_COLORS.MUSICA,
    'MUSICA': SUBJECT_COLORS.MUSICA,
    'HUB (Música)': SUBJECT_COLORS.MUSICA,

    // Arte
    'Arte': SUBJECT_COLORS.ARTE,
    'ARTE Y PATRIMONIO': SUBJECT_COLORS.ARTE,
    'HUB (Arte)': SUBJECT_COLORS.ARTE,

    // Tecnología
    'Tecnología (Robótica)': SUBJECT_COLORS.TECNOLOGIA,
    'Tecnología (Computación)': SUBJECT_COLORS.TECNOLOGIA,
    'Tecnología (financiera)': SUBJECT_COLORS.TECNOLOGIA,
    'Tecnología (Financiera)': SUBJECT_COLORS.TECNOLOGIA,
    'Robótica': SUBJECT_COLORS.TECNOLOGIA,
    'Computación': SUBJECT_COLORS.TECNOLOGIA,
    'COMPUTACION': SUBJECT_COLORS.TECNOLOGIA,
    'HUB (Robótica/Programación)': SUBJECT_COLORS.TECNOLOGIA,

    // Ajedrez
    'Ajedrez': SUBJECT_COLORS.AJEDREZ,
    'Club (Ajedrez)': SUBJECT_COLORS.AJEDREZ,

    // Educación Física y Deporte
    'Ed, Física y Deporte': SUBJECT_COLORS.EDUCACION_FISICA,
    'EDUCACIÓN FÍSICA Y DEPORTE': SUBJECT_COLORS.EDUCACION_FISICA,
    'FÍSICA (Inglés)': SUBJECT_COLORS.EDUCACION_FISICA,

    // Valores y ADP
    'Valores': SUBJECT_COLORS.VALORES,
    'ADP': SUBJECT_COLORS.VALORES,

    // Clubes y actividades
    'Metacognición': SUBJECT_COLORS.CLUBES,
    'Metacogción': SUBJECT_COLORS.CLUBES,
    'Psicomotricidad': SUBJECT_COLORS.CLUBES,
    'Conciencia fonológica': SUBJECT_COLORS.CLUBES,
    'Conciencia Fonológica': SUBJECT_COLORS.CLUBES,
    'Club (Teatro)': SUBJECT_COLORS.CLUBES,
    'Club (Estudiantina)': SUBJECT_COLORS.CLUBES,
    'Club (Música)': SUBJECT_COLORS.CLUBES,

    // Otras materias (default)
    'Evaluación': SUBJECT_COLORS.DEFAULT,
    'Personal y Social': SUBJECT_COLORS.DEFAULT,
    'Relación con el ambiente': SUBJECT_COLORS.DEFAULT,
    'Comunicación y Representación': SUBJECT_COLORS.DEFAULT,
    'HUB (Gastronomia)': SUBJECT_COLORS.CLUBES,
    'HUB (MUN)': SUBJECT_COLORS.CLUBES,
    'ELECTIVA (Oratoria)': SUBJECT_COLORS.DEFAULT,
    'ELECTIVA (Inteligencia Artificial)': SUBJECT_COLORS.DEFAULT,
    'ELECTIVA (Seguridad y Prevención de Emergencias)': SUBJECT_COLORS.DEFAULT,
    'ELECTIVA (Edición videos)': SUBJECT_COLORS.DEFAULT,
    'ELECTIVA (Lab de Soluciones Verdes)': SUBJECT_COLORS.DEFAULT,
    'TDC (Teoría del Conocimiento)': SUBJECT_COLORS.DEFAULT,
    'CAS (Creatividad, Actividad y Servicio)': SUBJECT_COLORS.DEFAULT,
    'MONOGRAFIA': SUBJECT_COLORS.DEFAULT,
    'GESTION EMPRESARIAL': SUBJECT_COLORS.DEFAULT,

    // Default
    'default': SUBJECT_COLORS.DEFAULT,
};


const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TIME_SLOTS_STANDARD = [
    "07:30 - 08:15", "08:15 - 09:00", "09:00 - 09:45", "09:45 - 10:30",
    "10:30 - 11:15", "11:15 - 12:00", "12:00 - 01:00", "01:00 - 01:45",
    "01:45 - 02:30", "02:30 - 03:15"
];
const TIME_SLOTS_PRIMARIA = [
    "07:30 - 08:00", "08:00 - 08:45", "08:45 - 09:30", "09:30 - 10:00", "10:00 - 10:45",
    "10:45 - 11:30", "11:30 - 12:15", "12:15 - 12:45", "12:45 - 01:15", "01:15 - 02:00",
    "02:00 - 02:45", "02:45 - 03:30"
];

// --- HELPER FUNCTIONS ---

const getWeekNumber = (startDate: Date): number => {
    const today = new Date();
    const start = new Date(startDate);
    const diff = today.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const calculatedWeek = Math.floor(diff / oneWeek) + 1;
    // A school term is 18 weeks. Clamp the week number to be within 1-18.
    return Math.min(18, Math.max(1, calculatedWeek));
};

// Función helper para obtener el color del grado según la especificación
const getGradeColor = (grade: string): string => {
    const gradeColors: { [key: string]: string } = {
        '1er Grado': '#00ff01',
        '2do Grado': '#99cdff',
        '3er Grado': '#ff00fe',
        '4to Grado': '#99cdff',
        '5to Grado': '#3e85c7',
        '6to Grado': '#00ffff',
    };

    return gradeColors[grade] || '#F3F4F6'; // Color por defecto si no se encuentra
};

// Función helper para convertir hex a rgba con opacidad
const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Función para calcular las clases de hoy
const calculateClassesToday = async (
    schedules: WeeklySchedules,
    anoEscolar: string = '2025-2026'
): Promise<number> => {
    const today = new Date();

    // Obtener el día de la semana (JavaScript: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    // Sistema: 1 = Lunes, 2 = Martes, ..., 5 = Viernes
    const jsDayOfWeek = today.getDay();

    // Si es fin de semana, no hay clases
    if (jsDayOfWeek === 0 || jsDayOfWeek === 6) {
        return 0;
    }

    // Convertir a formato del sistema (1 = Lunes, 5 = Viernes)
    const systemDayOfWeek = jsDayOfWeek;

    try {
        // Obtener la semana actual basada en la fecha de hoy
        const semanaInfo = await getWeekFromDate(today, anoEscolar);

        if (!semanaInfo) {
            // Si no hay semana activa, retornar 0
            return 0;
        }

        const currentWeek = semanaInfo.numero_semana;
        const currentLapso = semanaInfo.lapso;

        let count = 0;

        // Iterar sobre todos los grados
        for (const grade in schedules) {
            // Obtener horarios de la semana actual
            const horarios = schedules[grade]?.[currentWeek] || [];

            // Contar horarios del día actual que son clases (tienen id_clase)
            // y que coinciden con el lapso actual (si está disponible)
            count += horarios.filter(h => {
                const isToday = h.dia_semana === systemDayOfWeek;
                const isClass = h.id_clase !== null && h.id_clase !== undefined;
                const matchesLapso = !h.lapso || h.lapso === currentLapso;

                return isToday && isClass && matchesLapso;
            }).length;
        }

        return count;
    } catch (error) {
        console.error('Error calculating classes today:', error);
        // En caso de error, hacer un cálculo simple sin considerar lapso
        let count = 0;
        for (const grade in schedules) {
            for (const week in schedules[grade]) {
                const horarios = schedules[grade][parseInt(week)];
                count += horarios.filter(h =>
                    h.dia_semana === systemDayOfWeek &&
                    h.id_clase !== null &&
                    h.id_clase !== undefined
                ).length;
            }
        }
        return count;
    }
};

// --- UI COMPONENTS ---

const Header: React.FC<{
    title: string;
    currentUser: Usuario;
    onLogout: () => void;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMenuToggle?: () => void;
}> = ({ title, currentUser, onLogout, notifications, onNotificationClick, onMenuToggle }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const unreadCount = useMemo(() =>
        notifications.filter(n => !n.isRead && n.recipientId === currentUser.docenteId).length,
        [notifications, currentUser.docenteId]
    );

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return Math.floor(seconds) + " segundos";
    }

    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(n => n.recipientId === currentUser.docenteId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notifications, currentUser.docenteId]);

    return (
        <header className="bg-card p-4 flex justify-between items-center sticky top-0 z-30 border-b shadow-sm">
            <div className="flex items-center gap-3">
                {onMenuToggle && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuToggle}
                        className="lg:hidden hover:text-manglar-orange hover:bg-manglar-orange-light"
                        aria-label="Toggle menu"
                    >
                        <MenuIcon className="h-6 w-6" />
                    </Button>
                )}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-manglar-orange to-manglar-orange/80 items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate tracking-tight">{title}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreferences(true)}
                    className="hover:bg-manglar-orange-light focus-ring"
                    aria-label="Preferencias"
                >
                    <Settings className="h-5 w-5" />
                </Button>
                {currentUser.role === 'docente' && (
                    <Popover open={isNotificationsOpen} onOpenChange={setNotificationsOpen}>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="relative hover:text-manglar-orange focus-ring"
                                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
                                aria-expanded={isNotificationsOpen}
                            >
                                <BellIcon className="h-6 w-6" aria-hidden="true" />
                                {unreadCount > 0 && (
                                    <span 
                                        className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-manglar-orange ring-2 ring-background animate-pulse-gentle"
                                        aria-hidden="true"
                                    />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <Card className="border-0 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Notificaciones</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-96 overflow-y-auto">
                                        {filteredNotifications.length > 0 ? (
                                            filteredNotifications.map(n => (
                                                <button
                                                    key={n.id}
                                                    onClick={() => { onNotificationClick(n); setNotificationsOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-manglar-orange-light transition-colors border-b last:border-0 focus-ring rounded ${!n.isRead ? 'bg-manglar-orange-light border-l-4 border-manglar-orange' : ''
                                                        }`}
                                                    aria-label={`${n.title}. ${n.message}`}
                                                    role="menuitem"
                                                >
                                                    <p className="font-semibold text-foreground">{n.title}</p>
                                                    <p className="text-muted-foreground text-xs font-light mt-1">{n.message}</p>
                                                    <p className="text-right text-xs text-muted-foreground font-light mt-1">
                                                        {timeSince(n.timestamp)} ago
                                                    </p>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8 font-light text-sm">
                                                No hay notificaciones.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </PopoverContent>
                    </Popover>
                )}
                <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            className="flex items-center gap-2 text-left h-auto p-2 focus-ring"
                            aria-label="Menú de usuario"
                            aria-expanded={isMenuOpen}
                            aria-haspopup="true"
                        >
                            <div className="hidden sm:block text-left">
                                <p className="font-semibold text-foreground text-sm sm:text-base">{currentUser.fullName}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground font-light capitalize">{currentUser.role}</p>
                            </div>
                            <div className="sm:hidden">
                                <UserCircleIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            </div>
                            <ChevronDownIcon className="hidden sm:block h-4 w-4" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" role="menu" aria-label="Menú de usuario">
                        <DropdownMenuItem 
                            onClick={onLogout} 
                            className="cursor-pointer focus-ring"
                            role="menuitem"
                            aria-label="Cerrar sesión"
                        >
                            <LogoutIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                            Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

const Sidebar: React.FC<{
    activeView: string;
    onNavigate: (view: string) => void;
    userRole: UserRole;
    isOpen: boolean;
    onClose: () => void;
}> = ({ activeView, onNavigate, userRole, isOpen, onClose }) => {
    interface NavLink {
        id: string;
        label: string;
        icon: React.FC<{ className?: string }>;
        roles: UserRole[];
        category?: string;
    }

    interface NavCategory {
        id: string;
        label: string;
        roles: UserRole[];
    }

    const navLinks: NavLink[] = [
        // 📊 Análisis
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['directivo', 'coordinador', 'docente', 'administrativo'], category: 'analisis' },
        
        // 👥 Gestión
        { id: 'students', label: 'Alumnos', icon: StudentsIcon, roles: ['directivo', 'coordinador', 'administrativo'], category: 'gestion' },
        { id: 'teachers', label: 'Docentes', icon: TeachersIcon, roles: ['directivo', 'coordinador'], category: 'gestion' },
        { id: 'authorized-users', label: 'Gestión de Usuarios', icon: UsersIcon, roles: ['directivo', 'coordinador'], category: 'gestion' },
        
        // 📅 Planificación
        { id: 'schedules', label: 'Horarios', icon: CalendarIcon, roles: ['coordinador', 'directivo', 'docente'], category: 'planificacion' },
        { id: 'schedule-generator', label: 'Generador de Horarios', icon: ScheduleGeneratorIcon, roles: ['coordinador', 'directivo'], category: 'planificacion' },
        { id: 'team-schedules', label: 'Horarios Equipo', icon: TeamSchedulesIcon, roles: ['coordinador', 'directivo'], category: 'planificacion' },
        { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['directivo', 'coordinador', 'docente'], category: 'planificacion' },
        { id: 'planning', label: 'Planificaciones', icon: PlanningIcon, roles: ['directivo', 'coordinador', 'docente'], category: 'planificacion' },
        
        // ✅ Evaluación
        { id: 'evaluation', label: 'Evaluación', icon: EvaluationIcon, roles: ['directivo', 'coordinador'], category: 'evaluacion' },
        { id: 'indicadores', label: 'Indicadores', icon: ClipboardCheckIcon, roles: ['directivo', 'coordinador'], category: 'evaluacion' },
        { id: 'lapsos-admin', label: 'Gestión de Lapsos', icon: CalendarIcon, roles: ['coordinador', 'directivo'], category: 'evaluacion' },
    ];

    const categories: NavCategory[] = [
        { id: 'analisis', label: 'Análisis', roles: ['directivo', 'coordinador', 'docente', 'administrativo'] },
        { id: 'gestion', label: 'Gestión', roles: ['directivo', 'coordinador', 'administrativo'] },
        { id: 'planificacion', label: 'Planificación', roles: ['directivo', 'coordinador', 'docente'] },
        { id: 'evaluacion', label: 'Evaluación', roles: ['directivo', 'coordinador'] },
    ];

    // Filtrar links basado en el rol del usuario
    const navLinksToRender = useMemo(() => {
        return navLinks.filter(link => link.roles.includes(userRole));
    }, [userRole]);

    const categoriesToRender = useMemo(() => {
        return categories.filter(cat => {
            const hasLinksInCategory = navLinksToRender.some(link => link.category === cat.id);
            return hasLinksInCategory;
        });
    }, [navLinksToRender]);

    const getLinksByCategory = (categoryId: string) => {
        return navLinksToRender.filter(link => link.category === categoryId);
    };

    const handleNavigate = (view: string) => {
        onNavigate(view);
        onClose(); // Close mobile menu after navigation
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gradient-to-b from-apple-gray-dark to-[#151518] text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Header con logo/identidad */}
                <div className="p-4 lg:p-6 flex justify-between items-center border-b border-white/10">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-manglar-orange to-manglar-orange/80 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <h2 className="text-xl lg:text-2xl font-bold text-white">ManglarNet</h2>
                        </div>
                        <p className="text-xs text-apple-gray font-light ml-10">Colegio El Manglar</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden text-apple-gray hover:text-white hover:bg-white/10"
                        aria-label="Close menu"
                    >
                        <CloseIcon />
                    </Button>
                </div>

                {/* Navegación agrupada */}
                <nav className="flex-1 px-3 lg:px-4 py-4 overflow-y-auto" aria-label="Menú de navegación">
                    {categoriesToRender.map((category) => {
                        const links = getLinksByCategory(category.id);
                        if (links.length === 0) return null;

                        return (
                            <div key={category.id} className="mb-6">
                                <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider px-3 mb-2" id={`nav-category-${category.id}`}>
                                    {category.label}
                                </h3>
                                <div className="space-y-1" role="group" aria-labelledby={`nav-category-${category.id}`}>
                                    {links.map(({ id, label, icon: Icon }) => (
                                        <Button
                                            key={id}
                                            variant="ghost"
                                            onClick={() => handleNavigate(id)}
                                            className={`w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium transition-apple hover-lift-smooth focus-ring ${
                                                activeView === id
                                                    ? 'bg-manglar-orange text-white shadow-lg shadow-manglar-orange/20'
                                                    : 'text-apple-gray hover:bg-white/10 hover:text-white'
                                            }`}
                                            aria-label={label}
                                            aria-current={activeView === id ? 'page' : undefined}
                                            role="menuitem"
                                        >
                                            <Icon className={`h-5 w-5 flex-shrink-0 ${activeView === id ? 'text-white' : ''}`} aria-hidden="true" />
                                            <span className="text-left">{label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

// ============================================
// COORDINATOR DASHBOARD WIDGETS
// ============================================

// Widget 1: Mi Agenda del Día (Lista de Tareas)
const MiAgendaDelDiaWidget: React.FC<{ currentUser: Usuario }> = React.memo(({ currentUser }) => {
    const [tareas, setTareas] = useState<TareaCoordinador[]>([]);
    const [nuevaTarea, setNuevaTarea] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const loadTareas = async () => {
            // No cargar tareas para usuario por defecto (UUID todo ceros)
            if (!currentUser.id || currentUser.id === '00000000-0000-0000-0000-000000000000') {
                setIsLoading(false);
                setTareas([]);
                return;
            }

            try {
                setIsLoading(true);
                const tareasData = await tareasCoordinadorService.getByUsuario(currentUser.id);
                setTareas(tareasData);
            } catch (error: any) {
                console.error('Error loading tareas:', error);
                // Si la tabla no existe aún, simplemente mostrar lista vacía
                if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                    console.warn('Tabla tareas_coordinador no existe aún. Ejecuta la migración 020_create_tareas_coordinador.sql');
                    setTareas([]);
                } else {
                    // Para otros errores, mostrar mensaje
                    console.error('Error desconocido:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadTareas();
    }, [currentUser.id]);

    const handleAddTarea = async () => {
        // No permitir agregar tareas para usuario por defecto
        if (!nuevaTarea.trim() || !currentUser.id || currentUser.id === '00000000-0000-0000-0000-000000000000') {
            if (currentUser.id === '00000000-0000-0000-0000-000000000000') {
                alert('No se pueden agregar tareas con el usuario por defecto. Por favor, inicia sesión con una cuenta válida.');
            }
            return;
        }

        try {
            setIsAdding(true);
            const nueva = await tareasCoordinadorService.create({
                id_usuario: currentUser.id,
                descripcion: nuevaTarea.trim(),
                completada: false,
                prioridad: 'Normal'
            });
            setTareas(prev => [nueva, ...prev]);
            setNuevaTarea('');
        } catch (error: any) {
            console.error('Error adding tarea:', error);
            if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                alert('La tabla de tareas aún no está creada. Por favor, ejecuta la migración SQL 020_create_tareas_coordinador.sql en Supabase.');
            } else {
                alert('Error al agregar la tarea. Por favor, inténtalo de nuevo.');
            }
        } finally {
            setIsAdding(false);
        }
    };

    const handleToggleCompletada = async (id: string, completada: boolean) => {
        try {
            const updated = await tareasCoordinadorService.update(id, { completada: !completada });
            setTareas(prev => prev.map(t => t.id_tarea === id ? updated : t));
        } catch (error) {
            console.error('Error updating tarea:', error);
            alert('Error al actualizar la tarea. Por favor, inténtalo de nuevo.');
        }
    };

    const handleDeleteTarea = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

        try {
            await tareasCoordinadorService.delete(id);
            setTareas(prev => prev.filter(t => t.id_tarea !== id));
        } catch (error) {
            console.error('Error deleting tarea:', error);
            alert('Error al eliminar la tarea. Por favor, inténtalo de nuevo.');
        }
    };

    const tareasPendientes = tareas.filter(t => !t.completada);
    const tareasCompletadas = tareas.filter(t => t.completada);

    if (isLoading) {
        return (
            <Card className="mb-16">
                <CardHeader>
                    <CardTitle>Mi Agenda del Día</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-16">
            <CardHeader>
                <CardTitle>Mi Agenda del Día</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Gestiona tus tareas diarias</p>
            </CardHeader>
            <CardContent>
                <div className="mb-10 flex gap-3">
                    <Input
                        type="text"
                        value={nuevaTarea}
                        onChange={(e) => setNuevaTarea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTarea()}
                        placeholder="Agregar nueva tarea..."
                        disabled={isAdding}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleAddTarea}
                        disabled={isAdding || !nuevaTarea.trim()}
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </div>

                {tareasPendientes.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-2.5 h-2.5 bg-destructive rounded-full"></div>
                            <h4 className="text-base font-semibold text-foreground">Pendientes ({tareasPendientes.length})</h4>
                        </div>
                        <div className="space-y-2">
                            {tareasPendientes.map((tarea) => (
                                <div key={tarea.id_tarea} className="flex items-center gap-4 py-4 px-2 border-b hover:bg-accent/50 group rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={tarea.completada}
                                        onChange={() => handleToggleCompletada(tarea.id_tarea, tarea.completada)}
                                        className="h-5 w-5 text-primary focus:ring-primary border-input rounded cursor-pointer transition-colors flex-shrink-0"
                                    />
                                    <span className="flex-1 text-base font-normal text-foreground leading-relaxed">{tarea.descripcion}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTarea(tarea.id_tarea)}
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive"
                                        title="Eliminar tarea"
                                    >
                                        <DeleteIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tareasCompletadas.length > 0 && (
                    <div>
                        <details className="group">
                            <summary className="text-sm font-medium text-muted-foreground cursor-pointer list-none hover:text-foreground transition-colors mb-4 py-2">
                                <span className="flex items-center gap-2">
                                    <CheckIcon className="h-4 w-4 text-primary" />
                                    <span>Completadas ({tareasCompletadas.length})</span>
                                    <ChevronDownIcon className="h-4 w-4 transform group-open:rotate-180 transition-transform" />
                                </span>
                            </summary>
                            <div className="mt-2 space-y-2">
                                {tareasCompletadas.map((tarea) => (
                                    <div key={tarea.id_tarea} className="flex items-center gap-4 py-4 px-2 border-b opacity-70">
                                        <input
                                            type="checkbox"
                                            checked={tarea.completada}
                                            onChange={() => handleToggleCompletada(tarea.id_tarea, tarea.completada)}
                                            className="h-5 w-5 text-primary focus:ring-primary border-input rounded cursor-pointer transition-colors flex-shrink-0"
                                        />
                                        <span className="flex-1 text-base text-muted-foreground line-through font-light leading-relaxed">{tarea.descripcion}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTarea(tarea.id_tarea)}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            title="Eliminar tarea"
                                        >
                                            <DeleteIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                )}

                {tareas.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-foreground text-base font-light mb-2">No hay tareas pendientes</p>
                        <p className="text-muted-foreground text-sm font-light">Agrega una nueva tarea para comenzar</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
MiAgendaDelDiaWidget.displayName = 'MiAgendaDelDiaWidget';

// Widget 2: Eventos de la Semana
const EventosSemanaWidget: React.FC = React.memo(() => {
    const [eventos, setEventos] = useState<EventoCalendario[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadEventos = async () => {
            try {
                setIsLoading(true);
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                const eventosData = await eventosCalendarioService.getByDateRange(
                    today.toISOString(),
                    nextWeek.toISOString()
                );

                // Ordenar por fecha y limitar a 7 eventos
                const eventosOrdenados = eventosData
                    .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
                    .slice(0, 7);

                setEventos(eventosOrdenados);
            } catch (error) {
                console.error('Error loading eventos:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEventos();
    }, []);

    const getEventColor = (tipo: string): string => {
        const colors: { [key: string]: string } = {
            'Actos Cívicos': '#f0ad4e', // Amarillo
            'Entregas Administrativas': '#d9534f', // Rojo
            'Reuniones de Etapa': '#5bc0de', // Azul
            'Actividades Generales': '#5cb85c' // Verde
        };
        return colors[tipo] || '#6c757d';
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        return days[date.getDay()];
    };

    if (isLoading) {
        return (
            <Card className="mb-16">
                <CardHeader>
                    <CardTitle>Eventos de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-16">
            <CardHeader>
                <CardTitle>Eventos de la Semana</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Próximos 7 días</p>
            </CardHeader>
            <CardContent>
                {eventos.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-foreground text-base font-light mb-2">No hay eventos programados</p>
                        <p className="text-muted-foreground text-sm font-light">Esta semana está libre de eventos</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {eventos.map((evento) => {
                            const color = evento.color || getEventColor(evento.tipo_evento);
                            return (
                                <Card key={evento.id_evento} className="hover:bg-accent/50 transition-colors">
                                    <CardContent className="py-5 px-4">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1"
                                                style={{ backgroundColor: color }}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-3 mb-2">
                                                    <span className="font-semibold text-base text-foreground min-w-[110px] flex-shrink-0">
                                                        {formatDate(evento.fecha_inicio)}
                                                    </span>
                                                    <span className="text-base text-foreground font-medium leading-relaxed">{evento.titulo}</span>
                                                </div>
                                                {evento.descripcion && (
                                                    <p className="text-sm text-muted-foreground font-light mt-2 ml-[122px] leading-relaxed">{evento.descripcion}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
EventosSemanaWidget.displayName = 'EventosSemanaWidget';

// Widget 3: Estado de Mi Equipo
const EstadoMiEquipoWidget: React.FC<{ docentes: Docente[]; planificaciones: Planificacion[] }> = React.memo(({ docentes, planificaciones }) => {
    const anoEscolar = '2025-2026'; // TODO: Obtener del contexto
    const lapsoActual = 'I Lapso'; // TODO: Obtener del contexto

    const stats = useMemo(() => {
        const totalDocentes = docentes.length;
        const planificacionesEntregadas = planificaciones.filter(
            p => p.ano_escolar === anoEscolar &&
                p.lapso === lapsoActual &&
                (p.status === 'Enviado' || p.status === 'Revisado' || p.status === 'Aprobado')
        ).length;

        return {
            total: totalDocentes,
            entregadas: planificacionesEntregadas,
            pendientes: totalDocentes - planificacionesEntregadas,
            porcentaje: totalDocentes > 0 ? Math.round((planificacionesEntregadas / totalDocentes) * 100) : 0
        };
    }, [docentes, planificaciones, anoEscolar, lapsoActual]);

    // Gráfico de dona simple usando SVG
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (stats.porcentaje / 100) * circumference;

    const progressColor = stats.porcentaje >= 80 ? '#10b981' : stats.porcentaje >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <Card className="mb-16">
            <CardHeader>
                <CardTitle>Estado de Mi Equipo</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Planificaciones del lapso</p>
            </CardHeader>
            <CardContent>
                <div className="flex items-start gap-8">
                    <div className="relative flex-shrink-0">
                        <svg width="140" height="140" className="transform -rotate-90">
                            <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                stroke="hsl(var(--muted))"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                stroke={progressColor}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-700 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-foreground">{stats.porcentaje}%</span>
                            <span className="text-sm text-muted-foreground font-medium mt-1">Completado</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4 pt-2">
                        <div className="py-5 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-base font-semibold text-foreground">Entregadas</span>
                                <span className="text-2xl font-bold text-primary">{stats.entregadas}</span>
                            </div>
                            <div className="text-sm text-muted-foreground font-light">de {stats.total} docentes</div>
                        </div>
                        <div className="py-5 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-base font-semibold text-foreground">Pendientes</span>
                                <span className="text-2xl font-bold text-destructive">{stats.pendientes}</span>
                            </div>
                            <div className="text-sm text-muted-foreground font-light">por entregar</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
EstadoMiEquipoWidget.displayName = 'EstadoMiEquipoWidget';

// Widget 4: Alertas de Coco (IA Proactiva)
const AlertasCocoWidget: React.FC = React.memo(() => {
    const [alertas, setAlertas] = useState<LogReunionCoordinacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAlertas = async () => {
            try {
                setIsLoading(true);
                const alertasData = await logReunionesService.getAlertasRecientes(5);
                setAlertas(alertasData);
            } catch (error) {
                console.error('Error loading alertas:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAlertas();
    }, []);

    const getAlertaColor = (tipo: string | null | undefined): string => {
        const colors: { [key: string]: string } = {
            'Académica': '#f0ad4e',
            'Conductual': '#d9534f',
            'Asistencia': '#5bc0de',
            'Otro': '#6c757d'
        };
        return colors[tipo || 'Otro'] || '#6c757d';
    };

    if (isLoading) {
        return (
            <Card className="mb-16">
                <CardHeader>
                    <CardTitle>Alertas de Coco</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-16">
            <CardHeader>
                <CardTitle>Alertas de Coco</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">IA Proactiva</p>
            </CardHeader>
            <CardContent>
                {alertas.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-foreground text-base font-light mb-2">No hay alertas pendientes</p>
                        <p className="text-muted-foreground text-sm font-light">Coco está monitoreando activamente</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alertas.map((alerta) => {
                            const color = getAlertaColor(alerta.tipo_alerta);
                            return (
                                <Card
                                    key={alerta.id_log}
                                    className="hover:bg-accent/50 transition-colors"
                                >
                                    <CardContent className="py-5 px-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span
                                                        className="text-xs font-semibold px-3.5 py-1.5 rounded-full text-white"
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {alerta.tipo_alerta || 'Otro'}
                                                    </span>
                                                    <span className="text-xs font-medium text-foreground bg-muted px-3 py-1.5 rounded-lg">
                                                        {alerta.grado}
                                                    </span>
                                                </div>
                                                <p className="text-base font-semibold text-foreground mb-3 leading-relaxed">{alerta.categoria}</p>
                                                {alerta.descripcion && (
                                                    <p className="text-sm text-muted-foreground font-light mb-4 leading-relaxed">{alerta.descripcion}</p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <BellIcon className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground font-light">
                                                        Aparece en <span className="font-semibold text-foreground">{alerta.frecuencia}</span> reunión{alerta.frecuencia > 1 ? 'es' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
AlertasCocoWidget.displayName = 'AlertasCocoWidget';

const DashboardView: React.FC<{
    stats: { totalStudents: number, totalTeachers: number, classesToday: number };
    currentUser: Usuario;
    schedules: WeeklySchedules;
    clases: Clase[];
    docentes: Docente[];
    alumnos: Alumno[];
    planificaciones?: Planificacion[];
    aulas?: Aula[];
}> = ({ stats, currentUser, schedules, clases, docentes, alumnos, planificaciones = [], aulas = [] }) => {

    if (currentUser.role === 'docente') {
        return <TeacherScheduleDashboard
            schedules={schedules}
            clases={clases}
            docentes={docentes}
            currentUser={currentUser}
            alumnos={alumnos}
            planificaciones={planificaciones}
            aulas={aulas}
        />;
    }

    const studentsByGrade = useMemo(() => {
        const counts: { [key: string]: number } = {};
        for (const student of alumnos) {
            counts[student.salon] = (counts[student.salon] || 0) + 1;
        }
        return counts;
    }, [alumnos]);

    const sortedGrades = useMemo(() => {
        const gradeSet = new Set(Object.keys(studentsByGrade));
        return GRADOS.filter(g => gradeSet.has(g));
    }, [studentsByGrade]);

    const isCoordinator = currentUser.role === 'coordinador' || currentUser.role === 'directivo';

    return (
        <div className="space-y-16 py-8">
            {/* Widgets existentes para todos los roles */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold mb-8 tracking-tight">Resumen de Alumnos por Grado</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {sortedGrades.map((grade) => {
                        const gradeColor = getGradeColor(grade);
                        return (
                            <div
                                key={grade}
                                className="p-8 rounded-2xl text-white transition-apple hover:scale-[1.02]"
                                style={{ backgroundColor: gradeColor }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-5xl font-bold mb-2">{studentsByGrade[grade]}</p>
                                        <p className="text-lg font-semibold">{grade}</p>
                                    </div>
                                    <UsersIcon className="h-10 w-10 opacity-80" />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardContent className="py-6 flex justify-between items-center">
                            <div>
                                <p className="text-4xl font-bold text-foreground mb-2">{stats.totalTeachers}</p>
                                <p className="text-lg text-muted-foreground font-light">Docentes Activos</p>
                            </div>
                            <AcademicCapIcon className="h-12 w-12 text-primary opacity-60" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-6 flex justify-between items-center">
                            <div>
                                <p className="text-4xl font-bold text-foreground mb-2">{stats.classesToday}</p>
                                <p className="text-lg text-muted-foreground font-light">Clases Hoy</p>
                            </div>
                            <CalendarIcon className="h-12 w-12 text-primary opacity-60" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dashboard Analítico para coordinadores */}
            {isCoordinator && (
                <CoordinatorAnalyticsDashboard
                    currentUser={currentUser}
                    alumnos={alumnos}
                    clases={clases}
                    docentes={docentes}
                    planificaciones={planificaciones}
                />
            )}
        </div>
    );
};

// ============================================
// COORDINATOR ANALYTICS DASHBOARD (Power BI Style)
// ============================================

interface CoordinatorAnalyticsDashboardProps {
    currentUser: Usuario;
    alumnos: Alumno[];
    clases: Clase[];
    docentes: Docente[];
    planificaciones: Planificacion[];
}

const CoordinatorAnalyticsDashboard: React.FC<CoordinatorAnalyticsDashboardProps> = ({
    currentUser,
    alumnos,
    clases,
    docentes,
    planificaciones
}) => {
    // Estados de filtros globales
    const [filters, setFilters] = useState({
        lapso: 'I Lapso',
        anoEscolar: '2025-2026',
        evaluacion: 'Todas',
        grado: 'Todos',
        materia: 'Todas',
        docente: 'Todos'
    });

    // Estados de datos
    const [minutas, setMinutas] = useState<MinutaEvaluacion[]>([]);
    const [reuniones, setReuniones] = useState<LogReunionCoordinacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNoteFilter, setSelectedNoteFilter] = useState<string | null>(null);
    const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string | null>(null);

    // Cargar datos
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [minutasData, reunionesData] = await Promise.all([
                    minutasService.getAll(),
                    logReunionesService.getAll()
                ]);
                setMinutas(minutasData);
                setReuniones(reunionesData);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Función para eliminar reunión
    const handleDeleteReunion = async (idLog: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reunión del historial? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await logReunionesService.delete(idLog);
            // Actualizar la lista de reuniones
            const updatedReuniones = await logReunionesService.getAll();
            setReuniones(updatedReuniones);
        } catch (error) {
            console.error('Error al eliminar reunión:', error);
            alert('Error al eliminar la reunión. Por favor, intenta nuevamente.');
        }
    };

    // Verificar si el usuario puede eliminar reuniones (solo coordinadores y directivos)
    const canDeleteReuniones = currentUser?.role === 'coordinador' || currentUser?.role === 'directivo';

    // Filtrar minutas según filtros globales
    const filteredMinutas = useMemo(() => {
        return minutas.filter(m => {
            if (filters.lapso !== 'Todos' && m.lapso !== filters.lapso) return false;
            if (filters.anoEscolar !== 'Todos' && m.ano_escolar !== filters.anoEscolar) return false;
            if (filters.evaluacion !== 'Todas' && m.evaluacion !== filters.evaluacion) return false;
            if (filters.grado !== 'Todos' && m.grado !== filters.grado) return false;
            if (filters.materia !== 'Todas' && m.materia !== filters.materia) return false;
            return true;
        });
    }, [minutas, filters]);

    // Extraer todos los datos de alumnos de las minutas filtradas
    const allStudentData = useMemo(() => {
        const students: Array<{
            nombre: string;
            nota: string;
            grado: string;
            materia: string;
            docente?: string;
            id_alumno?: string;
        }> = [];

        filteredMinutas.forEach(minuta => {
            if (Array.isArray(minuta.datos_alumnos)) {
                minuta.datos_alumnos.forEach((alumno: any) => {
                    const clase = clases.find(c => c.nombre_materia === minuta.materia);
                    const docente = clase ? docentes.find(d => d.id_docente === clase.id_docente) : undefined;
                    students.push({
                        nombre: alumno.nombre_alumno || alumno.nombre || '',
                        nota: alumno.nota || '',
                        grado: minuta.grado,
                        materia: minuta.materia,
                        docente: docente ? `${docente.nombres} ${docente.apellidos}` : undefined,
                        id_alumno: alumno.id_alumno
                    });
                });
            }
        });
        return students;
    }, [filteredMinutas, docentes, clases]);

    // Calcular KPIs
    const kpis = useMemo(() => {
        // Promedio General (convertir notas a números)
        const notasNumericas = allStudentData
            .map(s => {
                const nota = s.nota?.toUpperCase() || '';
                if (nota === 'A' || nota === 'A+') return 5;
                if (nota === 'B+' || nota === 'B') return 4;
                if (nota === 'C+' || nota === 'C') return 3;
                if (nota === 'D' || nota === 'D+') return 2;
                if (nota === 'E') return 1;
                return null;
            })
            .filter((n): n is number => n !== null);

        const promedio = notasNumericas.length > 0
            ? notasNumericas.reduce((a, b) => a + b, 0) / notasNumericas.length
            : 0;

        const promedioLetra = promedio >= 4.5 ? 'A' : promedio >= 3.5 ? 'B+' : promedio >= 2.5 ? 'C' : promedio >= 1.5 ? 'D' : 'E';

        // Alumnos en Riesgo (C, D, E)
        const alumnosRiesgo = allStudentData.filter(s => {
            const nota = s.nota?.toUpperCase() || '';
            return nota === 'C' || nota === 'C+' || nota === 'D' || nota === 'D+' || nota === 'E';
        }).length;

        // Reuniones Completadas
        const reunionesFiltradas = reuniones.filter(r => {
            if (filters.grado !== 'Todos' && r.grado !== filters.grado) return false;
            return true;
        });
        const completadas = reunionesFiltradas.filter(r => r.estado === 'Resuelto' || r.estado === 'Archivado').length;
        const totalReuniones = reunionesFiltradas.length;

        // Dificultad Principal (de analisis_ia)
        const dificultades: { [key: string]: number } = {};
        filteredMinutas.forEach(minuta => {
            if (Array.isArray(minuta.analisis_ia)) {
                minuta.analisis_ia.forEach((dificultad: any) => {
                    const nombre = dificultad.dificultad || dificultad.nombre || '';
                    if (nombre) {
                        dificultades[nombre] = (dificultades[nombre] || 0) + (dificultad.frecuencia || 1);
                    }
                });
            }
        });

        const dificultadPrincipal = Object.entries(dificultades)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

        return {
            promedioGeneral: promedioLetra,
            alumnosRiesgo,
            reunionesCompletadas: `${completadas} / ${totalReuniones}`,
            dificultadPrincipal
        };
    }, [allStudentData, reuniones, filteredMinutas, filters.grado]);

    // Distribución de Notas
    const notaDistribution = useMemo(() => {
        const distribution: { [key: string]: number } = {};
        allStudentData.forEach(s => {
            const nota = s.nota?.toUpperCase() || 'Sin Nota';
            distribution[nota] = (distribution[nota] || 0) + 1;
        });
        return Object.entries(distribution)
            .map(([nota, count]) => ({ nota, count }))
            .sort((a, b) => {
                const order: { [key: string]: number } = { 'A': 5, 'A+': 6, 'B+': 4, 'B': 3, 'C+': 2, 'C': 1, 'D': 0, 'E': -1 };
                return (order[b.nota] || -2) - (order[a.nota] || -2);
            });
    }, [allStudentData]);

    // Top 5 Dificultades
    const topDifficulties = useMemo(() => {
        const dificultades: { [key: string]: number } = {};
        filteredMinutas.forEach(minuta => {
            if (Array.isArray(minuta.analisis_ia)) {
                minuta.analisis_ia.forEach((dificultad: any) => {
                    const nombre = dificultad.dificultad || dificultad.nombre || '';
                    if (nombre) {
                        dificultades[nombre] = (dificultades[nombre] || 0) + (dificultad.frecuencia || 1);
                    }
                });
            }
        });
        return Object.entries(dificultades)
            .map(([nombre, frecuencia]) => ({ nombre, frecuencia }))
            .sort((a, b) => b.frecuencia - a.frecuencia)
            .slice(0, 5);
    }, [filteredMinutas]);

    // Lista de Alumnos en Foco (con drill-down)
    const alumnosEnFoco = useMemo(() => {
        let filtered = allStudentData;

        // Aplicar filtro de nota si está seleccionado
        if (selectedNoteFilter) {
            filtered = filtered.filter(s => s.nota?.toUpperCase() === selectedNoteFilter.toUpperCase());
        }

        // Aplicar filtro de dificultad si está seleccionado
        if (selectedDifficultyFilter) {
            const alumnosConDificultad = new Set<string>();
            filteredMinutas.forEach(minuta => {
                if (Array.isArray(minuta.analisis_ia)) {
                    minuta.analisis_ia.forEach((dificultad: any) => {
                        if ((dificultad.dificultad || dificultad.nombre) === selectedDifficultyFilter) {
                            const estudiantes = dificultad.estudiantes || dificultad.estudiantes_afectados || [];
                            if (Array.isArray(estudiantes)) {
                                estudiantes.forEach((nombre: string) => alumnosConDificultad.add(nombre));
                            }
                        }
                    });
                }
            });
            filtered = filtered.filter(s => alumnosConDificultad.has(s.nombre));
        }

        // Por defecto, mostrar alumnos en riesgo
        if (!selectedNoteFilter && !selectedDifficultyFilter) {
            filtered = filtered.filter(s => {
                const nota = s.nota?.toUpperCase() || '';
                return nota === 'C' || nota === 'C+' || nota === 'D' || nota === 'D+' || nota === 'E';
            });
        }

        return filtered;
    }, [allStudentData, selectedNoteFilter, selectedDifficultyFilter, filteredMinutas]);

    // Estatus de Reuniones
    const estatusReuniones = useMemo(() => {
        return reuniones
            .filter(r => filters.grado === 'Todos' || r.grado === filters.grado)
            .map(r => {
                const docente = docentes.find(d => d.id_docente === r.creado_por || false);
                return {
                    id_log: r.id_log,
                    docente: docente ? `${docente.nombres} ${docente.apellidos}` : 'N/A',
                    materiaGrado: r.materia ? `${r.materia} / ${r.grado}` : r.grado,
                    estado: r.estado || 'Pendiente',
                    fecha: r.fecha_reunion
                };
            })
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [reuniones, filters.grado, docentes]);

    // Obtener opciones únicas para filtros
    const uniqueLapsos = useMemo(() => ['I Lapso', 'II Lapso', 'III Lapso'], []);
    const uniqueAnosEscolares = useMemo(() => {
        const anos = new Set(minutas
            .map(m => m.ano_escolar)
            .filter(a => a && a.trim() !== '') // Filtrar valores vacíos
        );
        return Array.from(anos).sort();
    }, [minutas]);
    const uniqueEvaluaciones = useMemo(() => {
        const evaluaciones = new Set(minutas
            .map(m => m.evaluacion)
            .filter(e => e && e.trim() !== '') // Filtrar valores vacíos
        );
        const evaluacionesList = Array.from(evaluaciones).sort();
        // Si no hay evaluaciones, usar valores por defecto
        if (evaluacionesList.length === 0) {
            return ['Todas', 'I Mensual', 'II Mensual', 'Examen de Lapso'];
        }
        return ['Todas', ...evaluacionesList];
    }, [minutas]);
    const uniqueGrados = useMemo(() => {
        const grados = new Set([
            ...minutas.map(m => m.grado).filter(g => g && g.trim() !== ''),
            ...alumnos.map(a => a.salon).filter(s => s && s.trim() !== '')
        ]);
        return ['Todos', ...Array.from(grados).sort()];
    }, [minutas, alumnos]);
    const uniqueMaterias = useMemo(() => {
        const materias = new Set([
            ...minutas.map(m => m.materia).filter(m => m && m.trim() !== ''),
            ...clases.map(c => c.nombre_materia).filter(m => m && m.trim() !== '')
        ]);
        return ['Todas', ...Array.from(materias).sort()];
    }, [minutas, clases]);
    const uniqueDocentes = useMemo(() => {
        const docentesList = docentes
            .map(d => `${d.nombres} ${d.apellidos}`.trim())
            .filter(d => d !== '') // Filtrar valores vacíos
            .sort();
        return ['Todos', ...docentesList];
    }, [docentes]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Filtros Globales */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros Globales</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label>Lapso</Label>
                            <Select value={filters.lapso} onValueChange={(value) => setFilters(prev => ({ ...prev, lapso: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueLapsos
                                        .filter(lapso => lapso && lapso.trim() !== '') // Filtrar valores vacíos
                                        .map(lapso => (
                                            <SelectItem key={lapso} value={lapso}>{lapso}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Año Escolar</Label>
                            <Select value={filters.anoEscolar} onValueChange={(value) => setFilters(prev => ({ ...prev, anoEscolar: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {uniqueAnosEscolares
                                        .filter(ano => ano && ano.trim() !== '') // Filtrar valores vacíos
                                        .map(ano => (
                                            <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Evaluación</Label>
                            <Select value={filters.evaluacion || 'I Mensual'} onValueChange={(value) => setFilters(prev => ({ ...prev, evaluacion: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione evaluación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueEvaluaciones
                                        .filter(evaluacion => evaluacion && evaluacion.trim() !== '' && evaluacion !== 'Todas') // Filtrar valores vacíos y "Todas"
                                        .map(evaluacion => (
                                            <SelectItem key={evaluacion} value={evaluacion}>{evaluacion}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Grado</Label>
                            <Select value={filters.grado || 'Todos'} onValueChange={(value) => setFilters(prev => ({ ...prev, grado: value === 'Todos' ? '' : value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione grado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {uniqueGrados
                                        .filter(grado => grado && grado.trim() !== '' && grado !== 'Todos') // Filtrar valores vacíos y "Todos"
                                        .map(grado => (
                                            <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Materia</Label>
                            <Select value={filters.materia || 'Todas'} onValueChange={(value) => setFilters(prev => ({ ...prev, materia: value === 'Todas' ? '' : value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione materia" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todas">Todas</SelectItem>
                                    {uniqueMaterias
                                        .filter(materia => materia && materia.trim() !== '' && materia !== 'Todas') // Filtrar valores vacíos y "Todas"
                                        .map(materia => (
                                            <SelectItem key={materia} value={materia}>{materia}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Docente</Label>
                            <Select value={filters.docente || 'Todos'} onValueChange={(value) => setFilters(prev => ({ ...prev, docente: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione docente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {uniqueDocentes
                                        .filter(docente => docente && docente.trim() !== '' && docente !== 'Todos') // Filtrar valores vacíos y "Todos"
                                        .map(docente => (
                                            <SelectItem key={docente} value={docente}>{docente}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fila de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-4xl font-bold text-foreground mb-2">{kpis.promedioGeneral}</p>
                        <p className="text-sm text-muted-foreground font-light">Promedio General</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-4xl font-bold text-destructive mb-2">{kpis.alumnosRiesgo}</p>
                        <p className="text-sm text-muted-foreground font-light">Estudiantes con Nota 'C' o inferior</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-4xl font-bold text-foreground mb-2">{kpis.reunionesCompletadas}</p>
                        <p className="text-sm text-muted-foreground font-light">Reuniones de Seguimiento Realizadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-lg font-semibold text-foreground mb-2 truncate">{kpis.dificultadPrincipal}</p>
                        <p className="text-sm text-muted-foreground font-light">Dificultad Académica #1</p>
                    </CardContent>
                </Card>
            </div>

            {/* Fila de Visualizaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Widget 5: Distribución de Notas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={notaDistribution} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                                <YAxis dataKey="nota" type="category" stroke="hsl(var(--muted-foreground))" width={60} />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    onClick={(data) => {
                                        if (data && data.nota) {
                                            setSelectedNoteFilter(data.nota);
                                            setSelectedDifficultyFilter(null);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                    radius={[0, 4, 4, 0]}
                                >
                                    {notaDistribution.map((entry, index) => {
                                        const notaKey = entry.nota.toUpperCase().replace(/[+-]/g, '');
                                        const color = gradeColors[notaKey] || gradeColors[entry.nota] || '#D1D5DB';
                                        const isSelected = selectedNoteFilter === entry.nota;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={color}
                                                opacity={isSelected ? 1 : 0.8}
                                                style={{
                                                    filter: isSelected ? `drop-shadow(0 2px 4px ${color}60)` : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        {selectedNoteFilter && (
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedNoteFilter(null);
                                        setSelectedDifficultyFilter(null);
                                    }}
                                >
                                    Limpiar Filtro
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Widget 6: Top 5 Dificultades */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Dificultades Detectadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topDifficulties}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="nombre"
                                    stroke="hsl(var(--muted-foreground))"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="frecuencia"
                                    onClick={(data) => {
                                        if (data && data.nombre) {
                                            setSelectedDifficultyFilter(data.nombre);
                                            setSelectedNoteFilter(null);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                    radius={[4, 4, 0, 0]}
                                >
                                    {topDifficulties.map((entry, index) => {
                                        const isSelected = selectedDifficultyFilter === entry.nombre;
                                        // Usar un gradiente de colores basado en la posición (más oscuro para más frecuencia)
                                        const colors = ['#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444'];
                                        const color = colors[Math.min(index, colors.length - 1)];
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={color}
                                                opacity={isSelected ? 1 : 0.8}
                                                style={{
                                                    filter: isSelected ? `drop-shadow(0 2px 4px ${color}60)` : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        {selectedDifficultyFilter && (
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedNoteFilter(null);
                                        setSelectedDifficultyFilter(null);
                                    }}
                                >
                                    Limpiar Filtro
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Fila de Listas de Acción */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Widget 7: Lista de Alumnos en Foco */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Alumnos en Foco</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {alumnosEnFoco.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No hay alumnos que coincidan con los filtros</p>
                            ) : (
                                <div className="divide-y divide-border">
                                    {alumnosEnFoco.map((alumno, index) => (
                                        <div key={index} className="py-3 px-2 hover:bg-accent/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">{alumno.nombre}</p>
                                                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                                        <span>{alumno.grado}</span>
                                                        <span>{alumno.materia}</span>
                                                        {alumno.docente && <span>{alumno.docente}</span>}
                                                    </div>
                                                </div>
                                                {alumno.nota ? (
                                                    <GradeBadge nota={alumno.nota} />
                                                ) : (
                                                    <Badge variant="secondary">-</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Widget 8: Estatus de Reuniones */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estatus de Reuniones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {estatusReuniones.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No hay reuniones registradas</p>
                            ) : (
                                <div className="divide-y divide-border">
                                    {estatusReuniones.map((reunion, index) => (
                                        <div key={reunion.id_log || index} className="py-3 px-2 hover:bg-accent/50 transition-colors">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">{reunion.docente}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{reunion.materiaGrado}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(reunion.fecha).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            reunion.estado === 'Resuelto' || reunion.estado === 'Archivado'
                                                                ? 'default'
                                                                : reunion.estado === 'En Proceso'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                        }
                                                    >
                                                        {reunion.estado}
                                                    </Badge>
                                                    {canDeleteReuniones && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteReunion(reunion.id_log)}
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            title="Eliminar reunión"
                                                        >
                                                            <DeleteIcon className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Widgets Personales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MiAgendaDelDiaWidget currentUser={currentUser} />
                <EventosSemanaWidget />
            </div>
        </div>
    );
};

// ============================================
// WIDGETS PARA DOCENTES
// ============================================

// Widget 1: Resumen de Alumnos por Grado (solo grados del docente)
const ResumenAlumnosDocenteWidget: React.FC<{
    alumnos: Alumno[];
    clases: Clase[];
    currentUser: Usuario;
}> = ({ alumnos, clases, currentUser }) => {
    const studentsByGrade = useMemo(() => {
        // Obtener solo los grados que enseña este docente
        const teacherGrades = new Set<string>();
        clases.forEach(clase => {
            if (clase.id_docente_asignado === currentUser.docenteId) {
                teacherGrades.add(clase.grado_asignado);
            }
        });

        const counts: { [key: string]: number } = {};
        alumnos.forEach(student => {
            if (teacherGrades.has(student.salon)) {
                counts[student.salon] = (counts[student.salon] || 0) + 1;
            }
        });
        return counts;
    }, [alumnos, clases, currentUser.docenteId]);

    const sortedGrades = useMemo(() => {
        const gradeSet = new Set(Object.keys(studentsByGrade));
        return GRADOS.filter(g => gradeSet.has(g));
    }, [studentsByGrade]);

    return (
        <Card className="mb-16">
            <CardHeader>
                <CardTitle className="text-2xl">Mis Alumnos por Grado</CardTitle>
            </CardHeader>
            <CardContent>
                {sortedGrades.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-sm font-light">No tienes alumnos asignados aún</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {sortedGrades.map((grade) => {
                            const gradeColor = getGradeColor(grade);
                            return (
                                <div
                                    key={grade}
                                    className="p-8 rounded-2xl text-white transition-transform hover:scale-[1.02] shadow-md"
                                    style={{ backgroundColor: gradeColor }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-5xl font-bold mb-2">{studentsByGrade[grade]}</p>
                                            <p className="text-lg font-semibold">{grade}</p>
                                        </div>
                                        <UsersIcon className="h-10 w-10 opacity-80" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Widget 2: Mis Clases de Hoy
const MisClasesHoyWidget: React.FC<{
    schedules: WeeklySchedules;
    clases: Clase[];
    currentUser: Usuario;
    aulas: Aula[];
}> = ({ schedules, clases, currentUser, aulas }) => {
    const [classesToday, setClassesToday] = useState<Array<{
        hora: string;
        materia: string;
        grado: string;
        aula?: string;
        id_clase: string;
    }>>([]);

    useEffect(() => {
        const loadClassesToday = async () => {
            try {
                const today = new Date();
                const jsDayOfWeek = today.getDay();

                // Si es fin de semana, no hay clases
                if (jsDayOfWeek === 0 || jsDayOfWeek === 6) {
                    setClassesToday([]);
                    return;
                }

                // Convertir a formato del sistema (1 = Lunes, 5 = Viernes)
                const systemDayOfWeek = jsDayOfWeek;

                // Obtener la semana actual
                const semanaInfo = await getWeekFromDate(today, '2025-2026');
                if (!semanaInfo) {
                    setClassesToday([]);
                    return;
                }

                const currentWeek = semanaInfo.numeroSemana;

                // Obtener todas las clases del docente para hoy
                const todayClasses: Array<{
                    hora: string;
                    materia: string;
                    grado: string;
                    aula?: string;
                    id_clase: string;
                }> = [];

                // Iterar sobre todos los grados en schedules
                Object.keys(schedules).forEach(grado => {
                    const weekSchedule = schedules[grado]?.[currentWeek] || [];
                    weekSchedule.forEach(horario => {
                        if (horario.dia_semana === systemDayOfWeek &&
                            horario.id_docente === currentUser.docenteId) {
                            const clase = clases.find(c => c.id_clase === horario.id_clase);
                            if (clase) {
                                const aula = horario.id_aula
                                    ? aulas.find(a => a.id_aula === horario.id_aula)
                                    : clase.id_aula
                                        ? aulas.find(a => a.id_aula === clase.id_aula)
                                        : null;

                                todayClasses.push({
                                    hora: horario.hora_inicio,
                                    materia: clase.nombre_materia,
                                    grado: grado,
                                    aula: aula?.nombre_aula,
                                    id_clase: clase.id_clase
                                });
                            }
                        }
                    });
                });

                // Ordenar por hora
                todayClasses.sort((a, b) => {
                    const [h1, m1] = a.hora.split(':').map(Number);
                    const [h2, m2] = b.hora.split(':').map(Number);
                    return (h1 * 60 + m1) - (h2 * 60 + m2);
                });

                setClassesToday(todayClasses);
            } catch (error) {
                console.error('Error loading classes today:', error);
                setClassesToday([]);
            }
        };

        loadClassesToday();
    }, [schedules, clases, currentUser.docenteId, aulas]);

    return (
        <Card className="mb-12">
            <CardHeader>
                <CardTitle className="text-xl">Mis Clases de Hoy</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </CardHeader>
            <CardContent>
                {classesToday.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-sm font-light">No hay clases programadas para hoy</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {classesToday.map((clase, index) => (
                            <div key={`${clase.id_clase}-${index}`} className="flex items-center gap-6 py-4 border-b hover:bg-accent/50 transition-colors rounded-lg px-2">
                                <div className="flex-shrink-0 w-20 text-left">
                                    <p className="text-base font-semibold text-foreground">{clase.hora}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground mb-1">{clase.materia}</p>
                                    <p className="text-sm text-muted-foreground font-light">{clase.grado} {clase.aula && `• ${clase.aula}`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Widget 4: Planificaciones Pendientes
const PlanificacionesPendientesWidget: React.FC<{
    planificaciones: Planificacion[];
    clases: Clase[];
    currentUser: Usuario;
}> = ({ planificaciones, clases, currentUser }) => {
    const pendientes = useMemo(() => {
        return planificaciones
            .filter(p =>
                p.id_docente === currentUser.docenteId &&
                (p.status === 'Borrador' || p.status === 'Revisado')
            )
            .sort((a, b) => a.semana - b.semana)
            .slice(0, 5);
    }, [planificaciones, currentUser.docenteId, clases]);

    const getStatusColor = (status: string): string => {
        if (status === 'Borrador') return 'bg-yellow-100 text-yellow-800';
        if (status === 'Revisado') return 'bg-apple-blue text-white';
        return 'bg-apple-gray-light text-apple-gray-dark';
    };

    return (
        <Card className="mb-12">
            <CardHeader>
                <CardTitle className="text-xl">Planificaciones Pendientes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</p>
            </CardHeader>
            <CardContent>
                {pendientes.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-sm font-light">¡Todo al día!</p>
                        <p className="text-muted-foreground text-xs font-light mt-2">No tienes planificaciones pendientes</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendientes.map((plan) => {
                            const clase = clases.find(c => c.id_clase === plan.id_clase);
                            return (
                                <div key={plan.id_planificacion} className="flex items-center justify-between py-4 border-b hover:bg-accent/50 transition-colors rounded-lg px-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground mb-1">{clase?.nombre_materia || 'Sin asignatura'}</p>
                                        <p className="text-sm text-muted-foreground font-light">Semana {plan.semana} • {plan.lapso} • {clase?.grado_asignado}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                                        {plan.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Widget 5: Mis Asignaturas y Grados
const MisAsignaturasWidget: React.FC<{
    clases: Clase[];
    alumnos: Alumno[];
    currentUser: Usuario;
}> = ({ clases, alumnos, currentUser }) => {
    const misAsignaturas = useMemo(() => {
        const asignaturasMap = new Map<string, {
            materia: string;
            grados: Set<string>;
            totalAlumnos: number;
        }>();

        clases.forEach(clase => {
            if (clase.id_docente_asignado === currentUser.docenteId) {
                const key = clase.nombre_materia;
                if (!asignaturasMap.has(key)) {
                    asignaturasMap.set(key, {
                        materia: clase.nombre_materia,
                        grados: new Set(),
                        totalAlumnos: 0
                    });
                }
                const asignatura = asignaturasMap.get(key)!;
                asignatura.grados.add(clase.grado_asignado);

                // Contar alumnos de este grado
                const alumnosGrado = alumnos.filter(a => a.salon === clase.grado_asignado);
                asignatura.totalAlumnos += alumnosGrado.length;
            }
        });

        return Array.from(asignaturasMap.values());
    }, [clases, alumnos, currentUser.docenteId]);

    return (
        <Card className="mb-12">
            <CardHeader>
                <CardTitle className="text-xl">Mis Asignaturas</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{misAsignaturas.length} asignatura{misAsignaturas.length !== 1 ? 's' : ''}</p>
            </CardHeader>
            <CardContent>
                {misAsignaturas.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-sm font-light">No tienes asignaturas asignadas</p>
                        <p className="text-muted-foreground text-xs font-light mt-2">Contacta a un coordinador para asignarte clases</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {misAsignaturas.map((asignatura, index) => (
                            <div key={index} className="py-4 border-b hover:bg-accent/50 transition-colors rounded-lg px-2">
                                <p className="font-medium text-foreground mb-3">{asignatura.materia}</p>
                                <div className="flex items-center gap-6 text-sm text-muted-foreground font-light">
                                    <span className="flex items-center gap-2">
                                        <UsersIcon className="h-4 w-4" />
                                        {Array.from(asignatura.grados).join(', ')}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <UserCircleIcon className="h-4 w-4" />
                                        {asignatura.totalAlumnos} alumno{asignatura.totalAlumnos !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Widget 6: Próximos Eventos (similar al de coordinadores)
const EventosDocenteWidget: React.FC = () => {
    const [eventos, setEventos] = useState<EventoCalendario[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadEventos = async () => {
            try {
                setIsLoading(true);
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                const eventosData = await eventosCalendarioService.getByDateRange(
                    today.toISOString(),
                    nextWeek.toISOString()
                );

                const eventosOrdenados = eventosData
                    .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
                    .slice(0, 5);

                setEventos(eventosOrdenados);
            } catch (error) {
                console.error('Error loading eventos:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEventos();
    }, []);

    const getEventColor = (tipo: string): string => {
        const colors: { [key: string]: string } = {
            'Actos Cívicos': '#f0ad4e',
            'Entregas Administrativas': '#d9534f',
            'Reuniones de Etapa': '#5bc0de',
            'Actividades Generales': '#5cb85c'
        };
        return colors[tipo] || '#6c757d';
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        return days[date.getDay()];
    };

    if (isLoading) {
        return (
            <Card className="mb-12">
                <CardHeader>
                    <CardTitle className="text-xl">Próximos Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-12">
            <CardHeader>
                <CardTitle className="text-xl">Próximos Eventos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Próximos 7 días</p>
            </CardHeader>
            <CardContent>
                {eventos.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-sm font-light">No hay eventos programados</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {eventos.map((evento) => {
                            const color = evento.color || getEventColor(evento.tipo_evento);
                            return (
                                <div key={evento.id_evento} className="flex items-center gap-4 py-4 border-b hover:bg-accent/50 transition-colors rounded-lg px-2">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    ></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-sm text-foreground min-w-[100px]">
                                                {formatDate(evento.fecha_inicio)}:
                                            </span>
                                            <span className="text-sm text-foreground font-light">{evento.nombre_evento}</span>
                                        </div>
                                        {evento.responsable && (
                                            <p className="text-xs text-muted-foreground font-light mt-1 ml-[108px]">Resp: {evento.responsable}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Mi Agenda Diaria para Docentes (similar al de coordinadores)
const MiAgendaDocenteWidget: React.FC<{ currentUser: Usuario }> = ({ currentUser }) => {
    const [tareas, setTareas] = useState<TareaCoordinador[]>([]);
    const [nuevaTarea, setNuevaTarea] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const loadTareas = async () => {
            // No cargar tareas para usuario por defecto (UUID todo ceros)
            if (!currentUser.id || currentUser.id === '00000000-0000-0000-0000-000000000000') {
                setIsLoading(false);
                setTareas([]);
                return;
            }

            try {
                setIsLoading(true);
                const tareasData = await tareasCoordinadorService.getByUsuario(currentUser.id);
                setTareas(tareasData);
            } catch (error: any) {
                console.error('Error loading tareas:', error);
                if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                    console.warn('Tabla tareas_coordinador no existe aún. Ejecuta la migración 020_create_tareas_coordinador.sql');
                    setTareas([]);
                } else {
                    console.error('Error desconocido:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadTareas();
    }, [currentUser.id]);

    const handleAddTarea = async () => {
        // No permitir agregar tareas para usuario por defecto
        if (!nuevaTarea.trim() || !currentUser.id || currentUser.id === '00000000-0000-0000-0000-000000000000') {
            if (currentUser.id === '00000000-0000-0000-0000-000000000000') {
                alert('No se pueden agregar tareas con el usuario por defecto. Por favor, inicia sesión con una cuenta válida.');
            }
            return;
        }

        try {
            setIsAdding(true);
            const nueva = await tareasCoordinadorService.create({
                id_usuario: currentUser.id,
                descripcion: nuevaTarea.trim(),
                completada: false,
                prioridad: 'Normal'
            });
            setTareas(prev => [nueva, ...prev]);
            setNuevaTarea('');
        } catch (error: any) {
            console.error('Error adding tarea:', error);
            if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                alert('La tabla de tareas aún no está creada. Por favor, ejecuta la migración SQL 020_create_tareas_coordinador.sql en Supabase.');
            } else {
                alert('Error al agregar la tarea. Por favor, inténtalo de nuevo.');
            }
        } finally {
            setIsAdding(false);
        }
    };

    const handleToggleCompletada = async (id: string, completada: boolean) => {
        try {
            const updated = await tareasCoordinadorService.update(id, { completada: !completada });
            setTareas(prev => prev.map(t => t.id_tarea === id ? updated : t));
        } catch (error) {
            console.error('Error updating tarea:', error);
            alert('Error al actualizar la tarea. Por favor, inténtalo de nuevo.');
        }
    };

    const handleDeleteTarea = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

        try {
            await tareasCoordinadorService.delete(id);
            setTareas(prev => prev.filter(t => t.id_tarea !== id));
        } catch (error) {
            console.error('Error deleting tarea:', error);
            alert('Error al eliminar la tarea. Por favor, inténtalo de nuevo.');
        }
    };

    const tareasPendientes = tareas.filter(t => !t.completada);
    const tareasCompletadas = tareas.filter(t => t.completada);

    if (isLoading) {
        return (
            <Card className="mb-12">
                <CardHeader>
                    <CardTitle className="text-xl">Mi Agenda del Día</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-12">
            <CardHeader>
                <CardTitle className="text-xl">Mi Agenda del Día</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Gestiona tus tareas diarias</p>
            </CardHeader>
            <CardContent>
                <div className="mb-8 flex gap-3">
                    <Input
                        type="text"
                        value={nuevaTarea}
                        onChange={(e) => setNuevaTarea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTarea()}
                        placeholder="Agregar nueva tarea..."
                        disabled={isAdding}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleAddTarea}
                        disabled={isAdding || !nuevaTarea.trim()}
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </div>

                {tareasPendientes.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-destructive rounded-full"></div>
                            <h4 className="text-sm font-medium text-foreground">Pendientes ({tareasPendientes.length})</h4>
                        </div>
                        <div className="space-y-3">
                            {tareasPendientes.map((tarea) => (
                                <div key={tarea.id_tarea} className="flex items-center gap-4 py-3 border-b hover:bg-accent/50 transition-colors group rounded-lg px-2">
                                    <input
                                        type="checkbox"
                                        checked={tarea.completada}
                                        onChange={() => handleToggleCompletada(tarea.id_tarea, tarea.completada)}
                                        className="h-5 w-5 text-primary focus:ring-primary border-input rounded cursor-pointer transition-colors"
                                    />
                                    <span className="flex-1 text-sm font-light text-foreground">{tarea.descripcion}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTarea(tarea.id_tarea)}
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive"
                                        title="Eliminar tarea"
                                    >
                                        <DeleteIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tareasCompletadas.length > 0 && (
                    <div>
                        <details className="group">
                            <summary className="text-sm font-light text-muted-foreground cursor-pointer list-none hover:text-foreground transition-colors mb-3">
                                <span className="flex items-center gap-2">
                                    <CheckIcon className="h-4 w-4 text-primary" />
                                    <span>Completadas ({tareasCompletadas.length})</span>
                                    <ChevronDownIcon className="h-4 w-4 transform group-open:rotate-180 transition-transform" />
                                </span>
                            </summary>
                            <div className="mt-2 space-y-3">
                                {tareasCompletadas.map((tarea) => (
                                    <div key={tarea.id_tarea} className="flex items-center gap-4 py-3 border-b opacity-60">
                                        <input
                                            type="checkbox"
                                            checked={tarea.completada}
                                            onChange={() => handleToggleCompletada(tarea.id_tarea, tarea.completada)}
                                            className="h-5 w-5 text-primary focus:ring-primary border-input rounded cursor-pointer transition-colors"
                                        />
                                        <span className="flex-1 text-sm text-muted-foreground line-through font-light">{tarea.descripcion}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTarea(tarea.id_tarea)}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            title="Eliminar tarea"
                                        >
                                            <DeleteIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                )}

                {tareas.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-foreground text-sm font-light">No hay tareas pendientes</p>
                        <p className="text-muted-foreground text-xs font-light mt-2">Agrega una nueva tarea para comenzar</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const TeacherScheduleDashboard: React.FC<{
    schedules: WeeklySchedules;
    clases: Clase[];
    docentes: Docente[];
    currentUser: Usuario;
    alumnos: Alumno[];
    planificaciones?: Planificacion[];
    aulas: Aula[];
}> = ({ schedules, clases, docentes, currentUser, alumnos, planificaciones = [], aulas }) => {
    const scheduleTableRef = useRef<HTMLTableElement>(null);
    const [isDownloadMenuOpen, setDownloadMenuOpen] = useState(false);

    const allGrades = useMemo(() => {
        const gradeSet = new Set(alumnos.map(a => a.salon));
        Object.keys(schedules).forEach(grade => gradeSet.add(grade));
        return Array.from(gradeSet).sort();
    }, [schedules, alumnos]);

    const [selectedGrade, setSelectedGrade] = useState(allGrades.length > 0 ? allGrades[0] : '');
    const [currentWeek, setCurrentWeek] = useState<number | null>(null);

    const weeklySchedule = useMemo(() => {
        if (!currentWeek) return [];
        return schedules[selectedGrade]?.[currentWeek] || [];
    }, [schedules, selectedGrade, currentWeek]);

    const isPrimaryGrade = useMemo(() => {
        const gradeNum = parseInt(selectedGrade.match(/\d+/)?.[0] || '0');
        return gradeNum >= 1 && gradeNum <= 6;
    }, [selectedGrade]);

    const timeSlots = isPrimaryGrade ? TIME_SLOTS_PRIMARIA : TIME_SLOTS_STANDARD;

    const handleDownload = useCallback(async (format: 'jpeg' | 'pdf') => {
        if (!scheduleTableRef.current) return;
        setDownloadMenuOpen(false);

        const canvas = await html2canvas(scheduleTableRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const fileName = `horario-${selectedGrade.replace(/\s+/g, '-')}-semana-${currentWeek || 'sin-semana'}`;

        if (format === 'jpeg') {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `${fileName}.jpeg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${fileName}.pdf`);
        }
    }, [selectedGrade, currentWeek]);

    const selectedGradeColor = getGradeColor(selectedGrade);

    return (
        <div className="space-y-6">
            {/* Widget 1: Resumen de Alumnos por Grado */}
            <ResumenAlumnosDocenteWidget
                alumnos={alumnos}
                clases={clases}
                currentUser={currentUser}
            />

            {/* Widgets en grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Widget 2: Mis Clases de Hoy */}
                <MisClasesHoyWidget
                    schedules={schedules}
                    clases={clases}
                    currentUser={currentUser}
                    aulas={aulas}
                />

                {/* Widget 4: Planificaciones Pendientes */}
                <PlanificacionesPendientesWidget
                    planificaciones={planificaciones}
                    clases={clases}
                    currentUser={currentUser}
                />

                {/* Widget 5: Mis Asignaturas */}
                <MisAsignaturasWidget
                    clases={clases}
                    alumnos={alumnos}
                    currentUser={currentUser}
                />

                {/* Mi Agenda Diaria */}
                <MiAgendaDocenteWidget currentUser={currentUser} />
            </div>

            {/* Widget 6: Próximos Eventos */}
            <EventosDocenteWidget />

            {/* Horario de Clases (estilo Apple - sin caja) */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold mb-4 tracking-tight">Mi Horario de Clases</h2>
                <div className="flex flex-wrap justify-between items-center mb-8 gap-6">
                    <div className="flex items-center gap-4">
                        {selectedGrade && (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full shadow-sm border-2 border-white"
                                    style={{ backgroundColor: selectedGradeColor }}
                                    title={`Color del ${selectedGrade}`}
                                ></div>
                                <span className="text-sm font-medium text-apple-gray-dark">{selectedGrade}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4">
                            <select
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                className="px-4 py-2 border border-apple-gray rounded-lg transition-apple focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                                style={{
                                    borderColor: selectedGradeColor
                                }}
                            >
                                {allGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                            </select>
                            <select
                                value={currentWeek || ''}
                                onChange={(e) => setCurrentWeek(e.target.value ? parseInt(e.target.value) : null)}
                                className="px-4 py-2 border border-apple-gray rounded-lg transition-apple focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue min-w-[150px]"
                            >
                                <option value="">Elegir Semana</option>
                                {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
                                    <option key={week} value={week}>Semana {week}</option>
                                ))}
                            </select>
                            <div className="relative">
                                <button
                                    onClick={() => setDownloadMenuOpen(!isDownloadMenuOpen)}
                                    className="flex items-center gap-2 px-4 py-2 border border-apple-gray rounded-lg text-sm font-medium text-apple-gray-dark transition-apple hover:bg-apple-gray-light focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                >
                                    <DownloadIcon />
                                    Descargar
                                </button>
                                {isDownloadMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleDownload('jpeg'); }} className="block px-4 py-2 text-sm text-apple-gray-dark hover:bg-apple-gray-light transition-apple" role="menuitem">
                                                Exportar a JPEG
                                            </a>
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleDownload('pdf'); }} className="block px-4 py-2 text-sm text-apple-gray-dark hover:bg-apple-gray-light transition-apple" role="menuitem">
                                                Exportar a PDF
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {!currentWeek ? (
                    <div className="text-center py-12 text-apple-gray font-light mt-4">
                        <p className="text-lg font-medium">Seleccione una semana para ver el horario</p>
                        <p className="text-sm mt-2">Use el menú desplegable arriba para elegir una semana (1-18)</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-4" >
                        <div
                            className="mb-3 p-3 rounded-lg flex items-center gap-2 shadow-sm"
                            style={{
                                backgroundColor: `${selectedGradeColor}15`, // 15% de opacidad
                                borderLeft: `4px solid ${selectedGradeColor}`
                            }}
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: selectedGradeColor }}
                            ></div>
                            <span className="text-sm font-medium text-apple-gray-dark">
                                Horario de <strong>{selectedGrade}</strong>
                            </span>
                        </div>
                        <table ref={scheduleTableRef} className="min-w-full divide-y divide-gray-200 border bg-white">
                            <thead className="bg-apple-gray-light">
                                <tr>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32"
                                        style={{ backgroundColor: selectedGradeColor }}
                                    >
                                        Hora
                                    </th>
                                    {WEEK_DAYS.map(day => (
                                        <th
                                            key={day}
                                            className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                            style={{ backgroundColor: selectedGradeColor }}
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {timeSlots.map(slot => (
                                    <tr key={slot}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-apple-gray-dark border-r border-apple-gray-light">{slot}</td>
                                        {WEEK_DAYS.map((_, dayIndex) => {
                                            const day = dayIndex + 1;
                                            const item = weeklySchedule.find(s => s.dia_semana === day && s.hora_inicio.startsWith(slot.split(' - ')[0]));
                                            if (item) {
                                                if (item.evento_descripcion) {
                                                    return (
                                                        <td key={`${day}-${slot}`} className="border p-2 align-top text-xs relative h-24 bg-apple-gray-light">
                                                            <div className="font-semibold text-apple-gray-dark flex items-center gap-1">
                                                                <TagIcon className="h-4 w-4 text-apple-gray" />
                                                                {item.evento_descripcion}
                                                            </div>
                                                        </td>
                                                    );
                                                } else if (item.id_clase) {
                                                    const clase = clases.find(c => c.id_clase === item.id_clase);
                                                    const docente = docentes.find(d => d.id_docente === item.id_docente);
                                                    const isCurrentUserClass = item.id_docente === currentUser.docenteId;

                                                    const bgColor = isCurrentUserClass
                                                        ? (subjectColors[clase?.nombre_materia || 'default'] || getSubjectColor(clase?.nombre_materia || ''))
                                                        : '#F3F4F6';

                                                    const textColor = isCurrentUserClass ? 'text-apple-gray-dark' : 'text-apple-gray';

                                                    return (
                                                        <td key={`${day}-${slot}`} className={`border p-2 align-top text-xs relative h-24 ${textColor}`} style={{ backgroundColor: bgColor }}>
                                                            <div className="font-bold">{clase?.nombre_materia}</div>
                                                            {!isCurrentUserClass && docente && (
                                                                <div className="text-apple-gray text-[10px] font-light">{`${docente.nombres} ${docente.apellidos}`}</div>
                                                            )}
                                                        </td>
                                                    );
                                                }
                                            }
                                            return <td key={`${day}-${slot}`} className="border p-2 h-24"></td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// StudentListView is now imported from components/students/StudentListView.tsx
// StudentDetailView is now imported from components/students/StudentDetailView.tsx

const StudentFormModal: React.FC<{
    student: Alumno | null;
    onClose: () => void;
    onSave: (student: Alumno) => void;
}> = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Alumno, 'id_alumno' | 'hermanos'>>({
        nombres: student?.nombres || '',
        apellidos: student?.apellidos || '',
        email_alumno: student?.email_alumno || '',
        lugar_nacimiento: student?.lugar_nacimiento || '',
        estado: student?.estado || '',
        fecha_nacimiento: student?.fecha_nacimiento || '',
        cedula_escolar: student?.cedula_escolar || '',
        condicion: student?.condicion || 'Regular',
        genero: student?.genero || 'Niño',
        salon: student?.salon || GRADOS[0],
        grupo: student?.grupo || 'Grupo 1',
        info_madre: {
            nombre: student?.info_madre?.nombre || '',
            email: student?.info_madre?.email || '',
            telefono: student?.info_madre?.telefono || '',
        },
        info_padre: {
            nombre: student?.info_padre?.nombre || '',
            email: student?.info_padre?.email || '',
            telefono: student?.info_padre?.telefono || '',
        },
        nivel_ingles: student?.nivel_ingles || 'Basic',
    });

    const [hermanosStr, setHermanosStr] = useState(student?.hermanos?.join(', ') || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value,
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalStudentData: Alumno = {
            ...formData,
            hermanos: hermanosStr.split(',').map(s => s.trim()).filter(Boolean),
            id_alumno: student?.id_alumno || '', // ID is handled by parent
        };
        onSave(finalStudentData);
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-6 lg:p-10">
                <DialogHeader className="px-6 pt-6 sm:px-0 sm:pt-0">
                    <DialogTitle className="text-2xl sm:text-3xl">{student ? 'Editar Alumno' : 'Añadir Alumno'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8 px-6 pb-6 sm:px-0 sm:pb-0">
                    {/* Personal Info */}
                    <div className="pb-8">
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Datos Personales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} required />
                            <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                            <InputField label="Email Alumno" name="email_alumno" type="email" value={formData.email_alumno} onChange={handleChange} required />
                            <InputField label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} required />
                            <InputField as="select" label="Género" name="genero" value={formData.genero} onChange={handleChange}>
                                <option value="Niño">Niño</option>
                                <option value="Niña">Niña</option>
                            </InputField>
                            <InputField label="Lugar de Nacimiento" name="lugar_nacimiento" value={formData.lugar_nacimiento} onChange={handleChange} />
                            <InputField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
                        </div>
                    </div>
                    <Separator />
                    {/* Academic Info */}
                    <div className="pb-8">
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Datos Académicos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField label="Cédula Escolar" name="cedula_escolar" value={formData.cedula_escolar} onChange={handleChange} />
                            <InputField as="select" label="Salón/Grado" name="salon" value={formData.salon} onChange={handleChange}>
                                {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                            </InputField>
                            <InputField as="select" label="Grupo" name="grupo" value={formData.grupo} onChange={handleChange}>
                                <option value="Grupo 1">Grupo 1</option>
                                <option value="Grupo 2">Grupo 2</option>
                            </InputField>
                            <InputField as="select" label="Condición" name="condicion" value={formData.condicion} onChange={handleChange}>
                                <option value="Regular">Regular</option>
                                <option value="Nuevo Ingreso">Nuevo Ingreso</option>
                            </InputField>
                            <InputField as="select" label="Nivel de Inglés" name="nivel_ingles" value={formData.nivel_ingles} onChange={handleChange}>
                                <option value="Basic">Basic</option>
                                <option value="Lower">Lower</option>
                                <option value="Upper">Upper</option>
                                <option value="Advanced">Advanced</option>
                                <option value="IB">IB</option>
                            </InputField>
                            <InputField label="Hermanos (separados por coma)" name="hermanos" value={hermanosStr} onChange={(e) => setHermanosStr(e.target.value)} />
                        </div>
                    </div>
                    <Separator />
                    {/* Parent Info */}
                    <div>
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Datos de Representantes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="py-6 space-y-4">
                                <h4 className="font-semibold text-foreground">Madre</h4>
                                <InputField label="Nombre Completo" name="info_madre.nombre" value={formData.info_madre.nombre} onChange={handleChange} required />
                                <InputField label="Email" name="info_madre.email" type="email" value={formData.info_madre.email} onChange={handleChange} required />
                                <InputField label="Teléfono" name="info_madre.telefono" value={formData.info_madre.telefono} onChange={handleChange} required />
                            </div>
                            <div className="py-6 space-y-4">
                                <h4 className="font-semibold text-foreground">Padre</h4>
                                <InputField label="Nombre Completo" name="info_padre.nombre" value={formData.info_padre.nombre} onChange={handleChange} />
                                <InputField label="Email" name="info_padre.email" type="email" value={formData.info_padre.email} onChange={handleChange} />
                                <InputField label="Teléfono" name="info_padre.telefono" value={formData.info_padre.telefono} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    {/* Actions */}
                    <DialogFooter className="px-6 pb-6 sm:px-0 sm:pb-0 mt-8">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Guardar Alumno</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


const TeacherFormModal: React.FC<{
    teacher: Docente | null;
    clases: Clase[];
    aulas: Aula[];
    onClose: () => void;
    onSave: (teacher: Docente, assignments: Assignment[]) => void;
}> = ({ teacher, clases, aulas, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Docente, 'id_docente' | 'id_usuario'>>({
        nombres: teacher?.nombres || '',
        apellidos: teacher?.apellidos || '',
        email: teacher?.email || '',
        telefono: teacher?.telefono || '',
        especialidad: teacher?.especialidad || '',
    });

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

    // Cargar asignaciones existentes cuando se edita un docente
    useEffect(() => {
        const loadExistingAssignments = async () => {
            if (!teacher) {
                setAssignments([]);
                return;
            }

            setIsLoadingAssignments(true);
            try {
                const anoEscolar = '2025-2026'; // TODO: Obtener del contexto
                const loadedAssignments: Assignment[] = [];

                // 1. Cargar clases regulares (no inglés de niveles 5to-6to)
                const regularClasses = clases.filter(c => {
                    if (c.id_docente_asignado !== teacher.id_docente) return false;
                    // Excluir clases consolidadas de inglés 5to-6to (que tienen nivel_ingles: null y skill_rutina)
                    const isConsolidatedEnglish = (c.nombre_materia?.toLowerCase().includes('inglés') ||
                        c.nombre_materia?.toLowerCase().includes('ingles')) &&
                        (c.grado_asignado === '5to Grado' || c.grado_asignado === '6to Grado') &&
                        (c as any).nivel_ingles === null && (c as any).skill_rutina;
                    return !isConsolidatedEnglish;
                });

                regularClasses.forEach(c => {
                    loadedAssignments.push({
                        subject: c.nombre_materia,
                        grade: c.grado_asignado,
                        nivel_ingles: undefined,
                        id_aula: c.id_aula || undefined
                    });
                });

                // 2. Cargar asignaciones de inglés de niveles (5to-6to) desde asignacion_docente_nivel_ingles
                const { data: englishAssignments, error: englishError } = await supabase
                    .from('asignacion_docente_nivel_ingles')
                    .select('nivel_ingles')
                    .eq('id_docente', teacher.id_docente)
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (englishError) {
                    console.error('Error loading English level assignments:', englishError);
                } else if (englishAssignments) {
                    // Cargar aulas para cada nivel
                    const { data: aulasData } = await supabase
                        .from('asignacion_aula_nivel_ingles')
                        .select('nivel_ingles, id_aula')
                        .eq('ano_escolar', anoEscolar)
                        .eq('activa', true);

                    const aulasMap: { [nivel: string]: string } = {};
                    if (aulasData) {
                        aulasData.forEach(item => {
                            aulasMap[item.nivel_ingles] = item.id_aula;
                        });
                    }

                    // Crear asignaciones para cada nivel de inglés (5to y 6to grado)
                    englishAssignments.forEach(assignment => {
                        ['5to Grado', '6to Grado'].forEach(grade => {
                            loadedAssignments.push({
                                subject: 'Inglés',
                                grade: grade,
                                nivel_ingles: assignment.nivel_ingles,
                                id_aula: aulasMap[assignment.nivel_ingles] || undefined
                            });
                        });
                    });
                }

                setAssignments(loadedAssignments);
            } catch (error) {
                console.error('Error loading assignments:', error);
            } finally {
                setIsLoadingAssignments(false);
            }
        };

        loadExistingAssignments();
    }, [teacher, clases]);
    const [currentSubject, setCurrentSubject] = useState('');
    const [currentGrade, setCurrentGrade] = useState('');
    const [currentNivelIngles, setCurrentNivelIngles] = useState('');
    const [currentAula, setCurrentAula] = useState(''); // Aula para asignaciones regulares
    const [englishLevelAulas, setEnglishLevelAulas] = useState<{ [nivel: string]: string }>({}); // Aulas por nivel para inglés
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar aulas asignadas para inglés de niveles al editar un docente
    useEffect(() => {
        const loadEnglishLevelAulas = async () => {
            if (!teacher) {
                setEnglishLevelAulas({});
                return;
            }

            try {
                const anoEscolar = '2025-2026'; // TODO: Obtener del contexto
                const { data, error } = await supabase
                    .from('asignacion_aula_nivel_ingles')
                    .select('nivel_ingles, id_aula')
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (error) throw error;

                // Crear objeto con nivel -> id_aula
                const aulasMap: { [nivel: string]: string } = {};
                if (data) {
                    data.forEach(item => {
                        aulasMap[item.nivel_ingles] = item.id_aula;
                    });
                }
                setEnglishLevelAulas(aulasMap);
            } catch (error) {
                console.error('Error loading English level aulas:', error);
            }
        };

        loadEnglishLevelAulas();
    }, [teacher]);

    // Helper functions for English logic
    const esInglesPrimaria = (subject: string): boolean => {
        const lowerSubject = subject.toLowerCase();
        return lowerSubject.includes('inglés') || lowerSubject.includes('ingles') ||
            lowerSubject.includes('english');
    };

    const esGradoAlto = (grade: string): boolean => {
        return grade === '5to Grado' || grade === '6to Grado';
    };

    const esNivelIngles = (subject: string): boolean => {
        const lowerSubject = subject.toLowerCase();
        return lowerSubject.includes('inglés basic') ||
            lowerSubject.includes('inglés lower') ||
            lowerSubject.includes('inglés upper') ||
            lowerSubject.includes('ingles basic') ||
            lowerSubject.includes('ingles lower') ||
            lowerSubject.includes('ingles upper');
    };

    const extraerNivelDeMateria = (subject: string): string | null => {
        const lowerSubject = subject.toLowerCase();
        if (lowerSubject.includes('basic')) return 'Basic';
        if (lowerSubject.includes('lower')) return 'Lower';
        if (lowerSubject.includes('upper')) return 'Upper';
        return null;
    };

    // Obtener asignaturas disponibles según la especialidad
    const getAvailableSubjects = useMemo(() => {
        const especialidad = formData.especialidad;

        // Si es Teacher, solo mostrar inglés
        if (especialidad === 'Teacher') {
            return [
                { value: 'Inglés', label: 'Inglés' },
                { value: 'Inglés Basic', label: 'Inglés Basic' },
                { value: 'Inglés Lower', label: 'Inglés Lower' },
                { value: 'Inglés Upper', label: 'Inglés Upper' }
            ];
        }

        // Si es Docente Guía o Integralidad, mostrar todas las asignaturas de primaria (excepto inglés de niveles)
        if (especialidad === 'Docente Guía' || especialidad === 'Integralidad') {
            const primariaSubjects = ASIGNATURAS_POR_NIVEL['Nivel Primaria'] || [];
            // Filtrar asignaturas de inglés de niveles (Basic, Lower, Upper) pero mantener Inglés general
            const filtered = primariaSubjects.filter(subj => {
                const lower = subj.toLowerCase();
                return !lower.includes('inglés (basic)') &&
                    !lower.includes('inglés (lower)') &&
                    !lower.includes('inglés (upper)');
            });

            // Agrupar por categorías
            const grouped: { [key: string]: Array<{ value: string, label: string }> } = {
                'Matemáticas': [],
                'Lenguaje': [],
                'Ciencias y Sociales': [],
                'Inglés': [],
                'Especialidades': [],
                'Otros': []
            };

            filtered.forEach(subj => {
                const subjLower = subj.toLowerCase();
                if (subjLower.includes('matemáticas')) {
                    grouped['Matemáticas'].push({ value: subj, label: subj });
                } else if (subjLower.includes('lenguaje') || subjLower.includes('literatura')) {
                    grouped['Lenguaje'].push({ value: subj, label: subj });
                } else if (subjLower.includes('ciencias') || subjLower.includes('sociales') || subjLower.includes('proyecto')) {
                    grouped['Ciencias y Sociales'].push({ value: subj, label: subj });
                } else if (subjLower.includes('inglés')) {
                    grouped['Inglés'].push({ value: subj, label: subj });
                } else if (subjLower.includes('música') || subjLower.includes('arte') || subjLower.includes('tecnología') ||
                    subjLower.includes('física') || subjLower.includes('deporte') || subjLower.includes('valores') ||
                    subjLower.includes('francés') || subjLower.includes('ajedrez')) {
                    grouped['Especialidades'].push({ value: subj, label: subj });
                } else {
                    grouped['Otros'].push({ value: subj, label: subj });
                }
            });

            return grouped;
        }

        // Si es Especialista, mostrar todas las asignaturas
        if (especialidad === 'Especialista') {
            const primariaSubjects = ASIGNATURAS_POR_NIVEL['Nivel Primaria'] || [];
            const grouped: { [key: string]: Array<{ value: string, label: string }> } = {
                'Matemáticas': [],
                'Lenguaje': [],
                'Ciencias y Sociales': [],
                'Inglés': [],
                'Especialidades': [],
                'Otros': []
            };

            primariaSubjects.forEach(subj => {
                const subjLower = subj.toLowerCase();
                if (subjLower.includes('matemáticas')) {
                    grouped['Matemáticas'].push({ value: subj, label: subj });
                } else if (subjLower.includes('lenguaje') || subjLower.includes('literatura')) {
                    grouped['Lenguaje'].push({ value: subj, label: subj });
                } else if (subjLower.includes('ciencias') || subjLower.includes('sociales') || subjLower.includes('proyecto')) {
                    grouped['Ciencias y Sociales'].push({ value: subj, label: subj });
                } else if (subjLower.includes('inglés')) {
                    grouped['Inglés'].push({ value: subj, label: subj });
                } else if (subjLower.includes('música') || subjLower.includes('arte') || subjLower.includes('tecnología') ||
                    subjLower.includes('física') || subjLower.includes('deporte') || subjLower.includes('valores') ||
                    subjLower.includes('francés') || subjLower.includes('ajedrez')) {
                    grouped['Especialidades'].push({ value: subj, label: subj });
                } else {
                    grouped['Otros'].push({ value: subj, label: subj });
                }
            });

            return grouped;
        }

        // Si no hay especialidad seleccionada, no mostrar nada
        return null;
    }, [formData.especialidad]);

    const requiereNivelIngles = (subject: string, grade: string): boolean => {
        return esInglesPrimaria(subject) && esGradoAlto(grade);
    };

    // Validation function for English assignments
    const validarAsignacionIngles = (
        subject: string,
        grade: string,
        nivelIngles: string,
        assignments: Assignment[]
    ): { valida: boolean; error?: string } => {
        if (!esInglesPrimaria(subject)) {
            return { valida: true };
        }

        // Para 1er-4to: Solo puede haber un docente de inglés por grado
        if (!esGradoAlto(grade)) {
            const existeDocente = assignments.some(
                a => a.subject === subject && a.grade === grade
            );
            if (existeDocente) {
                return {
                    valida: false,
                    error: `Ya existe un docente de inglés asignado a ${grade}. En grados 1er-4to solo puede haber un docente de inglés por grado.`
                };
            }
            return { valida: true };
        }

        // Para 5to-6to: Debe tener nivel y no puede haber duplicados del mismo nivel
        if (!nivelIngles || nivelIngles === '') {
            return {
                valida: false,
                error: 'Para grados 5to y 6to, debe seleccionar un nivel de inglés (Basic, Lower o Upper)'
            };
        }

        const existeNivel = assignments.some(
            a => a.subject === subject &&
                a.grade === grade &&
                a.nivel_ingles === nivelIngles
        );
        if (existeNivel) {
            return {
                valida: false,
                error: `Ya existe un docente asignado al nivel ${nivelIngles} para ${grade}`
            };
        }

        return { valida: true };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Si cambia la especialidad, limpiar la asignatura seleccionada
        if (name === 'especialidad') {
            setCurrentSubject('');
            setCurrentGrade('');
            setCurrentNivelIngles('');
            setCurrentAula('');
        }
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.nombres.trim()) {
            newErrors.nombres = 'Los nombres son requeridos';
        }
        if (!formData.apellidos.trim()) {
            newErrors.apellidos = 'Los apellidos son requeridos';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddAssignment = () => {
        const subjectError = !currentSubject.trim() ? 'Seleccione una asignatura' : '';

        // Si es un nivel de inglés, no requiere selección de grado manual
        if (!esNivelIngles(currentSubject)) {
            const gradeError = !currentGrade.trim() ? 'Seleccione un grado' : '';
            if (subjectError || gradeError) {
                setErrors(prev => ({
                    ...prev,
                    assignment: subjectError || gradeError
                }));
                return;
            }
        }

        // Si es un nivel de inglés, extraer el nivel y agregar ambos grados automáticamente
        if (esNivelIngles(currentSubject)) {
            const nivel = extraerNivelDeMateria(currentSubject);
            if (!nivel) {
                setErrors(prev => ({
                    ...prev,
                    assignment: 'Error al detectar el nivel de inglés'
                }));
                return;
            }

            // Validar que no exista este nivel ya asignado
            // Buscar por "Inglés" como subject y nivel_ingles
            const existeNivel5to = assignments.some(a =>
                (a.subject === 'Inglés' || a.subject === currentSubject) &&
                a.grade === '5to Grado' &&
                a.nivel_ingles === nivel
            );
            const existeNivel6to = assignments.some(a =>
                (a.subject === 'Inglés' || a.subject === currentSubject) &&
                a.grade === '6to Grado' &&
                a.nivel_ingles === nivel
            );

            if (existeNivel5to || existeNivel6to) {
                setErrors(prev => ({
                    ...prev,
                    assignment: `Ya existe un docente asignado al nivel ${nivel} para 5to o 6to grado`
                }));
                return;
            }

            // Agregar ambos grados automáticamente
            // Usar "Inglés" como subject base y el nivel en nivel_ingles
            // Para inglés de niveles, el aula se asignará usando asignacion_aula_nivel_ingles
            setAssignments(prev => [...prev,
            {
                subject: 'Inglés',
                grade: '5to Grado',
                nivel_ingles: nivel,
                id_aula: englishLevelAulas[nivel] || undefined // Aula para este nivel
            },
            {
                subject: 'Inglés',
                grade: '6to Grado',
                nivel_ingles: nivel,
                id_aula: englishLevelAulas[nivel] || undefined // Mismo aula para ambos grados
            }
            ]);
        } else {
            // Para inglés regular (1er-4to) o otras materias
            // Validación especial para inglés en 5to-6to
            if (requiereNivelIngles(currentSubject, currentGrade)) {
                if (!currentNivelIngles || currentNivelIngles === '') {
                    setErrors(prev => ({
                        ...prev,
                        assignment: 'Para inglés en 5to y 6to grado, debe seleccionar un nivel'
                    }));
                    return;
                }
            }

            // Validar asignación de inglés
            const validacion = validarAsignacionIngles(
                currentSubject,
                currentGrade,
                currentNivelIngles,
                assignments
            );

            if (!validacion.valida) {
                setErrors(prev => ({
                    ...prev,
                    assignment: validacion.error || 'Error en la asignación'
                }));
                return;
            }

            // Verificar si ya existe esta combinación (considerando nivel para inglés en 5to-6to)
            const exists = requiereNivelIngles(currentSubject, currentGrade)
                ? assignments.some(a =>
                    a.subject === currentSubject &&
                    a.grade === currentGrade &&
                    a.nivel_ingles === currentNivelIngles
                )
                : assignments.some(a =>
                    a.subject === currentSubject &&
                    a.grade === currentGrade
                );

            if (exists) {
                setErrors(prev => ({
                    ...prev,
                    assignment: 'Esta asignación ya está agregada'
                }));
                return;
            }

            // Agregar la asignatura normal
            setAssignments(prev => [...prev, {
                subject: currentSubject.trim(),
                grade: currentGrade.trim(),
                nivel_ingles: requiereNivelIngles(currentSubject, currentGrade)
                    ? currentNivelIngles
                    : undefined,
                id_aula: currentAula || undefined // Incluir aula si está asignada
            }]);
        }

        // Limpiar campos
        setCurrentSubject('');
        setCurrentGrade('');
        setCurrentNivelIngles('');
        setCurrentAula(''); // Limpiar aula también
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.assignment;
            return newErrors;
        });
    };

    const handleRemoveAssignment = (index: number) => {
        setAssignments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar formulario
        if (!validateForm()) {
            return;
        }

        // Validar que haya al menos una asignatura
        if (assignments.length === 0) {
            setErrors(prev => ({
                ...prev,
                assignment: 'Debe agregar al menos una asignatura y grado'
            }));
            return;
        }

        setIsSubmitting(true);
        try {
            const finalTeacherData: Docente = {
                ...formData,
                id_docente: teacher?.id_docente || `docente-${Date.now()}`,
                id_usuario: teacher?.id_usuario || undefined
            };
            await onSave(finalTeacherData, assignments);
        } catch (error) {
            console.error('Error in form submission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 sm:p-6 lg:p-10">
                <DialogHeader className="px-6 pt-6 sm:px-0 sm:pt-0">
                    <DialogTitle className="text-2xl sm:text-3xl">{teacher ? 'Editar Docente' : 'Añadir Docente'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 px-6 pb-6 sm:px-0 sm:pb-0">
                    {/* Información Personal */}
                    <div>
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight pb-4">Información Personal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputField
                                    label="Nombres"
                                    name="nombres"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.nombres && (
                                    <p className="mt-1 text-sm text-destructive">{errors.nombres}</p>
                                )}
                            </div>
                            <div>
                                <InputField
                                    label="Apellidos"
                                    name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.apellidos && (
                                    <p className="mt-1 text-sm text-destructive">{errors.apellidos}</p>
                                )}
                            </div>
                            <div>
                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>
                            <div>
                                <InputField
                                    label="Teléfono"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <InputField
                                    label="Especialidad"
                                    name="especialidad"
                                    value={formData.especialidad}
                                    onChange={handleChange}
                                    as="select"
                                >
                                    <option value="">Seleccione una especialidad</option>
                                    <option value="Docente Guía">Docente Guía</option>
                                    <option value="Integralidad">Integralidad</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Especialista">Especialista</option>
                                </InputField>
                            </div>
                        </div>
                    </div>

                    <Separator />
                    {/* Asignaturas y Grados */}
                    <div className="pt-6">
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Asignaturas y Grados</h3>
                        {isLoadingAssignments && teacher && (
                            <Card className="mb-4 bg-primary/5 border-primary/20">
                                <CardContent className="p-3">
                                    <p className="text-sm text-primary">Cargando asignaciones existentes...</p>
                                </CardContent>
                            </Card>
                        )}
                        <div className="bg-apple-gray-light p-4 rounded-lg border border-apple-gray-light">
                            <div className="flex flex-wrap items-end gap-4 mb-4">
                                <div className="flex-grow min-w-[200px]">
                                    <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                        Asignatura <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={currentSubject}
                                        onChange={e => {
                                            const selectedSubject = e.target.value;
                                            setCurrentSubject(selectedSubject);

                                            // Si es un nivel de inglés, extraer el nivel y auto-seleccionar grados
                                            if (esNivelIngles(selectedSubject)) {
                                                const nivel = extraerNivelDeMateria(selectedSubject);
                                                if (nivel) {
                                                    setCurrentNivelIngles(nivel);
                                                    // Auto-seleccionar ambos grados (se hará en handleAddAssignment)
                                                }
                                            } else {
                                                setCurrentNivelIngles('');
                                            }

                                            if (errors.assignment) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.assignment;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        className={`mt-1 block w-full p-2 border rounded-md ${errors.assignment ? 'border-apple-red' : 'border-apple-gray'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        disabled={isSubmitting || !formData.especialidad}
                                    >
                                        <option value="">
                                            {!formData.especialidad
                                                ? 'Seleccione primero una especialidad'
                                                : 'Seleccione una asignatura'}
                                        </option>
                                        {getAvailableSubjects && (
                                            Array.isArray(getAvailableSubjects) ? (
                                                // Para Teacher: lista simple
                                                <optgroup label="Inglés">
                                                    {getAvailableSubjects.map(subj => (
                                                        <option key={subj.value} value={subj.value}>{subj.label}</option>
                                                    ))}
                                                </optgroup>
                                            ) : (
                                                // Para Docente Guía, Integralidad o Especialista: agrupado por categorías
                                                Object.entries(getAvailableSubjects).map(([category, subjects]) =>
                                                    subjects.length > 0 ? (
                                                        <optgroup key={category} label={category}>
                                                            {subjects.map(subj => (
                                                                <option key={subj.value} value={subj.value}>{subj.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    ) : null
                                                )
                                            )
                                        )}
                                    </select>
                                </div>
                                {!esNivelIngles(currentSubject) && (
                                    <div className="flex-grow min-w-[150px]">
                                        <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                            Grado <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={currentGrade}
                                            onChange={e => {
                                                setCurrentGrade(e.target.value);
                                                // Reset nivel if grade changes and it's not 5to-6to
                                                if (!esGradoAlto(e.target.value) || !esInglesPrimaria(currentSubject)) {
                                                    setCurrentNivelIngles('');
                                                }
                                                if (errors.assignment) {
                                                    setErrors(prev => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.assignment;
                                                        return newErrors;
                                                    });
                                                }
                                            }}
                                            className={`mt-1 block w-full p-2 border rounded-md ${errors.assignment ? 'border-apple-red' : 'border-apple-gray'
                                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Seleccione un grado</option>
                                            {GRADOS.map(grado => <option key={grado} value={grado}>{grado}</option>)}
                                        </select>
                                    </div>
                                )}
                                {esNivelIngles(currentSubject) && (
                                    <>
                                        <div className="flex-grow min-w-[200px]">
                                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                                Grados (se asignarán automáticamente) <span className="text-green-600">*</span>
                                            </label>
                                            <div className="mt-1 p-2 border border-green-300 rounded-md bg-green-50 text-sm text-green-700 font-medium">
                                                5to Grado y 6to Grado
                                            </div>
                                        </div>
                                        <div className="flex-grow min-w-[200px]">
                                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                                Aula/Salón para {extraerNivelDeMateria(currentSubject) || 'este nivel'}
                                            </label>
                                            <select
                                                value={englishLevelAulas[extraerNivelDeMateria(currentSubject) || ''] || ''}
                                                onChange={(e) => {
                                                    const nivel = extraerNivelDeMateria(currentSubject);
                                                    if (nivel) {
                                                        setEnglishLevelAulas(prev => ({
                                                            ...prev,
                                                            [nivel]: e.target.value
                                                        }));
                                                    }
                                                }}
                                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base"
                                                disabled={isSubmitting}
                                            >
                                                <option value="">Seleccione un aula</option>
                                                {aulas.filter(a => a.activa).map(aula => (
                                                    <option key={aula.id_aula} value={aula.id_aula}>{aula.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                {!esNivelIngles(currentSubject) && currentSubject && currentGrade && (
                                    <div className="flex-grow min-w-[200px]">
                                        <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                            Aula/Salón
                                        </label>
                                        <select
                                            value={currentAula}
                                            onChange={(e) => setCurrentAula(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Seleccione un aula (opcional)</option>
                                            {aulas.filter(a => a.activa).map(aula => (
                                                <option key={aula.id_aula} value={aula.id_aula}>{aula.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    onClick={handleAddAssignment}
                                    disabled={isSubmitting}
                                >
                                    Añadir
                                </Button>
                            </div>
                            {errors.assignment && (
                                <p className="mb-3 text-sm text-destructive bg-destructive/10 p-2 rounded">{errors.assignment}</p>
                            )}
                            {assignments.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {assignments.map((a, index) => {
                                        // Para niveles de inglés, mostrar de forma agrupada si es posible
                                        const esParteDeNivel = a.nivel_ingles && esGradoAlto(a.grade);
                                        const siguienteEsMismoNivel = index < assignments.length - 1 &&
                                            assignments[index + 1].nivel_ingles === a.nivel_ingles &&
                                            assignments[index + 1].subject === a.subject &&
                                            ((a.grade === '5to Grado' && assignments[index + 1].grade === '6to Grado') ||
                                                (a.grade === '6to Grado' && assignments[index + 1].grade === '5to Grado'));

                                        // Si es 5to y el siguiente es 6to del mismo nivel, mostrar ambos juntos
                                        if (esParteDeNivel && siguienteEsMismoNivel && a.grade === '5to Grado') {
                                            return (
                                                <span
                                                    key={index}
                                                    className="flex items-center gap-2 bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1.5 rounded-full border border-purple-200"
                                                >
                                                    <span className="font-semibold">{a.subject}</span>
                                                    <span className="text-purple-600">(5to y 6to Grado</span>
                                                    {a.nivel_ingles && (
                                                        <span className="text-purple-700 font-bold"> - {a.nivel_ingles}</span>
                                                    )}
                                                    {a.id_aula && (
                                                        <span className="text-purple-600"> - {aulas.find(aula => aula.id_aula === a.id_aula)?.nombre || 'Aula'}</span>
                                                    )}
                                                    <span className="text-purple-600">)</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            // Eliminar ambos (5to y 6to)
                                                            const indicesAEliminar = [index, index + 1];
                                                            setAssignments(prev => prev.filter((_, i) => !indicesAEliminar.includes(i)));
                                                        }}
                                                        className="h-6 w-6 text-purple-600 hover:text-purple-800 hover:bg-purple-200"
                                                        disabled={isSubmitting}
                                                        title="Eliminar ambos grados"
                                                    >
                                                        <CloseIcon className="h-4 w-4" />
                                                    </Button>
                                                </span>
                                            );
                                        }

                                        // Si es 6to y el anterior fue 5to del mismo nivel, no mostrar (ya se mostró agrupado)
                                        if (esParteDeNivel && index > 0 &&
                                            assignments[index - 1].nivel_ingles === a.nivel_ingles &&
                                            assignments[index - 1].subject === a.subject &&
                                            assignments[index - 1].grade === '5to Grado' &&
                                            a.grade === '6to Grado') {
                                            return null;
                                        }

                                        // Mostrar asignación normal
                                        return (
                                            <span
                                                key={index}
                                                className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-200"
                                            >
                                                <span className="font-semibold">{a.subject}</span>
                                                <span className="text-blue-600">({a.grade}</span>
                                                {a.nivel_ingles && (
                                                    <span className="text-blue-700 font-bold"> - {a.nivel_ingles}</span>
                                                )}
                                                {a.id_aula && (
                                                    <span className="text-blue-600"> - {aulas.find(aula => aula.id_aula === a.id_aula)?.nombre || 'Aula'}</span>
                                                )}
                                                <span className="text-blue-600">)</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveAssignment(index)}
                                                    className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-200"
                                                    disabled={isSubmitting}
                                                    title="Eliminar"
                                                >
                                                    <CloseIcon className="h-4 w-4" />
                                                </Button>
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground font-light italic">No hay asignaturas agregadas. Agregue al menos una asignatura y grado.</p>
                            )}
                        </div>
                    </div>

                </form>
                <DialogFooter className="px-6 pb-6 sm:px-0 sm:pb-0 mt-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TeachersView: React.FC<{
    docentes: Docente[];
    clases: Clase[];
    alumnos: Alumno[];
    aulas: Aula[];
    setDocentes: React.Dispatch<React.SetStateAction<Docente[]>>;
    setClases: React.Dispatch<React.SetStateAction<Clase[]>>;
    currentUser: Usuario;
}> = ({ docentes, clases, alumnos, aulas, setDocentes, setClases, currentUser }) => {
    const { showToast } = useToast();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Docente | null>(null);
    const [unlinkedUsers, setUnlinkedUsers] = useState<Array<{ id: string, email: string, role: string }>>([]);
    const [showUnlinkedSection, setShowUnlinkedSection] = useState(false);
    const [englishLevelAssignments, setEnglishLevelAssignments] = useState<Array<{ id_docente: string, nivel_ingles: string, id_aula?: string }>>([]);
    const [confirmDeleteTeacher, setConfirmDeleteTeacher] = useState<{ open: boolean; teacherId: string | null; warningMessage?: string }>({ open: false, teacherId: null });

    // Cargar asignaciones de niveles de inglés
    useEffect(() => {
        const loadEnglishAssignments = async () => {
            try {
                const anoEscolar = '2025-2026';
                const { data: assignments, error } = await supabase
                    .from('asignacion_docente_nivel_ingles')
                    .select('id_docente, nivel_ingles')
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (error) {
                    console.error('Error loading English level assignments:', error);
                    return;
                }

                // Cargar también las aulas asignadas a cada nivel
                const assignmentsWithAulas = await Promise.all(
                    (assignments || []).map(async (assignment) => {
                        const { data: aulaAssignment } = await supabase
                            .from('asignacion_aula_nivel_ingles')
                            .select('id_aula')
                            .eq('nivel_ingles', assignment.nivel_ingles)
                            .eq('ano_escolar', anoEscolar)
                            .eq('activa', true)
                            .maybeSingle();

                        return {
                            ...assignment,
                            id_aula: aulaAssignment?.id_aula
                        };
                    })
                );

                setEnglishLevelAssignments(assignmentsWithAulas);
            } catch (error) {
                console.error('Error loading English assignments:', error);
            }
        };

        loadEnglishAssignments();
    }, [docentes]);

    const handleOpenModal = (teacher: Docente | null = null) => {
        setSelectedTeacher(teacher);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTeacher(null);
    };

    // Helper functions for English logic
    const esInglesPrimaria = (subject: string): boolean => {
        const lowerSubject = subject.toLowerCase();
        return lowerSubject.includes('inglés') || lowerSubject.includes('ingles') ||
            lowerSubject.includes('english');
    };

    const esGradoAlto = (grade: string): boolean => {
        return grade === '5to Grado' || grade === '6to Grado';
    };

    const handleSaveTeacher = async (teacherData: Docente, newAssignments: Assignment[]) => {
        try {
            // Get current academic year (you might want to get this from context or config)
            const anoEscolar = '2025-2026'; // TODO: Obtener del contexto/configuración

            // Update teacher details in Supabase
            const teacherExists = docentes.some(d => d.id_docente === teacherData.id_docente);
            let savedTeacher: Docente;

            if (teacherExists) {
                // Update existing teacher
                const { id_docente, created_at, updated_at, ...updateData } = teacherData;
                savedTeacher = await docentesService.update(id_docente, updateData);
                setDocentes(prev => prev.map(d => d.id_docente === savedTeacher.id_docente ? savedTeacher : d));

                // Delete old English level assignments if any
                try {
                    await supabase
                        .from('asignacion_docente_nivel_ingles')
                        .delete()
                        .eq('id_docente', savedTeacher.id_docente)
                        .eq('ano_escolar', anoEscolar);
                } catch (error) {
                    console.error('Error deleting old English level assignments:', error);
                }
            } else {
                // Create new teacher
                // Omit id_docente, created_at, updated_at - Supabase will generate id_docente automatically
                const { id_docente, created_at, updated_at, id_usuario, ...newTeacher } = teacherData;
                // Only include id_usuario if it's a valid UUID (not a generated string like "user-123456")
                const teacherToCreate = id_usuario && !id_usuario.startsWith('user-') && !id_usuario.startsWith('docente-')
                    ? { ...newTeacher, id_usuario }
                    : newTeacher;
                savedTeacher = await docentesService.create(teacherToCreate);
                setDocentes(prev => [...prev, savedTeacher]);
            }

            // Update classes based on assignments
            // Remove all old classes for this teacher
            const otherTeachersClasses = clases.filter(c => c.id_docente_asignado !== savedTeacher.id_docente);

            // Delete old classes from Supabase
            const oldClasses = clases.filter(c => c.id_docente_asignado === savedTeacher.id_docente);
            for (const oldClass of oldClasses) {
                try {
                    await clasesService.delete(oldClass.id_clase);
                } catch (error) {
                    console.error('Error deleting old class:', error);
                }
            }

            // Separate English and regular assignments
            const asignacionesIngles = newAssignments.filter(a => esInglesPrimaria(a.subject));
            const asignacionesRegulares = newAssignments.filter(a => !esInglesPrimaria(a.subject));

            // Create new classes based on assignments
            if (newAssignments.length > 0) {
                const createdClasses = [];
                const errors: string[] = [];
                const asignacionesNivelCreadas: string[] = [];

                // Process regular assignments
                for (const a of asignacionesRegulares) {
                    // Validar que la asignatura y el grado no estén vacíos
                    if (!a.subject || !a.grade) {
                        errors.push(`Asignatura o grado vacío: ${a.subject || 'Sin asignatura'} - ${a.grade || 'Sin grado'}`);
                        continue;
                    }

                    try {
                        const newClass = {
                            nombre_materia: a.subject.trim(),
                            grado_asignado: a.grade.trim(),
                            id_docente_asignado: savedTeacher.id_docente,
                            id_aula: a.id_aula || null, // Agregar aula si está asignada
                            student_ids: alumnos.filter(s => s.salon === a.grade).map(s => s.id_alumno),
                        };
                        const created = await clasesService.create(newClass);
                        createdClasses.push({
                            ...created,
                            studentIds: created.student_ids || []
                        });
                    } catch (error: any) {
                        const errorMsg = `Error al crear la clase ${a.subject} (${a.grade}): ${error.message || 'Error desconocido'}`;
                        console.error(`Error creating class for ${a.subject} - ${a.grade}:`, error);
                        errors.push(errorMsg);
                    }
                }

                // Process English assignments
                for (const a of asignacionesIngles) {
                    if (!a.subject || !a.grade) {
                        errors.push(`Asignatura o grado vacío: ${a.subject || 'Sin asignatura'} - ${a.grade || 'Sin grado'}`);
                        continue;
                    }

                    try {
                        if (!esGradoAlto(a.grade)) {
                            // Para 1er-4to: Crear clases por skill
                            // Skills para 1er-4to: Phonics, Reading, Writing, Listening, Speaking, Project, Use of English
                            const skillsPrimaria = ['Phonics', 'Reading', 'Writing', 'Listening', 'Speaking', 'Project', 'Use of English'];
                            const alumnosGrado = alumnos.filter(s => s.salon === a.grade);

                            for (const skill of skillsPrimaria) {
                                try {
                                    const claseSkill: any = {
                                        nombre_materia: `Inglés - ${skill}`,
                                        grado_asignado: a.grade.trim(),
                                        id_docente_asignado: savedTeacher.id_docente,
                                        id_aula: a.id_aula || null, // Agregar aula si está asignada
                                        es_ingles_primaria: true,
                                        es_proyecto: skill === 'Project',
                                        nivel_ingles: null, // 1er-4to no tienen niveles
                                        skill_rutina: skill,
                                        student_ids: alumnosGrado.map(al => al.id_alumno),
                                    };
                                    const createdSkill = await clasesService.create(claseSkill);
                                    createdClasses.push({
                                        ...createdSkill,
                                        studentIds: createdSkill.student_ids || []
                                    });
                                } catch (error: any) {
                                    const errorMsg = `Error creating class for ${skill} - ${a.grade}: ${error.message || JSON.stringify(error)}`;
                                    console.error(errorMsg, error);
                                    errors.push(errorMsg);
                                }
                            }
                        } else {
                            // Para 5to-6to: Solo crear asignación de docente por nivel, NO crear clases individuales
                            // Las clases se crearán una sola vez por skill (consolidadas) cuando se agregue el primer docente
                            if (a.nivel_ingles) {
                                try {
                                    // Verificar si ya existe esta asignación
                                    const { data: existing } = await supabase
                                        .from('asignacion_docente_nivel_ingles')
                                        .select('*')
                                        .eq('id_docente', savedTeacher.id_docente)
                                        .eq('nivel_ingles', a.nivel_ingles)
                                        .eq('ano_escolar', anoEscolar)
                                        .single();

                                    if (!existing) {
                                        // Crear entrada en asignacion_docente_nivel_ingles
                                        const { error: assignError } = await supabase
                                            .from('asignacion_docente_nivel_ingles')
                                            .insert({
                                                id_docente: savedTeacher.id_docente,
                                                nivel_ingles: a.nivel_ingles,
                                                ano_escolar: anoEscolar,
                                                activa: true
                                            });

                                        if (assignError) {
                                            throw assignError;
                                        }
                                    } else {
                                        // Actualizar si ya existe
                                        await supabase
                                            .from('asignacion_docente_nivel_ingles')
                                            .update({ activa: true })
                                            .eq('id', existing.id);
                                    }

                                    // Crear o actualizar asignación de aula para este nivel
                                    if (a.id_aula) {
                                        try {
                                            // Verificar si ya existe una asignación de aula para este nivel
                                            const { data: existingAula } = await supabase
                                                .from('asignacion_aula_nivel_ingles')
                                                .select('*')
                                                .eq('nivel_ingles', a.nivel_ingles)
                                                .eq('ano_escolar', anoEscolar)
                                                .eq('activa', true)
                                                .single();

                                            if (!existingAula) {
                                                // Crear nueva asignación de aula
                                                const { error: aulaError } = await supabase
                                                    .from('asignacion_aula_nivel_ingles')
                                                    .insert({
                                                        id_aula: a.id_aula,
                                                        nivel_ingles: a.nivel_ingles,
                                                        ano_escolar: anoEscolar,
                                                        prioridad: 1,
                                                        activa: true
                                                    });

                                                if (aulaError) {
                                                    console.error('Error creating aula assignment:', aulaError);
                                                    // No lanzar error, solo registrar
                                                }
                                            } else {
                                                // Actualizar aula existente si es diferente
                                                if (existingAula.id_aula !== a.id_aula) {
                                                    await supabase
                                                        .from('asignacion_aula_nivel_ingles')
                                                        .update({
                                                            id_aula: a.id_aula,
                                                            activa: true
                                                        })
                                                        .eq('id', existingAula.id);
                                                }
                                            }
                                        } catch (error) {
                                            // Si no existe la tabla o hay error, solo registrar
                                            console.error('Error managing aula assignment:', error);
                                        }
                                    }

                                    // Verificar si ya existen clases consolidadas por skill para 5to-6to
                                    // Si no existen, crearlas una sola vez (6 clases, una por skill)
                                    const skillsNivel = ['Speaking', 'Listening', 'Writing', 'Creative Writing', 'Use of English', 'Reading'];

                                    // Obtener todas las clases de inglés de 5to-6to existentes
                                    const existingEnglishClasses = clases.filter(c =>
                                        c.es_ingles_primaria &&
                                        c.grado_asignado === '5to Grado' &&
                                        c.skill_rutina &&
                                        skillsNivel.includes(c.skill_rutina)
                                    );

                                    // Crear solo las clases que no existen aún (una por skill, sin nivel específico)
                                    for (const skill of skillsNivel) {
                                        const classExists = existingEnglishClasses.some(c => c.skill_rutina === skill);

                                        if (!classExists) {
                                            try {
                                                // Obtener todos los alumnos de 5to y 6to (sin filtrar por nivel, ya que la clase es consolidada)
                                                const todosAlumnos5to6to = alumnos.filter(
                                                    alumno => alumno.salon === '5to Grado' || alumno.salon === '6to Grado'
                                                );

                                                // Crear clase consolidada (sin nivel específico, nivel_ingles = null)
                                                const claseSkill: any = {
                                                    nombre_materia: `Inglés - ${skill}`,
                                                    grado_asignado: '5to Grado', // Usar 5to como grado principal para el filtro
                                                    id_docente_asignado: null, // Sin docente específico, se consultará de asignaciones
                                                    es_ingles_primaria: true,
                                                    es_proyecto: false,
                                                    nivel_ingles: null, // null indica que es una clase consolidada
                                                    skill_rutina: skill,
                                                    student_ids: todosAlumnos5to6to.map(al => al.id_alumno),
                                                };
                                                const createdSkill = await clasesService.create(claseSkill);
                                                createdClasses.push({
                                                    ...createdSkill,
                                                    studentIds: createdSkill.student_ids || []
                                                });
                                            } catch (error: any) {
                                                const errorMsg = `Error creating consolidated class for ${skill}: ${error.message || JSON.stringify(error)}`;
                                                console.error(errorMsg, error);
                                                errors.push(errorMsg);
                                            }
                                        }
                                    }

                                    asignacionesNivelCreadas.push(`${a.subject} - 5to y 6to Grado (${a.nivel_ingles})`);
                                } catch (error: any) {
                                    const errorMsg = `Error al crear asignación de nivel ${a.nivel_ingles} para ${a.grade}: ${error.message || 'Error desconocido'}`;
                                    console.error(`Error creating English level assignment:`, error);
                                    errors.push(errorMsg);
                                }
                            } else {
                                errors.push(`Falta nivel_ingles para ${a.subject} en ${a.grade}`);
                            }
                        }
                    } catch (error: any) {
                        const errorMsg = `Error al procesar inglés ${a.subject} (${a.grade}): ${error.message || 'Error desconocido'}`;
                        console.error(`Error processing English assignment:`, error);
                        errors.push(errorMsg);
                    }
                }

                // Mostrar errores si los hay
                if (errors.length > 0) {
                    alert('Algunas asignaciones no se pudieron crear:\n\n' + errors.join('\n'));
                }

                // Recargar todas las clases desde Supabase para asegurar sincronización
                try {
                    const allClases = await clasesService.getAll();
                    setClases(allClases.map((db: ClaseDB) => {
                        const { created_at, updated_at, student_ids, ...clase } = db;
                        return {
                            ...clase,
                            studentIds: student_ids || []
                        };
                    }));
                } catch (error: any) {
                    console.error('Error reloading classes:', error);
                    // Si falla la recarga, al menos actualizar con las clases creadas
                    setClases([...otherTeachersClasses, ...createdClasses]);
                }

                // Mostrar mensaje de éxito
                // Para niveles de inglés, contamos las clases creadas (no las asignaciones)
                const totalCreado = createdClasses.length;
                // Contar clases consolidadas de inglés de 5to-6to (máximo 6, una por skill)
                const englishConsolidatedClasses = createdClasses.filter(c =>
                    c.es_ingles_primaria &&
                    c.nivel_ingles === null &&
                    c.grado_asignado === '5to Grado'
                ).length;
                const totalEsperado = asignacionesRegulares.length +
                    (asignacionesIngles.filter(a => !esGradoAlto(a.grade)).length * 7) + // 1er-4to: 7 skills por grado
                    Math.min(englishConsolidatedClasses, 6); // 5to-6to: máximo 6 clases consolidadas (una por skill)

                if (totalCreado >= totalEsperado * 0.9) { // Permitir 10% de error
                    if (asignacionesNivelCreadas.length > 0) {
                        showToast({
                            type: 'success',
                            title: `Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente`,
                            message: `Clases creadas: ${createdClasses.length}. Asignaciones de nivel inglés: ${asignacionesNivelCreadas.length}. Se crearon automáticamente las clases consolidadas por skill para 5to y 6to Grado.`,
                            duration: 7000,
                        });
                    } else {
                        showToast({
                            type: 'success',
                            title: `Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente`,
                            message: `${createdClasses.length} clase(s) creada(s)`,
                        });
                    }
                } else if (totalCreado > 0) {
                    showToast({
                        type: 'warning',
                        title: `Docente ${teacherExists ? 'actualizado' : 'creado'} con advertencias`,
                        message: `Solo ${totalCreado} de aproximadamente ${totalEsperado} clases se guardaron correctamente.`,
                        duration: 6000,
                    });
                }
            } else {
                // Si no hay asignaturas, solo actualizar el estado local
                setClases(otherTeachersClasses);
                showToast({
                    type: 'info',
                    title: `Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente`,
                    message: 'Nota: No se agregaron asignaturas',
                });
            }

            handleCloseModal();
        } catch (error: any) {
            console.error('Error saving teacher:', error);
            showToast({
                type: 'error',
                title: 'Error al guardar el docente',
                message: error.message || 'No se pudo guardar el docente. Por favor, inténtalo de nuevo.',
            });
        }
    };

    const handleDeleteTeacher = async (id_docente: string) => {
        // Verificar que el usuario actual no se esté eliminando a sí mismo
        if (currentUser?.docenteId === id_docente) {
            showToast({
                type: 'warning',
                title: 'Acción no permitida',
                message: 'No puedes eliminar tu propio perfil de docente. Contacta a un coordinador o directivo.',
            });
            return;
        }

        // Obtener información del docente a eliminar
        const docenteToDelete = docentes.find(d => d.id_docente === id_docente);
        const classesToDelete = clases.filter(c => c.id_docente_asignado === id_docente);

        // Preparar mensaje de advertencia
        const warningMessage = `Docente: ${docenteToDelete?.nombres || ''} ${docenteToDelete?.apellidos || ''}\nEmail: ${docenteToDelete?.email || ''}\n\n⚠️ ADVERTENCIA: Esta acción eliminará:\n- El registro del docente\n- ${classesToDelete.length} clase(s) asignada(s)\n- Todas las planificaciones asociadas\n- Todas las notificaciones asociadas\n\nEsta acción NO se puede deshacer.`;
        
        setConfirmDeleteTeacher({ open: true, teacherId: id_docente, warningMessage });
    };

    const confirmDeleteTeacherAction = async () => {
        if (!confirmDeleteTeacher.teacherId) return;
        
        const id_docente = confirmDeleteTeacher.teacherId;
        const docenteToDelete = docentes.find(d => d.id_docente === id_docente);
        const classesToDelete = clases.filter(c => c.id_docente_asignado === id_docente);

        try {
            // Mostrar indicador de carga
            const deleteButton = document.activeElement as HTMLElement;
            const originalText = deleteButton?.textContent || '';
            if (deleteButton) {
                deleteButton.textContent = 'Eliminando...';
                deleteButton.setAttribute('disabled', 'true');
            }

            // Verificar si hay muchas clases (puede tomar tiempo)
            if (classesToDelete.length > 10) {
                console.warn(`Eliminando ${classesToDelete.length} clases, esto puede tomar un momento...`);
            }

            // Delete classes from Supabase
            let deletedClasses = 0;
            let failedClasses: string[] = [];

            for (const clase of classesToDelete) {
                try {
                    await clasesService.delete(clase.id_clase);
                    deletedClasses++;
                } catch (error: any) {
                    console.error(`Error deleting class ${clase.id_clase}:`, error);
                    failedClasses.push(clase.nombre_materia || clase.id_clase);
                }
            }

            // Si algunas clases fallaron, mostrar advertencia
            if (failedClasses.length > 0) {
                const continueDelete = window.confirm(
                    `⚠️ Advertencia: No se pudieron eliminar ${failedClasses.length} clase(s):\n` +
                    `${failedClasses.slice(0, 5).join(', ')}${failedClasses.length > 5 ? '...' : ''}\n\n` +
                    `¿Desea continuar eliminando el docente de todas formas?`
                );

                if (!continueDelete) {
                    setConfirmDeleteTeacher({ open: false, teacherId: null });
                    return;
                }
            }

            // Delete teacher from Supabase
            await docentesService.delete(id_docente);

            // Update local state
            setDocentes(prev => prev.filter(d => d.id_docente !== id_docente));
            setClases(prev => prev.filter(c => c.id_docente_asignado !== id_docente));

            // Cerrar el diálogo de confirmación
            setConfirmDeleteTeacher({ open: false, teacherId: null });

            // Mostrar mensaje de éxito
            showToast({
                type: 'success',
                title: 'Docente eliminado exitosamente',
                message: `${deletedClasses} clase(s) eliminada(s)${failedClasses.length > 0 ? `. ${failedClasses.length} clase(s) con errores` : ''}`,
                duration: 6000,
            });

        } catch (error: any) {
            console.error('Error deleting teacher:', error);

            // Manejar diferentes tipos de errores
            let errorMessage = 'Error al eliminar el docente: ';

            if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('row-level security')) {
                errorMessage += 'Error de permisos. Verifica que tengas los permisos necesarios.';
            } else if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
                errorMessage += 'Demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente.';
            } else if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
                errorMessage += 'Error de comunicación con el servidor. Por favor, recarga la página e intenta nuevamente.';
            } else {
                errorMessage += error.message || 'Error desconocido';
            }

            showToast({
                type: 'error',
                title: 'Error al eliminar el docente',
                message: `${errorMessage} Si el problema persiste, contacta al administrador del sistema.`,
                duration: 8000,
            });
        }
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Gestión de Docentes</h2>
                    <HelpTooltip
                        content="Administra el personal docente del colegio. Aquí puedes agregar nuevos docentes, asignar materias y grados, y gestionar sus horarios y responsabilidades."
                        variant="icon-only"
                        side="right"
                    />
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-apple-blue text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium transition-apple">
                    <PlusIcon />
                    Añadir Docente
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-apple-gray-light">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Docente</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Asignaturas</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Grados</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Contacto</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-apple-gray-light">
                        {docentes.map(docente => {
                            // Clases regulares asignadas directamente al docente
                            const teacherClasses = clases.filter(c => c.id_docente_asignado === docente.id_docente);

                            // Asignaciones de inglés de niveles (5to-6to)
                            const englishAssignments = englishLevelAssignments.filter(a => a.id_docente === docente.id_docente);

                            // Construir lista de asignaturas
                            const regularSubjects = [...new Set(teacherClasses.map(c => c.nombre_materia))];
                            const englishSubjects = englishAssignments.length > 0 ? ['Inglés (Niveles)'] : [];
                            const subjects = [...regularSubjects, ...englishSubjects];

                            // Construir lista de grados
                            let grades = [...new Set(teacherClasses.map(c => c.grado_asignado))];

                            // Para docentes de inglés de niveles, agregar 5to y 6to Grado
                            if (englishAssignments.length > 0) {
                                if (!grades.includes('5to Grado')) grades.push('5to Grado');
                                if (!grades.includes('6to Grado')) grades.push('6to Grado');
                            }

                            grades.sort(); // Ordenar para mantener consistencia

                            // Obtener aulas asignadas
                            const regularAulas = [...new Set(teacherClasses.map(c => c.id_aula).filter(Boolean))];
                            const englishAulas = [...new Set(englishAssignments.map(a => a.id_aula).filter(Boolean))];
                            const allAulas = [...regularAulas, ...englishAulas];
                            const aulasNames = allAulas.map(id => aulas.find(a => a.id_aula === id)?.nombre || '').filter(Boolean);

                            return (
                                <tr key={docente.id_docente} className="hover:bg-apple-gray-light transition-apple">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-apple-gray-dark">{docente.nombres} {docente.apellidos}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                        {subjects.length > 0 ? (
                                            <div>
                                                {subjects.join(', ')}
                                                {englishAssignments.length > 0 && (
                                                    <div className="text-xs text-purple-600 mt-1">
                                                        Niveles: {englishAssignments.map(a => a.nivel_ingles).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                        {grades.length > 0 ? grades.join(', ') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                        <div>{docente.email}</div>
                                        <div>{docente.telefono}</div>
                                        {aulasNames.length > 0 && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                Aulas: {aulasNames.join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                                        <button onClick={() => handleOpenModal(docente)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                        <button onClick={() => handleDeleteTeacher(docente.id_docente)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {docentes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12">
                                    <EmptyStateTeachers onAdd={() => handleOpenModal()} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Confirmación de eliminación de docente */}
            <ConfirmDialog
                open={confirmDeleteTeacher.open}
                onOpenChange={(open) => setConfirmDeleteTeacher({ open, teacherId: open ? confirmDeleteTeacher.teacherId : null })}
                onConfirm={confirmDeleteTeacherAction}
                title="Eliminar Docente"
                description={confirmDeleteTeacher.warningMessage || ''}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />

            {/* Unlinked Authorized Users Section - Only for coordinadores and directivos */}
            {(currentUser.role === 'coordinador' || currentUser.role === 'directivo') && unlinkedUsers.length > 0 && (
                <div className="mt-8 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-apple-gray-dark">Usuarios Autorizados Sin Vincular</h3>
                            <p className="text-sm text-apple-gray font-light mt-2">
                                Estos usuarios están en la lista blanca pero no tienen un registro de docente.
                                Vincúlalos con un docente existente o crea un nuevo docente.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUnlinkedSection(!showUnlinkedSection)}
                            className="px-4 py-2 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light text-sm font-medium transition-apple"
                        >
                            {showUnlinkedSection ? 'Ocultar' : 'Mostrar'} ({unlinkedUsers.length})
                        </button>
                    </div>

                    {showUnlinkedSection && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="space-y-3">
                                {unlinkedUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-yellow-300">
                                        <div className="flex-1">
                                            <div className="font-medium text-apple-gray-dark">{user.email}</div>
                                            <div className="text-sm text-apple-gray font-light">Rol: {user.role}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Link to existing docente */}
                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleLinkToExisting(user.email, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                                defaultValue=""
                                            >
                                                <option value="">Vincular con docente existente...</option>
                                                {docentes.map(d => (
                                                    <option key={d.id_docente} value={d.id_docente}>
                                                        {d.nombres} {d.apellidos} ({d.email})
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Create new docente */}
                                            <button
                                                onClick={() => handleCreateFromAuthorized(user.email)}
                                                className="px-4 py-1.5 bg-apple-blue text-white rounded-lg hover:opacity-90 text-sm font-medium transition-apple"
                                            >
                                                Crear Nuevo Docente
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && <TeacherFormModal teacher={selectedTeacher} clases={clases} aulas={aulas} onClose={handleCloseModal} onSave={handleSaveTeacher} />}
        </div>
    );
};

const LapsosAdminView: React.FC<{
    currentUser: Usuario;
}> = ({ currentUser }) => {
    const anoEscolar = '2025-2026'; // TODO: Obtener del contexto/configuración
    const [lapsos, setLapsos] = useState<Lapso[]>([]);
    const [semanasMap, setSemanasMap] = useState<Map<string, SemanaInfo[]>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingLapso, setEditingLapso] = useState<Lapso | null>(null);
    const [expandedLapso, setExpandedLapso] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        lapso: '' as 'I Lapso' | 'II Lapso' | 'III Lapso' | '',
        fecha_inicio: '',
        fecha_fin: '',
        semanas_totales: 15,
        activo: true
    });

    // Cargar lapsos y semanas
    useEffect(() => {
        loadLapsos();
    }, []);

    const loadLapsos = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const lapsosData = await lapsosService.getByAnoEscolar(anoEscolar);
            setLapsos(lapsosData);

            // Cargar semanas para cada lapso
            const semanasPromises = lapsosData.map(async (lapso) => {
                const semanas = await semanasLapsoService.getByLapso(lapso.id_lapso);
                return { lapsoId: lapso.id_lapso, semanas };
            });

            const semanasResults = await Promise.all(semanasPromises);
            const newSemanasMap = new Map<string, SemanaInfo[]>();

            semanasResults.forEach(({ lapsoId, semanas }) => {
                newSemanasMap.set(lapsoId, semanas.map(s => ({
                    numero_semana: s.numero_semana,
                    fecha_inicio: s.fecha_inicio,
                    fecha_fin: s.fecha_fin,
                    lapso: lapsosData.find(l => l.id_lapso === lapsoId)?.lapso || '',
                    ano_escolar: anoEscolar,
                    id_lapso: lapsoId
                })));
            });

            setSemanasMap(newSemanasMap);
        } catch (err: any) {
            console.error('Error loading lapsos:', err);
            setError('Error al cargar los lapsos: ' + (err.message || 'Error desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (lapso: Lapso | null = null) => {
        if (lapso) {
            setEditingLapso(lapso);
            setFormData({
                lapso: lapso.lapso,
                fecha_inicio: lapso.fecha_inicio,
                fecha_fin: lapso.fecha_fin,
                semanas_totales: lapso.semanas_totales,
                activo: lapso.activo
            });
        } else {
            setEditingLapso(null);
            setFormData({
                lapso: '',
                fecha_inicio: '',
                fecha_fin: '',
                semanas_totales: 15,
                activo: true
            });
        }
        setModalOpen(true);
        setError(null);
        setSuccess(null);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingLapso(null);
        setFormData({
            lapso: '',
            fecha_inicio: '',
            fecha_fin: '',
            semanas_totales: 15,
            activo: true
        });
        setError(null);
        setSuccess(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validaciones
        if (!formData.lapso) {
            setError('Debe seleccionar un lapso');
            return;
        }

        if (!formData.fecha_inicio || !formData.fecha_fin) {
            setError('Debe ingresar fechas de inicio y fin');
            return;
        }

        if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_fin)) {
            setError('La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }

        if (formData.semanas_totales < 1) {
            setError('El número de semanas debe ser mayor a 0');
            return;
        }

        // Verificar que no exista otro lapso del mismo tipo para el mismo año
        const existingLapso = lapsos.find(l =>
            l.lapso === formData.lapso &&
            (!editingLapso || l.id_lapso !== editingLapso.id_lapso)
        );
        if (existingLapso) {
            setError(`Ya existe un ${formData.lapso} para el año ${anoEscolar}`);
            return;
        }

        try {
            if (editingLapso) {
                // Actualizar lapso existente
                const updated = await lapsosService.update(editingLapso.id_lapso, {
                    ...formData,
                    ano_escolar: anoEscolar
                } as any);

                setLapsos(prev => prev.map(l => l.id_lapso === updated.id_lapso ? updated : l));
                setSuccess(`Lapso ${updated.lapso} actualizado exitosamente. Las semanas se regenerarán automáticamente.`);

                // Recargar semanas después de un breve delay para que el trigger se ejecute
                setTimeout(() => {
                    loadLapsos();
                }, 1000);
            } else {
                // Crear nuevo lapso
                const created = await lapsosService.create({
                    ...formData,
                    ano_escolar: anoEscolar
                } as any);

                setLapsos(prev => [...prev, created]);
                setSuccess(`Lapso ${created.lapso} creado exitosamente. Las semanas se generarán automáticamente.`);

                // Recargar semanas después de un breve delay
                setTimeout(() => {
                    loadLapsos();
                }, 1000);
            }

            handleCloseModal();
        } catch (err: any) {
            console.error('Error saving lapso:', err);
            setError('Error al guardar el lapso: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleDelete = async (lapso: Lapso) => {
        if (!window.confirm(`¿Está seguro de que desea eliminar el ${lapso.lapso}?\n\nEsta acción eliminará todas las semanas asociadas y puede afectar los horarios vinculados.`)) {
            return;
        }

        try {
            await lapsosService.delete(lapso.id_lapso);
            setLapsos(prev => prev.filter(l => l.id_lapso !== lapso.id_lapso));
            setSemanasMap(prev => {
                const newMap = new Map(prev);
                newMap.delete(lapso.id_lapso);
                return newMap;
            });
            setSuccess(`Lapso ${lapso.lapso} eliminado exitosamente`);
        } catch (err: any) {
            console.error('Error deleting lapso:', err);
            setError('Error al eliminar el lapso: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleRegenerateWeeks = async (lapso: Lapso) => {
        if (!window.confirm(`¿Regenerar las semanas para el ${lapso.lapso}?\n\nEsto actualizará todas las semanas basándose en las fechas actuales del lapso.`)) {
            return;
        }

        try {
            // Llamar a la función SQL para regenerar semanas
            const { error } = await supabase.rpc('generar_semanas_lapso', {
                p_id_lapso: lapso.id_lapso
            });

            if (error) throw error;

            setSuccess(`Semanas del ${lapso.lapso} regeneradas exitosamente`);

            // Recargar semanas
            const semanas = await semanasLapsoService.getByLapso(lapso.id_lapso);
            setSemanasMap(prev => {
                const newMap = new Map(prev);
                newMap.set(lapso.id_lapso, semanas.map(s => ({
                    numero_semana: s.numero_semana,
                    fecha_inicio: s.fecha_inicio,
                    fecha_fin: s.fecha_fin,
                    lapso: lapso.lapso,
                    ano_escolar: anoEscolar,
                    id_lapso: lapso.id_lapso
                })));
                return newMap;
            });
        } catch (err: any) {
            console.error('Error regenerating weeks:', err);
            setError('Error al regenerar las semanas: ' + (err.message || 'Error desconocido'));
        }
    };

    if (isLoading) {
        return (
            <div className="mb-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Gestión de Lapsos Académicos</h2>
                    <p className="text-apple-gray font-light mt-2">Año Escolar: {anoEscolar}</p>
                </div>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center gap-2 px-6 py-3 bg-apple-blue text-white rounded-lg hover:opacity-90 font-medium transition-apple"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Lapso
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    {success}
                </div>
            )}

            {/* Lapsos List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lapso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Fin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semanas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lapsos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No hay lapsos configurados. Crea uno nuevo para comenzar.
                                </td>
                            </tr>
                        ) : (
                            lapsos.map((lapso) => {
                                const semanas = semanasMap.get(lapso.id_lapso) || [];
                                const isExpanded = expandedLapso === lapso.id_lapso;

                                return (
                                    <React.Fragment key={lapso.id_lapso}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {lapso.lapso}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                                {new Date(lapso.fecha_inicio).toLocaleDateString('es-VE', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                                {new Date(lapso.fecha_fin).toLocaleDateString('es-VE', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                                {semanas.length} / {lapso.semanas_totales}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lapso.activo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {lapso.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setExpandedLapso(isExpanded ? null : lapso.id_lapso)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Ver semanas"
                                                    >
                                                        {isExpanded ? 'Ocultar' : 'Ver'} Semanas
                                                    </button>
                                                    <button
                                                        onClick={() => handleRegenerateWeeks(lapso)}
                                                        className="text-purple-600 hover:text-purple-800"
                                                        title="Regenerar semanas"
                                                    >
                                                        Regenerar
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(lapso)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(lapso)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <DeleteIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                                    <div className="max-h-64 overflow-y-auto">
                                                        <h4 className="font-semibold text-gray-700 mb-3">Semanas del {lapso.lapso}</h4>
                                                        {semanas.length === 0 ? (
                                                            <p className="text-sm text-gray-500">No hay semanas generadas. Haz clic en "Regenerar" para generarlas.</p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                {semanas.map((semana) => (
                                                                    <div
                                                                        key={semana.numero_semana}
                                                                        className="bg-white p-3 rounded border border-gray-200"
                                                                    >
                                                                        <div className="font-medium text-sm text-gray-900">
                                                                            Semana {semana.numero_semana}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            {formatDateRange(semana.fecha_inicio, semana.fecha_fin)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal para crear/editar lapso */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingLapso ? 'Editar Lapso' : 'Nuevo Lapso'}
                            </h2>
                            <button onClick={handleCloseModal}>
                                <CloseIcon />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lapso <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="lapso"
                                    value={formData.lapso}
                                    onChange={handleChange}
                                    required
                                    disabled={!!editingLapso}
                                    className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="I Lapso">I Lapso</option>
                                    <option value="II Lapso">II Lapso</option>
                                    <option value="III Lapso">III Lapso</option>
                                </select>
                                {editingLapso && (
                                    <p className="text-xs text-gray-500 mt-1">El tipo de lapso no puede modificarse</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                        Fecha de Inicio <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        value={formData.fecha_inicio}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Lunes de la primera semana</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                        Fecha de Fin <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_fin"
                                        value={formData.fecha_fin}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Viernes de la última semana</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de Semanas <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="semanas_totales"
                                    value={formData.semanas_totales}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    max="20"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">Número total de semanas del lapso</p>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={formData.activo}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Lapso activo
                                </label>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-apple-gray-light">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light font-medium transition-apple"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:opacity-90 font-medium transition-apple"
                                >
                                    {editingLapso ? 'Actualizar' : 'Crear'} Lapso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PlanningFormModal: React.FC<{
    plan: Planificacion | null;
    userRole: UserRole;
    userId: string; // docenteId for teachers
    assignedClasses: { id_clase: string, nombre_materia: string, grado_asignado: string }[];
    onClose: () => void;
    onSave: (plan: Planificacion) => void;
    isReadOnly?: boolean;
    currentUserEmail?: string; // Email del usuario actual para buscar docente si userId está vacío
}> = ({ plan, userRole, userId, assignedClasses, onClose, onSave, isReadOnly = false, currentUserEmail }) => {
    const [formData, setFormData] = useState<Omit<Planificacion, 'id_planificacion' | 'fecha_creacion'>>({
        id_docente: plan?.id_docente || userId,
        id_clase: plan?.id_clase || (assignedClasses.length > 0 ? assignedClasses[0].id_clase : ''),
        semana: plan?.semana || getWeekNumber(new Date('2024-09-01')),
        lapso: plan?.lapso || 'I Lapso',
        ano_escolar: plan?.ano_escolar || '2025-2026',
        competencia_indicadores: plan?.competencia_indicadores || '',
        inicio: plan?.inicio || '',
        desarrollo: plan?.desarrollo || '',
        cierre: plan?.cierre || '',
        recursos_links: plan?.recursos_links || '',
        status: plan?.status || 'Borrador',
        observaciones: plan?.observaciones || '',
        nombres_docente: plan?.nombres_docente,
        apellidos_docente: plan?.apellidos_docente,
    });

    const [validationError, setValidationError] = useState<string>('');

    // Si userId está vacío y es un docente, intentar buscar el docente por email
    useEffect(() => {
        const fetchDocenteId = async () => {
            if (userRole === 'docente' && (!userId || userId.trim() === '') && currentUserEmail) {
                try {
                    const { data: docente } = await supabase
                        .from('docentes')
                        .select('id_docente')
                        .eq('email', currentUserEmail.toLowerCase())
                        .maybeSingle();

                    if (docente && docente.id_docente) {
                        setFormData(prev => ({ ...prev, id_docente: docente.id_docente }));
                    }
                } catch (error) {
                    console.error('Error fetching docente:', error);
                }
            }
        };

        fetchDocenteId();
    }, [userRole, userId, currentUserEmail]);

    const isReviewMode = userRole !== 'docente' && plan !== null;

    const canEditTeacherFields = !isReadOnly && (plan === null || (userRole === 'docente' && (plan.status === 'Borrador' || plan.status === 'Revisado')));
    const canEditCoordinatorFields = !isReadOnly && isReviewMode;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
        // Limpiar error de validación cuando el usuario cambia el campo
        if (name === 'id_clase' && validationError) {
            setValidationError('');
        }
    };

    const handleSubmit = (newStatus: Planificacion['status']) => {
        // Validar que id_clase no esté vacío
        if (!formData.id_clase || formData.id_clase.trim() === '') {
            setValidationError('Debe seleccionar una asignatura para crear la planificación.');
            return;
        }

        // Validar que id_docente no esté vacío
        if (!formData.id_docente || formData.id_docente.trim() === '') {
            setValidationError('Error: No se pudo identificar al docente. Por favor, contacte al administrador.');
            return;
        }

        setValidationError('');

        const finalPlan: Planificacion = {
            ...formData,
            id_planificacion: plan?.id_planificacion || `plan-${Date.now()}`,
            fecha_creacion: plan?.fecha_creacion || new Date().toISOString(),
            status: newStatus,
        };
        onSave(finalPlan);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">
                        {isReadOnly ? 'Detalle de Planificación' :
                            plan === null ? 'Nueva Planificación' :
                                userRole === 'docente' ? 'Editar Planificación' : 'Revisar Planificación'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-apple-gray hover:text-apple-gray-dark transition-apple rounded-lg hover:bg-apple-gray-light"><CloseIcon /></button>
                </div>
                <div className="space-y-6">
                    {/* Error de validación */}
                    {validationError && (
                        <div className="p-4 bg-red-50 border border-apple-red rounded-lg mb-6">
                            <p className="text-sm text-apple-red font-medium">{validationError}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">Asignatura <span className="text-apple-red">*</span></label>
                            <select
                                name="id_clase"
                                value={formData.id_clase}
                                onChange={handleChange}
                                disabled={!canEditTeacherFields}
                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base disabled:bg-apple-gray-light disabled:cursor-not-allowed"
                            >
                                <option value="">Seleccione una asignatura</option>
                                {assignedClasses.map(c => (
                                    <option key={c.id_clase} value={c.id_clase}>
                                        {c.nombre_materia} ({c.grado_asignado})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">Lapso</label>
                            <select
                                name="lapso"
                                value={formData.lapso}
                                onChange={handleChange}
                                disabled={!canEditTeacherFields}
                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base disabled:bg-apple-gray-light disabled:cursor-not-allowed"
                            >
                                <option>I Lapso</option>
                                <option>II Lapso</option>
                                <option>III Lapso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">Año Escolar</label>
                            <select
                                name="ano_escolar"
                                value={formData.ano_escolar}
                                onChange={handleChange}
                                disabled={!canEditTeacherFields}
                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base disabled:bg-apple-gray-light disabled:cursor-not-allowed"
                            >
                                {ANOS_ESCOLARES.map(ano => (
                                    <option key={ano} value={ano}>{ano}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <InputField as="textarea" rows={3} label="Competencia / Indicadores" name="competencia_indicadores" value={formData.competencia_indicadores} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={4} label="Inicio" name="inicio" value={formData.inicio} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={6} label="Desarrollo" name="desarrollo" value={formData.desarrollo} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={4} label="Cierre" name="cierre" value={formData.cierre} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={2} label="Recursos / Links" name="recursos_links" value={formData.recursos_links || ''} onChange={handleChange} disabled={!canEditTeacherFields} />

                    {(isReviewMode || (isReadOnly && formData.observaciones)) && (
                        <div className="border-t border-apple-gray-light pt-6">
                            <InputField as="textarea" rows={4} label="Observaciones del Coordinador" name="observaciones" value={formData.observaciones || ''} onChange={handleChange} disabled={!canEditCoordinatorFields} />
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6 border-t border-apple-gray-light">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg font-medium transition-apple hover:bg-apple-gray-light"
                        >
                            {isReadOnly ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!isReadOnly && canEditTeacherFields && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Borrador')}
                                    disabled={!formData.id_clase || formData.id_clase.trim() === ''}
                                    className="px-6 py-3 bg-apple-gray text-white rounded-lg font-medium transition-apple hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar Borrador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Enviado')}
                                    disabled={!formData.id_clase || formData.id_clase.trim() === ''}
                                    className="flex items-center gap-2 px-6 py-3 bg-apple-blue text-white rounded-lg font-medium transition-apple hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SendIcon className="h-4 w-4" />
                                    Enviar Planificación
                                </button>
                            </>
                        )}
                        {!isReadOnly && canEditCoordinatorFields && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Revisado')}
                                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium transition-apple hover:opacity-90"
                                >
                                    Marcar como Corregido
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Aprobado')}
                                    className="flex items-center gap-2 px-6 py-3 bg-apple-green text-white rounded-lg font-medium transition-apple hover:opacity-90"
                                >
                                    <ClipboardCheckIcon className="h-4 w-4" />
                                    Aprobar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlanningView: React.FC<{
    planificaciones: Planificacion[];
    setPlanificaciones: React.Dispatch<React.SetStateAction<Planificacion[]>>;
    clases: Clase[];
    docentes: Docente[];
    currentUser: Usuario;
    navParams?: any;
}> = ({ planificaciones, setPlanificaciones, clases, docentes, currentUser, navParams }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Planificacion | null>(null);
    const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    const [boardFilters, setBoardFilters] = useState({
        ano_escolar: 'all',
        lapso: 'all',
        id_docente: 'all',
    });

    const highlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (navParams?.planId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [navParams, planificaciones]);

    const handleOpenModal = (plan: Planificacion | null = null, isReadOnly = false) => {
        setSelectedPlan(plan);
        setIsReadOnlyModal(isReadOnly);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPlan(null);
        setIsReadOnlyModal(false);
    };

    const handleSavePlan = async (planData: Planificacion) => {
        try {
            // Validar UUIDs antes de guardar
            if (!planData.id_clase || planData.id_clase.trim() === '') {
                throw new Error('Debe seleccionar una asignatura para crear la planificación.');
            }

            if (!planData.id_docente || planData.id_docente.trim() === '') {
                throw new Error('Error: No se pudo identificar al docente. Por favor, contacte al administrador.');
            }

            // Validar formato UUID básico
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(planData.id_clase)) {
                throw new Error('Error: El ID de la clase no es válido. Por favor, seleccione una asignatura válida.');
            }

            if (!uuidRegex.test(planData.id_docente)) {
                throw new Error('Error: El ID del docente no es válido. Por favor, contacte al administrador.');
            }

            const planExists = planificaciones.some(p => p.id_planificacion === planData.id_planificacion);
            if (planExists) {
                // Update existing plan
                const { id_planificacion, fecha_creacion, updated_at, ...updateData } = planData;
                await planificacionesService.update(id_planificacion, updateData);
                setPlanificaciones(prev => prev.map(p => p.id_planificacion === planData.id_planificacion ? planData : p));
            } else {
                // Create new plan
                const { id_planificacion, fecha_creacion, updated_at, ...newPlan } = planData;
                const created = await planificacionesService.create(newPlan);
                setPlanificaciones(prev => [...prev, created]);
            }
            handleCloseModal();
        } catch (error: any) {
            console.error('Error saving plan:', error);
            const errorMessage = error.message || 'Error desconocido';

            // Mensaje más amigable para errores de UUID
            if (errorMessage.includes('invalid input syntax for type uuid') || errorMessage.includes('UUID')) {
                alert('Error al guardar la planificación: Debe seleccionar una asignatura válida. Si el problema persiste, contacte al coordinador.');
            } else {
                alert('Error al guardar la planificación: ' + errorMessage);
            }
        }
    };

    const handleGetAiSuggestions = async (plan: Planificacion) => {
        setSelectedPlan(plan);
        setAiModalOpen(true);
        setIsLoadingAi(true);
        const suggestions = await getAIPlanSuggestions(plan);
        setAiSuggestions(suggestions);
        setIsLoadingAi(false);
    };

    const teacherClasses = useMemo(() => {
        if (!currentUser || currentUser.role !== 'docente') return [];
        // Para docentes, mostrar TODAS las clases disponibles, no solo las asignadas
        // Esto permite que docentes sin clases asignadas también puedan crear planificaciones
        return clases
            .map(c => ({ id_clase: c.id_clase, nombre_materia: c.nombre_materia, grado_asignado: c.grado_asignado }))
            .filter((c, index, self) =>
                // Eliminar duplicados basados en id_clase
                index === self.findIndex((clase) => clase.id_clase === c.id_clase)
            )
            .sort((a, b) => {
                // Ordenar primero por grado, luego por nombre de materia
                if (a.grado_asignado !== b.grado_asignado) {
                    return a.grado_asignado.localeCompare(b.grado_asignado);
                }
                return a.nombre_materia.localeCompare(b.nombre_materia);
            });
    }, [clases, currentUser]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBoardFilters(prev => ({ ...prev, [name]: value }));
    };

    const renderBoardView = () => {
        const statusStyles: { [key in Planificacion['status']]: string } = {
            Borrador: 'bg-gray-100 text-gray-800',
            Enviado: 'bg-blue-100 text-blue-800',
            Revisado: 'bg-yellow-100 text-yellow-800',
            Aprobado: 'bg-green-100 text-green-800',
        };

        // Filter planificaciones based on board filters
        // All roles can see all planificaciones
        const filteredPlanificaciones = useMemo(() => {
            if (!planificaciones || planificaciones.length === 0) return [];

            let filtered = [...planificaciones];

            // Apply filters
            const { ano_escolar, lapso, id_docente } = boardFilters;

            if (ano_escolar && ano_escolar !== 'all') {
                filtered = filtered.filter(p => p.ano_escolar === ano_escolar);
            }

            if (lapso && lapso !== 'all') {
                filtered = filtered.filter(p => p.lapso === lapso);
            }

            if (id_docente && id_docente !== 'all') {
                filtered = filtered.filter(p => p.id_docente === id_docente);
            }

            return filtered;
        }, [planificaciones, boardFilters]);

        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Tablero de Planificaciones</h2>
                    {currentUser.role === 'docente' && (
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-apple-blue text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium transition-apple">
                            <PlusIcon />
                            Añadir Planificación
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 py-6 border-b border-apple-gray-light">
                    <InputField as="select" label="Año Escolar" name="ano_escolar" value={boardFilters.ano_escolar} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        {ANOS_ESCOLARES.map(ano => (
                            <option key={ano} value={ano}>{ano}</option>
                        ))}
                    </InputField>
                    <InputField as="select" label="Lapso" name="lapso" value={boardFilters.lapso} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        <option value="I Lapso">I Lapso</option>
                        <option value="II Lapso">II Lapso</option>
                        <option value="III Lapso">III Lapso</option>
                    </InputField>
                    <InputField as="select" label="Docente" name="id_docente" value={boardFilters.id_docente} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        {docentes && docentes.length > 0 ? docentes.map(d => (
                            <option key={d.id_docente} value={d.id_docente}>{d.nombres || ''} {d.apellidos || ''}</option>
                        )) : null}
                    </InputField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlanificaciones
                        .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
                        .map(plan => {
                            const clase = clases.find(c => c.id_clase === plan.id_clase);
                            const docente = plan.id_docente ? docentes.find(d => d.id_docente === plan.id_docente) : null;
                            // Use preserved names if docente is deleted, otherwise use current docente info
                            const docenteNombre = docente
                                ? `${docente.nombres} ${docente.apellidos}`
                                : (plan.nombres_docente && plan.apellidos_docente
                                    ? `${plan.nombres_docente} ${plan.apellidos_docente}`
                                    : 'Docente no disponible');
                            const isHighlighted = navParams?.planId === plan.id_planificacion;
                            return (
                                <div key={plan.id_planificacion} ref={isHighlighted ? highlightRef : null} className={`border border-apple-gray-light rounded-lg p-6 flex flex-col justify-between transition-apple hover:opacity-70 ${isHighlighted ? 'ring-2 ring-apple-blue' : ''}`}>
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg">{clase?.nombre_materia} - {clase?.grado_asignado}</h3>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[plan.status]}`}>
                                                {plan.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-apple-gray font-light mt-2">Docente: {docenteNombre}</p>
                                        <p className="text-sm text-apple-gray font-light">Semana {plan.semana} | {plan.lapso} | {plan.ano_escolar}</p>
                                        <p className="text-xs text-apple-gray font-light mt-2">Creado: {new Date(plan.fecha_creacion).toLocaleDateString()}</p>
                                        {plan.competencia_indicadores && (
                                            <div className="mt-4 space-y-1 text-sm">
                                                <p><span className="font-semibold">Competencia:</span> {plan.competencia_indicadores.length > 50 ? plan.competencia_indicadores.substring(0, 50) + '...' : plan.competencia_indicadores}</p>
                                            </div>
                                        )}
                                        {plan.observaciones && (
                                            <div className="mt-4 py-3 px-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                                                <p className="text-sm text-yellow-800 font-light"><span className="font-medium">Observaciones:</span> {plan.observaciones}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-apple-gray-light">
                                        <button onClick={() => handleGetAiSuggestions(plan)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-apple font-medium">
                                            <SparklesIcon className="h-4 w-4" /> Coco
                                        </button>
                                        <button onClick={() => handleOpenModal(plan, true)} className="text-xs px-4 py-1.5 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light transition-apple font-medium">Ver</button>
                                        {(currentUser.role === 'coordinador' || currentUser.role === 'directivo') &&
                                            <button onClick={() => handleOpenModal(plan)} className="text-xs px-4 py-1.5 bg-apple-blue text-white rounded-lg hover:opacity-90 transition-apple font-medium">Revisar</button>
                                        }
                                        {currentUser.role === 'docente' && (plan.status === 'Borrador' || plan.status === 'Revisado') &&
                                            <button onClick={() => handleOpenModal(plan)} className="text-xs px-4 py-1.5 bg-apple-green text-white rounded-lg hover:opacity-90 transition-apple font-medium">Editar</button>
                                        }
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        )
    };

    // Early return if currentUser is not available (after hooks)
    if (!currentUser) {
        return <div className="mb-8 py-12 text-center"><p className="text-apple-gray font-light">Cargando...</p></div>;
    }

    return (
        <div>
            {renderBoardView()}

            {isModalOpen && (
                <PlanningFormModal
                    plan={selectedPlan}
                    userRole={currentUser.role}
                    userId={currentUser.docenteId || ''}
                    assignedClasses={teacherClasses}
                    onClose={handleCloseModal}
                    onSave={handleSavePlan}
                    isReadOnly={isReadOnlyModal}
                    currentUserEmail={currentUser.email}
                />
            )}
            {isAiModalOpen && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-purple-500" />Sugerencias de Coco</h2>
                            <button onClick={() => setAiModalOpen(false)}><CloseIcon /></button>
                        </div>
                        {isLoadingAi ? (
                            <div className="text-center py-8">Generando sugerencias...</div>
                        ) : (
                            <div>
                                <textarea
                                    value={aiSuggestions}
                                    onChange={(e) => setAiSuggestions(e.target.value)}
                                    className="w-full h-64 p-4 border rounded-md"
                                    placeholder="Las sugerencias aparecerán aquí..."
                                />
                                <div className="flex justify-end gap-4 mt-6">
                                    <button onClick={() => setAiModalOpen(false)} className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light font-medium transition-apple">Cerrar</button>
                                    <button onClick={async () => {
                                        if (selectedPlan && aiSuggestions) {
                                            const updatedPlan = { ...selectedPlan, competencia_indicadores: aiSuggestions };
                                            await handleSavePlan(updatedPlan);
                                            setAiModalOpen(false);
                                        }
                                    }} className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:opacity-90 font-medium transition-apple">Aplicar Sugerencias</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ScheduleView: React.FC<{
    schedules: WeeklySchedules;
    setSchedules: React.Dispatch<React.SetStateAction<WeeklySchedules>>;
    clases: Clase[];
    docentes: Docente[];
    currentUser: Usuario;
    alumnos: Alumno[];
    aulas: Aula[];
    convertHorario: (db: any) => Horario;
}> = ({ schedules, setSchedules, clases, docentes, currentUser, alumnos, aulas, convertHorario }) => {
    const allGrades = useMemo(() => Array.from(new Set(alumnos.map(a => a.salon))).sort(), [alumnos]);
    const [selectedGrade, setSelectedGrade] = useState(allGrades[0] || '');
    const [currentWeek, setCurrentWeek] = useState<number | null>(null);
    const [draggedItem, setDraggedItem] = useState<any>(null);
    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [eventData, setEventData] = useState<{ dia: number, hora: string, desc: string, id: string | null }>({ dia: 0, hora: '', desc: '', id: null });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [englishLevelAssignments, setEnglishLevelAssignments] = useState<Array<{
        id_docente: string,
        nivel_ingles: string,
        docente?: Docente,
        aula?: Aula
    }>>([]);

    // Utility function to normalize time format to HH:MM
    const normalizeTime = (time: string): string => {
        return time.length >= 5 ? time.substring(0, 5) : time;
    };

    // Debug: Log clases data
    useEffect(() => {
        console.log('=== SCHEDULE VIEW CLASES DEBUG ===');
        console.log('Total clases received:', clases.length);
        console.log('Selected grade:', selectedGrade);
        if (clases.length > 0) {
            console.log('Sample clase:', clases[0]);
            console.log('Unique grades in clases:', [...new Set(clases.map(c => c.grado_asignado))]);
            console.log('Clases for selected grade:', clases.filter(c => c.grado_asignado === selectedGrade).map(c => c.nombre_materia));
        } else {
            console.warn('⚠️ No clases data received!');
        }
        console.log('=== END CLASES DEBUG ===');
    }, [clases, selectedGrade]);

    // Estados para lapsos y semanas
    const anoEscolar = '2025-2026'; // TODO: Obtener del contexto/configuración
    const [lapsos, setLapsos] = useState<Lapso[]>([]);
    const [selectedLapso, setSelectedLapso] = useState<string>('');
    const [semanasInfo, setSemanasInfo] = useState<Map<number, SemanaInfo>>(new Map());

    // Cargar lapsos al montar
    useEffect(() => {
        const loadLapsos = async () => {
            try {
                const lapsosData = await lapsosService.getByAnoEscolar(anoEscolar);
                setLapsos(lapsosData);
                if (lapsosData.length > 0) {
                    setSelectedLapso(lapsosData[0].lapso);
                } else {
                    console.warn('No se encontraron lapsos para el año escolar', anoEscolar);
                    console.warn('Por favor, ejecuta las migraciones SQL o crea lapsos desde la vista de administración');
                }
            } catch (error) {
                console.error('Error loading lapsos:', error);
                // Si hay error, puede ser que las tablas no existan aún
                console.warn('Asegúrate de haber ejecutado las migraciones SQL: 016, 017, 018');
            }
        };
        loadLapsos();
    }, [anoEscolar]);

    // Cargar información de semanas cuando cambia el lapso
    useEffect(() => {
        const loadSemanasInfo = async () => {
            if (!selectedLapso) return;

            const lapso = lapsos.find(l => l.lapso === selectedLapso);
            if (!lapso) return;

            try {
                const semanasData = await semanasLapsoService.getByLapso(lapso.id_lapso);
                const semanasMap = new Map<number, SemanaInfo>();

                semanasData.forEach(s => {
                    semanasMap.set(s.numero_semana, {
                        numero_semana: s.numero_semana,
                        fecha_inicio: s.fecha_inicio,
                        fecha_fin: s.fecha_fin,
                        lapso: lapso.lapso,
                        ano_escolar: lapso.ano_escolar,
                        id_lapso: lapso.id_lapso
                    });
                });

                setSemanasInfo(semanasMap);

                // Si la semana actual no está en el nuevo lapso, resetear a la primera semana
                if (currentWeek && !semanasMap.has(currentWeek)) {
                    const primeraSemana = Math.min(...Array.from(semanasMap.keys()));
                    setCurrentWeek(primeraSemana);
                } else if (!currentWeek && semanasMap.size > 0) {
                    const primeraSemana = Math.min(...Array.from(semanasMap.keys()));
                    setCurrentWeek(primeraSemana);
                }
            } catch (error) {
                console.error('Error loading semanas info:', error);
            }
        };

        loadSemanasInfo();
    }, [selectedLapso, lapsos]);

    // Cargar asignaciones de niveles de inglés con información de docentes y aulas
    useEffect(() => {
        const loadEnglishAssignments = async () => {
            try {

                // Cargar asignaciones de docentes
                const { data: docenteAssignments, error: docenteError } = await supabase
                    .from('asignacion_docente_nivel_ingles')
                    .select('id_docente, nivel_ingles')
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (docenteError) throw docenteError;

                // Cargar asignaciones de aulas
                const { data: aulaAssignments, error: aulaError } = await supabase
                    .from('asignacion_aula_nivel_ingles')
                    .select('nivel_ingles, id_aula')
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (aulaError) {
                    console.warn('Error loading aula assignments:', aulaError);
                    // Continuar sin aulas si hay error
                }

                // Combinar información
                const assignmentsWithInfo = (docenteAssignments || []).map(assignment => {
                    const docente = docentes.find(d => d.id_docente === assignment.id_docente);
                    const aulaAssignment = aulaAssignments?.find(a => a.nivel_ingles === assignment.nivel_ingles);
                    const aula = aulaAssignment ? aulas.find(a => a.id_aula === aulaAssignment.id_aula) : undefined;

                    return {
                        ...assignment,
                        docente,
                        aula
                    };
                });

                setEnglishLevelAssignments(assignmentsWithInfo);
            } catch (error) {
                console.error('Error loading English level assignments:', error);
            }
        };

        loadEnglishAssignments();
    }, [docentes, aulas]);

    const isPrimaryGrade = useMemo(() => {
        const gradeNum = parseInt(selectedGrade.match(/\d+/)?.[0] || '0');
        return gradeNum >= 1 && gradeNum <= 6;
    }, [selectedGrade]);

    const timeSlots = isPrimaryGrade ? TIME_SLOTS_PRIMARIA : TIME_SLOTS_STANDARD;

    const weeklySchedule = useMemo(() => {
        if (!currentWeek) return [];
        if (!schedules[selectedGrade] || !schedules[selectedGrade][currentWeek]) {
            // Try to get from previous week, or week 1 if currentWeek is 1
            let previousWeekSchedule: Horario[] = [];
            if (currentWeek > 1) {
                previousWeekSchedule = schedules[selectedGrade]?.[currentWeek - 1] || [];
            }
            // If no previous week, try week 1
            if (previousWeekSchedule.length === 0 && currentWeek > 1) {
                previousWeekSchedule = schedules[selectedGrade]?.[1] || [];
            }
            // Create a deep copy for the new week with updated IDs to avoid conflicts
            return previousWeekSchedule.map((h, index) => ({
                ...h,
                id_horario: `h-${selectedGrade.replace(/\s+/g, '-')}-${currentWeek}-${h.dia_semana}-${h.hora_inicio.replace(':', '')}-${index}`
            }));
        }
        return schedules[selectedGrade][currentWeek];
    }, [schedules, selectedGrade, currentWeek]);

    useEffect(() => {
        // This effect ensures that when a schedule for a new week is generated from the previous one, it gets saved to the state.
        if (currentWeek && (!schedules[selectedGrade] || !schedules[selectedGrade][currentWeek])) {
            // Only save if weeklySchedule has content (copied from previous week)
            if (weeklySchedule.length > 0) {
                setSchedules(prev => ({
                    ...prev,
                    [selectedGrade]: {
                        ...prev[selectedGrade],
                        [currentWeek]: weeklySchedule
                    }
                }));
            }
        }
        // Removed 'schedules' from dependencies to avoid potential infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weeklySchedule, selectedGrade, currentWeek, setSchedules]);

    // Helper function to group English classes by time and skill
    // Para clases consolidadas, crea "horarios virtuales" basados en asignaciones de niveles
    const groupEnglishClassesByTimeAndSkill = useMemo(() => {
        const grouped: Map<string, Horario[]> = new Map();

        weeklySchedule.forEach(item => {
            if (item.id_clase) {
                const clase = clases.find(c => c.id_clase === item.id_clase);
                const isEnglishConsolidated = clase?.es_ingles_primaria &&
                    clase?.nivel_ingles === null && // Clase consolidada
                    clase?.skill_rutina &&
                    (selectedGrade === '5to Grado' || selectedGrade === '6to Grado');

                if (isEnglishConsolidated) {
                    // Para clases consolidadas, crear horarios virtuales para cada nivel/docente
                    const skill = clase.skill_rutina || 'Inglés';
                    const horaInicio = normalizeTime(item.hora_inicio);
                    const key = `${item.dia_semana}-${horaInicio}-${skill}`;

                    // Obtener todas las asignaciones de niveles activas para este skill
                    // Crear un horario virtual para cada nivel/docente
                    const virtualHorarios: Horario[] = englishLevelAssignments.map(assignment => ({
                        ...item,
                        id_horario: `${item.id_horario}-${assignment.nivel_ingles}-${assignment.id_docente}`, // ID único virtual
                        id_docente: assignment.id_docente,
                        // Mantener id_clase para referencia a la clase consolidada
                    }));

                    if (virtualHorarios.length > 0) {
                        grouped.set(key, virtualHorarios);
                    }
                } else {
                    // Para clases de inglés con nivel específico (1er-4to o clases antiguas)
                    const isEnglish = clase?.es_ingles_primaria &&
                        clase?.nivel_ingles &&
                        (selectedGrade === '5to Grado' || selectedGrade === '6to Grado');

                    if (isEnglish) {
                        const skill = clase.skill_rutina || 'Inglés';
                        const horaInicio = normalizeTime(item.hora_inicio);
                        const key = `${item.dia_semana}-${horaInicio}-${skill}`;

                        if (!grouped.has(key)) {
                            grouped.set(key, []);
                        }
                        grouped.get(key)!.push(item);
                    }
                }
            }
        });

        return grouped;
    }, [weeklySchedule, clases, selectedGrade, englishLevelAssignments]);

    const handleDrop = (day: number, slot: string) => {
        if (currentUser.role === 'docente') return; // Docentes no pueden editar
        if (!draggedItem || !currentWeek) return;

        // Remove the item from its current position
        const updatedSchedule = weeklySchedule.filter(item =>
            !(draggedItem.type === 'class' && item.id_clase === draggedItem.id) &&
            !(draggedItem.type === 'event' && item.id_horario === draggedItem.id)
        );

        // Create new item with updated position
        // Para clases consolidadas de inglés (SOLO 5to-6to), id_docente será null (se consultará de asignaciones)
        const clase = clases.find(c => c.id_clase === draggedItem.id);
        // SOLO las clases de inglés de 5to-6to sin nivel específico son consolidadas
        // Las clases de 1er-4to tienen id_docente_asignado directamente y NO son consolidadas
        const isConsolidatedEnglish = clase?.es_ingles_primaria &&
            clase?.nivel_ingles === null &&
            clase?.skill_rutina &&
            (clase?.grado_asignado === '5to Grado' || clase?.grado_asignado === '6to Grado');

        const slotParts = slot.split(' - ');
        const hora_inicio = slotParts[0];
        const hora_fin = slotParts[1] || hora_inicio;

        const newItem: Horario = draggedItem.type === 'class'
            ? {
                id_horario: `h-${selectedGrade.replace(/\s+/g, '-')}-${currentWeek}-${day}-${hora_inicio.replace(':', '')}-${draggedItem.id}`,
                // CORRECCIÓN: Para clases consolidadas de inglés (5to-6to), usar null. Para otras clases (incluyendo inglés 1er-4to), usar el docente de la clase
                id_docente: isConsolidatedEnglish ? null : (draggedItem.docenteId || clase?.id_docente_asignado || null),
                id_clase: draggedItem.id,
                id_aula: clase?.id_aula || null, // Incluir aula de la clase
                lapso: selectedLapso || null, // NUEVO: Incluir lapso
                ano_escolar: anoEscolar, // NUEVO: Incluir año escolar
                dia_semana: day,
                hora_inicio: hora_inicio,
                hora_fin: hora_fin,
                evento_descripcion: null
            }
            : {
                ...draggedItem.data,
                lapso: selectedLapso || null, // NUEVO: Incluir lapso
                ano_escolar: anoEscolar, // NUEVO: Incluir año escolar
                dia_semana: day,
                hora_inicio: hora_inicio,
                hora_fin: hora_fin,
            };

        setSchedules(prev => ({
            ...prev,
            [selectedGrade]: {
                ...prev[selectedGrade],
                [currentWeek]: [...updatedSchedule, newItem]
            }
        }));

        setDraggedItem(null);
    };

    // Handle dropping outside the schedule (to remove from schedule)
    const handleDropOutside = () => {
        if (!draggedItem || !currentWeek) return;

        // Remove the item from the schedule
        const updatedSchedule = weeklySchedule.filter(item =>
            !(draggedItem.type === 'class' && item.id_clase === draggedItem.id) &&
            !(draggedItem.type === 'event' && item.id_horario === draggedItem.id)
        );

        setSchedules(prev => ({
            ...prev,
            [selectedGrade]: {
                ...prev[selectedGrade],
                [currentWeek]: updatedSchedule
            }
        }));

        setDraggedItem(null);
    };

    const handleDragStart = (e: React.DragEvent, item: any, type: 'class' | 'event', data?: any) => {
        if (currentUser.role === 'docente') {
            e.preventDefault(); // Prevenir drag para docentes
            return;
        }
        const payload = type === 'class'
            ? { id: item.id_clase, docenteId: item.id_docente_asignado, type }
            : { id: item.id_horario, type, data: item };
        e.dataTransfer.setData("application/json", JSON.stringify(payload));
        setDraggedItem(payload);
    };

    const unassignedClasses = useMemo(() => {
        console.log('=== UNASSIGNED CLASSES DEBUG ===');
        console.log('Total clases:', clases.length);
        console.log('Selected grade:', selectedGrade);
        console.log('Weekly schedule length:', weeklySchedule.length);

        const assignedClassIds = new Set(weeklySchedule.filter(s => s.id_clase).map(s => s.id_clase));
        console.log('Assigned class IDs:', Array.from(assignedClassIds));

        const filtered = clases.filter(c => {
            const matchesGrade = c.grado_asignado === selectedGrade;

            if (!matchesGrade && c.grado_asignado) {
                console.log(`Class "${c.nombre_materia}" grade mismatch: "${c.grado_asignado}" !== "${selectedGrade}"`);
            }

            // Incluir clases del grado seleccionado normalmente
            if (c.grado_asignado === selectedGrade && !assignedClassIds.has(c.id_clase)) {
                // Para clases de inglés consolidadas (SOLO 5to-6to), solo mostrar si no están asignadas
                const isConsolidatedEnglish = c.es_ingles_primaria &&
                    c.nivel_ingles === null &&
                    c.skill_rutina &&
                    (c.grado_asignado === '5to Grado' || c.grado_asignado === '6to Grado');

                if (isConsolidatedEnglish) {
                    return true; // Clase consolidada de inglés (5to-6to)
                }
                // Para otras clases normales (incluyendo inglés de 1er-4to que tienen id_docente_asignado)
                if (!c.es_ingles_primaria || c.nivel_ingles !== null || !c.skill_rutina) {
                    return true;
                }
            }

            // Para niveles de inglés consolidados (5to-6to): incluir clases consolidadas si:
            // 1. Es una clase de inglés de primaria sin nivel específico (consolidada)
            // 2. El grado seleccionado es 5to o 6to
            // 3. La clase tiene grado_asignado = '5to Grado'
            // 4. La clase no está ya asignada
            if (c.es_ingles_primaria &&
                c.nivel_ingles === null && // Clase consolidada
                c.skill_rutina && // Tiene skill definido
                (selectedGrade === '5to Grado' || selectedGrade === '6to Grado') &&
                c.grado_asignado === '5to Grado' &&
                !assignedClassIds.has(c.id_clase)) {
                return true;
            }

            return false;
        });

        console.log('Unassigned classes count:', filtered.length);
        console.log('Unassigned classes:', filtered.map(c => `${c.nombre_materia} (${c.grado_asignado})`));
        console.log('=== END DEBUG ===');

        return filtered;
    }, [clases, weeklySchedule, selectedGrade]);

    const handleOpenEventModal = (dia: number, hora: string, existingEvent: Horario | null = null) => {
        if (currentUser.role !== 'coordinador' && currentUser.role !== 'directivo') return;
        setEventData({
            dia,
            hora,
            desc: existingEvent?.evento_descripcion || '',
            id: existingEvent?.id_horario || null,
        });
        setEventModalOpen(true);
    };

    const handleSaveEvent = () => {
        if (!eventData.desc) return;
        const [hora_inicio, hora_fin] = eventData.hora.split(' - ');

        let updatedSchedule = [...weeklySchedule];
        if (eventData.id) { // Editing existing event
            updatedSchedule = updatedSchedule.map(h => h.id_horario === eventData.id ? { ...h, evento_descripcion: eventData.desc } : h);
        } else { // Creating new event
            const newEvent: Horario = {
                id_horario: `evt-${Date.now()}`,
                id_docente: null,
                id_clase: null,
                lapso: selectedLapso || null, // NUEVO: Incluir lapso
                ano_escolar: anoEscolar, // NUEVO: Incluir año escolar
                dia_semana: eventData.dia,
                hora_inicio,
                hora_fin,
                evento_descripcion: eventData.desc,
            };
            updatedSchedule.push(newEvent);
        }

        setSchedules(prev => ({
            ...prev,
            [selectedGrade]: { ...prev[selectedGrade], [currentWeek]: updatedSchedule }
        }));
        setEventModalOpen(false);
    };

    const handleDeleteEvent = () => {
        if (!eventData.id) return;
        const updatedSchedule = weeklySchedule.filter(h => h.id_horario !== eventData.id);
        setSchedules(prev => ({
            ...prev,
            [selectedGrade]: { ...prev[selectedGrade], [currentWeek]: updatedSchedule }
        }));
        setEventModalOpen(false);
    }

    const handleSaveSchedule = async () => {
        if (!currentWeek || !selectedGrade) {
            setSaveMessage({ type: 'error', text: 'Por favor seleccione un grado y una semana' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        // Validate that there's something to save
        const currentSchedule = schedules[selectedGrade]?.[currentWeek] || [];
        if (currentSchedule.length === 0) {
            setSaveMessage({ type: 'error', text: 'No hay horarios para guardar en esta semana' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Get current horarios for this grade and week from DB
            const existingHorarios = await horariosService.getByGradeAndWeek(selectedGrade, currentWeek);

            // Create a map of existing horarios by key (dia_semana-hora_inicio-id_clase o evento_descripcion)
            // Para clases consolidadas de inglés, incluir el nivel en la clave
            const existingMap = new Map<string, HorarioDB>();
            existingHorarios.forEach(h => {
                if (h.evento_descripcion) {
                    // Para eventos
                    const key = `${h.dia_semana}-${h.hora_inicio}-event-${h.evento_descripcion}`;
                    existingMap.set(key, h);
                } else if (h.id_clase) {
                    // Para clases, verificar si es consolidada de inglés
                    const clase = clases.find(c => c.id_clase === h.id_clase);
                    // SOLO las clases de inglés de 5to-6to sin nivel específico son consolidadas
                    // Las clases de 1er-4to tienen id_docente_asignado directamente y NO son consolidadas
                    const isConsolidatedEnglish = clase?.es_ingles_primaria &&
                        clase?.nivel_ingles === null &&
                        clase?.skill_rutina &&
                        (clase?.grado_asignado === '5to Grado' || clase?.grado_asignado === '6to Grado');

                    if (isConsolidatedEnglish) {
                        // Para clases consolidadas, necesitamos identificar el nivel por el docente
                        // Buscar el nivel basado en el docente asignado
                        const assignment = englishLevelAssignments.find(a => a.id_docente === h.id_docente);
                        if (assignment) {
                            const key = `${h.dia_semana}-${h.hora_inicio}-class-${h.id_clase}-${assignment.nivel_ingles}`;
                            existingMap.set(key, h);
                        } else {
                            // Si no encontramos el nivel, usar clave genérica
                            const key = `${h.dia_semana}-${h.hora_inicio}-class-${h.id_clase}`;
                            existingMap.set(key, h);
                        }
                    } else {
                        // Para clases regulares
                        const key = `${h.dia_semana}-${h.hora_inicio}-class-${h.id_clase}`;
                        existingMap.set(key, h);
                    }
                } else {
                    // Clase sin id_clase
                    const key = `${h.dia_semana}-${h.hora_inicio}-class-null`;
                    existingMap.set(key, h);
                }
            });

            // Get current schedule for this week
            const currentSchedule = schedules[selectedGrade]?.[currentWeek] || [];

            // Create a map of new horarios con la misma clave
            const newHorariosMap = new Map<string, Omit<HorarioDB, 'id_horario' | 'created_at' | 'updated_at'>>();
            const horariosToCreate: Array<Omit<HorarioDB, 'id_horario' | 'created_at' | 'updated_at'>> = [];
            const horariosToDelete: string[] = [];

            // Process each item in the current schedule
            for (const horario of currentSchedule) {
                const clase = horario.id_clase ? clases.find(c => c.id_clase === horario.id_clase) : null;
                // SOLO las clases de inglés de 5to-6to sin nivel específico son consolidadas
                // Las clases de 1er-4to tienen id_docente_asignado directamente y NO son consolidadas
                const isConsolidatedEnglish = clase?.es_ingles_primaria &&
                    clase?.nivel_ingles === null &&
                    clase?.skill_rutina &&
                    (clase?.grado_asignado === '5to Grado' || clase?.grado_asignado === '6to Grado');

                if (isConsolidatedEnglish && horario.id_clase) {
                    // Para clases consolidadas de inglés, crear un horario por cada nivel con su docente
                    const niveles = ['Basic', 'Lower', 'Upper'];

                    for (const nivel of niveles) {
                        const assignment = englishLevelAssignments.find(a => a.nivel_ingles === nivel);
                        if (!assignment) continue; // Solo crear horarios para niveles con docente asignado

                        // Obtener aula para este nivel
                        const aulaAssignment = await supabase
                            .from('asignacion_aula_nivel_ingles')
                            .select('id_aula')
                            .eq('nivel_ingles', nivel)
                            .eq('ano_escolar', anoEscolar)
                            .eq('activa', true)
                            .maybeSingle();

                        const key = `${horario.dia_semana}-${horario.hora_inicio}-class-${horario.id_clase}-${nivel}`;

                        const newHorario = {
                            grado: selectedGrade,
                            semana: currentWeek,
                            lapso: selectedLapso || null,
                            ano_escolar: anoEscolar,
                            id_docente: assignment.id_docente, // Docente del nivel
                            id_clase: horario.id_clase, // Mantener referencia a clase consolidada
                            id_aula: aulaAssignment?.data?.id_aula || null,
                            dia_semana: horario.dia_semana,
                            hora_inicio: horario.hora_inicio,
                            hora_fin: horario.hora_fin,
                            evento_descripcion: null
                        };

                        newHorariosMap.set(key, newHorario);

                        const existing = existingMap.get(key);
                        if (!existing) {
                            horariosToCreate.push(newHorario);
                        } else {
                            if (existing.id_docente !== newHorario.id_docente ||
                                existing.id_clase !== newHorario.id_clase ||
                                existing.id_aula !== newHorario.id_aula ||
                                existing.hora_fin !== newHorario.hora_fin) {
                                await horariosService.update(existing.id_horario, {
                                    id_docente: newHorario.id_docente,
                                    id_clase: newHorario.id_clase,
                                    id_aula: newHorario.id_aula,
                                    hora_fin: newHorario.hora_fin
                                });
                            }
                        }
                    }
                } else {
                    // Para clases regulares o eventos
                    const key = horario.evento_descripcion
                        ? `${horario.dia_semana}-${horario.hora_inicio}-event-${horario.evento_descripcion}`
                        : `${horario.dia_semana}-${horario.hora_inicio}-class-${horario.id_clase || 'null'}`;

                    // CORRECCIÓN: Si id_docente es null pero la clase tiene docente, usar el de la clase
                    const correctedIdDocente = horario.id_docente || clase?.id_docente_asignado || null;

                    const newHorario = {
                        grado: selectedGrade,
                        semana: currentWeek,
                        lapso: selectedLapso || null,
                        ano_escolar: anoEscolar,
                        id_docente: correctedIdDocente,
                        id_clase: horario.id_clase,
                        id_aula: horario.id_aula || clase?.id_aula || null,
                        dia_semana: horario.dia_semana,
                        hora_inicio: horario.hora_inicio,
                        hora_fin: horario.hora_fin,
                        evento_descripcion: horario.evento_descripcion
                    };
                    newHorariosMap.set(key, newHorario);

                    const existing = existingMap.get(key);
                    if (!existing) {
                        horariosToCreate.push(newHorario);
                    } else {
                        if (existing.id_docente !== newHorario.id_docente ||
                            existing.id_clase !== newHorario.id_clase ||
                            existing.id_aula !== newHorario.id_aula ||
                            existing.hora_fin !== newHorario.hora_fin ||
                            existing.evento_descripcion !== newHorario.evento_descripcion) {
                            await horariosService.update(existing.id_horario, {
                                id_docente: newHorario.id_docente,
                                id_clase: newHorario.id_clase,
                                id_aula: newHorario.id_aula,
                                hora_fin: newHorario.hora_fin,
                                evento_descripcion: newHorario.evento_descripcion
                            });
                        }
                    }
                }
            }

            // Find horarios to delete (exist in DB but not in new schedule)
            existingMap.forEach((horario, key) => {
                if (!newHorariosMap.has(key)) {
                    horariosToDelete.push(horario.id_horario);
                }
            });

            // Delete removed horarios
            if (horariosToDelete.length > 0) {
                for (const id of horariosToDelete) {
                    await horariosService.delete(id);
                }
            }

            // Batch insert new horarios
            if (horariosToCreate.length > 0) {
                const batchSize = 100;
                for (let i = 0; i < horariosToCreate.length; i += batchSize) {
                    const batch = horariosToCreate.slice(i, i + batchSize);
                    const { error: insertError } = await supabase.from('horarios').insert(batch);
                    if (insertError) {
                        throw new Error(`Error al insertar horarios: ${insertError.message}`);
                    }
                }
            }

            // Recargar horarios desde la base de datos para asegurar consistencia
            // Usar el método que filtra por lapso y ano_escolar si están disponibles
            const reloadedHorarios = selectedLapso
                ? await horariosService.getByGradeWeekAndLapso(selectedGrade, currentWeek, selectedLapso, anoEscolar)
                : await horariosService.getByGradeAndWeek(selectedGrade, currentWeek);
            const reloadedSchedulesMap: WeeklySchedules = {};
            if (!reloadedSchedulesMap[selectedGrade]) {
                reloadedSchedulesMap[selectedGrade] = {};
            }
            if (!reloadedSchedulesMap[selectedGrade][currentWeek]) {
                reloadedSchedulesMap[selectedGrade][currentWeek] = [];
            }
            reloadedHorarios.forEach(h => {
                reloadedSchedulesMap[selectedGrade][currentWeek].push(convertHorario(h));
            });

            // Actualizar el estado con los horarios recargados
            setSchedules(prev => ({
                ...prev,
                [selectedGrade]: {
                    ...prev[selectedGrade],
                    [currentWeek]: reloadedSchedulesMap[selectedGrade][currentWeek]
                }
            }));

            setSaveMessage({ type: 'success', text: `Horarios de la Semana ${currentWeek} guardados exitosamente` });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error: any) {
            console.error('Error saving schedule:', error);

            // Provide specific error messages based on error type
            let errorMessage = 'Error al guardar horarios';

            if (error.code === 'PGRST116') {
                errorMessage = 'No tienes permisos para guardar horarios. Contacta al administrador.';
            } else if (error.code === '23505' || error.message?.includes('unique')) {
                errorMessage = 'Ya existe un horario en este slot. Por favor, elimina el horario existente primero.';
            } else if (error.message?.includes('permission') || error.message?.includes('RLS')) {
                errorMessage = 'No tienes permisos para realizar esta acción.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            setSaveMessage({ type: 'error', text: errorMessage });
            setTimeout(() => setSaveMessage(null), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedGradeColor = getGradeColor(selectedGrade);

    return (
        <div className="flex gap-6">
            <div className="flex-grow mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={selectedGrade}
                                onChange={e => setSelectedGrade(e.target.value)}
                                className="p-2 border-2 rounded-md shadow-sm pr-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium"
                                style={{
                                    borderColor: selectedGradeColor,
                                    paddingRight: '2.5rem'
                                }}
                            >
                                {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <div
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                                style={{ backgroundColor: selectedGradeColor }}
                            ></div>
                        </div>
                        {selectedGrade && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm" style={{ backgroundColor: hexToRgba(selectedGradeColor, 0.15) }}>
                                <div
                                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: selectedGradeColor }}
                                ></div>
                                <span className="text-sm font-semibold text-gray-700">{selectedGrade}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Lapso:</label>
                            <select
                                value={selectedLapso}
                                onChange={(e) => setSelectedLapso(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md shadow-sm min-w-[150px]"
                                disabled={lapsos.length === 0}
                            >
                                <option value="">Elegir Lapso</option>
                                {lapsos.map(lapso => (
                                    <option key={lapso.id_lapso} value={lapso.lapso}>{lapso.lapso}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Semana:</label>
                            <select
                                value={currentWeek || ''}
                                onChange={(e) => setCurrentWeek(e.target.value ? parseInt(e.target.value) : null)}
                                className="p-2 border border-gray-300 rounded-md shadow-sm min-w-[200px]"
                                disabled={!selectedLapso || semanasInfo.size === 0}
                            >
                                <option value="">Elegir Semana</option>
                                {Array.from(semanasInfo.keys()).sort((a, b) => a - b).map(week => {
                                    const semanaInfo = semanasInfo.get(week);
                                    return (
                                        <option key={week} value={week}>
                                            Semana {week} {semanaInfo ? `(${formatDateRange(semanaInfo.fecha_inicio, semanaInfo.fecha_fin)})` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {currentWeek && (currentUser.role === 'coordinador' || currentUser.role === 'directivo') && (
                            <button
                                onClick={handleSaveSchedule}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors ${isSaving
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-brand-primary text-white hover:bg-opacity-90'
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon />
                                        Guardar Horario
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                {saveMessage && (
                    <div className={`mb-4 p-3 rounded-md ${saveMessage.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                        {saveMessage.text}
                    </div>
                )}
                {!currentWeek ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg font-medium">Seleccione una semana para ver el horario</p>
                        <p className="text-sm mt-2">Use el menú desplegable arriba para elegir una semana</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Banner informativo con color del grado */}
                        {selectedGrade && (
                            <div
                                className="mb-4 p-4 rounded-lg flex items-center justify-between shadow-sm border-l-4"
                                style={{
                                    backgroundColor: hexToRgba(selectedGradeColor, 0.1), // 10% de opacidad
                                    borderLeftColor: selectedGradeColor
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full shadow-sm border-2 border-white"
                                        style={{ backgroundColor: selectedGradeColor }}
                                    ></div>
                                    <div>
                                        <span className="text-sm font-semibold text-gray-700">
                                            Horario de <strong>{selectedGrade}</strong>
                                        </span>
                                        {selectedLapso && semanasInfo.size > 0 && currentWeek && (() => {
                                            const semanaInfo = semanasInfo.get(currentWeek);
                                            return (
                                                <span className="text-xs text-gray-500 ml-2">
                                                    • {selectedLapso} • Semana {currentWeek}
                                                    {semanaInfo && (
                                                        <span className="ml-1">
                                                            ({formatDateRange(semanaInfo.fecha_inicio, semanaInfo.fecha_fin)})
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                        <table className="min-w-full divide-y divide-gray-200 border shadow-sm">
                            <thead>
                                <tr>
                                    <th
                                        className="px-2 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40 border-r border-white/20"
                                        style={{ backgroundColor: selectedGradeColor }}
                                    >
                                        Hora
                                    </th>
                                    {WEEK_DAYS.map(d => (
                                        <th
                                            key={d}
                                            className="px-2 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20 last:border-r-0"
                                            style={{ backgroundColor: selectedGradeColor }}
                                        >
                                            {d}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {timeSlots.map(slot => (
                                    <tr key={slot}>
                                        <td
                                            className="px-2 py-2 whitespace-nowrap text-sm font-medium text-white border-r border-gray-300"
                                            style={{ backgroundColor: hexToRgba(selectedGradeColor, 0.8) }} // 80% de opacidad para la columna de hora
                                        >
                                            {slot.replace('-', ' - ')}
                                        </td>
                                        {WEEK_DAYS.map((_, dayIndex) => {
                                            const day = dayIndex + 1;
                                            const [horaInicio] = slot.split(' - ');
                                            const horaInicioFormatted = horaInicio.trim();

                                            // Find all items at this time slot (could be multiple for English classes)
                                            // Normalize hora_inicio for comparison (HH:MM format)
                                            const itemsAtSlot = weeklySchedule.filter(s => {
                                                const sHora = normalizeTime(s.hora_inicio);
                                                return s.dia_semana === day && sHora === horaInicioFormatted;
                                            });

                                            // Check if this is an English class group
                                            const firstItem = itemsAtSlot[0];
                                            let englishGroup: Horario[] | null = null;

                                            if (firstItem?.id_clase) {
                                                const clase = clases.find(c => c.id_clase === firstItem.id_clase);
                                                // Detectar clases consolidadas (nivel_ingles === null) o clases con nivel específico
                                                const isEnglishConsolidated = clase?.es_ingles_primaria &&
                                                    clase?.nivel_ingles === null &&
                                                    clase?.skill_rutina &&
                                                    (selectedGrade === '5to Grado' || selectedGrade === '6to Grado');
                                                const isEnglishWithLevel = clase?.es_ingles_primaria &&
                                                    clase?.nivel_ingles &&
                                                    (selectedGrade === '5to Grado' || selectedGrade === '6to Grado');

                                                if (isEnglishConsolidated || isEnglishWithLevel) {
                                                    const skill = clase.skill_rutina || 'Inglés';
                                                    const key = `${day}-${horaInicioFormatted}-${skill}`;
                                                    englishGroup = groupEnglishClassesByTimeAndSkill.get(key) || null;

                                                    // Only show consolidated block if there are multiple levels or if it's the first item in the group
                                                    if (englishGroup && englishGroup.length > 0) {
                                                        // Para clases consolidadas, siempre mostrar el bloque
                                                        // Para clases con nivel, verificar si es la primera del grupo
                                                        const isFirstInGroup = isEnglishConsolidated ||
                                                            englishGroup[0].id_clase === firstItem.id_clase;
                                                        if (!isFirstInGroup) {
                                                            // Skip rendering for subsequent items in the group
                                                            return <td key={`${day}-${slot}`} className="border p-1 align-top text-xs relative h-24"></td>;
                                                        }
                                                    }
                                                }
                                            }

                                            // Use first item for non-English or single-item slots
                                            const item = firstItem;

                                            return (
                                                <td key={`${day}-${slot}`}
                                                    className="border p-1 align-top text-xs relative h-24"
                                                    onDrop={() => handleDrop(day, slot)}
                                                    onDragOver={(e) => {
                                                        if (currentUser.role !== 'docente') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onDoubleClick={() => {
                                                        if (currentUser.role !== 'docente' && !item) {
                                                            handleOpenEventModal(day, slot);
                                                        }
                                                    }}
                                                >
                                                    {item && (
                                                        item.evento_descripcion ? (
                                                            <div
                                                                onClick={() => {
                                                                    if (currentUser.role !== 'docente') {
                                                                        handleOpenEventModal(day, slot, item);
                                                                    }
                                                                }}
                                                                className={`bg-apple-gray-light p-2 rounded-lg h-full transition-apple ${currentUser.role !== 'docente' ? 'cursor-pointer hover:bg-apple-gray' : 'cursor-default'}`}
                                                            >
                                                                <div className="font-semibold text-gray-700 flex items-center gap-1">
                                                                    <TagIcon className="h-4 w-4 text-gray-500" />
                                                                    {item.evento_descripcion}
                                                                </div>
                                                            </div>
                                                        ) : item.id_clase && englishGroup && englishGroup.length > 0 ? (
                                                            // Render consolidated English block
                                                            <div
                                                                draggable={currentUser.role !== 'docente'}
                                                                onDragStart={(e) => handleDragStart(e, item, 'event')}
                                                                className={`h-full ${currentUser.role !== 'docente' ? 'cursor-grab' : 'cursor-default'}`}
                                                            >
                                                                {(() => {
                                                                    const firstClase = clases.find(c => c.id_clase === englishGroup![0].id_clase);
                                                                    const skill = firstClase?.skill_rutina || 'Inglés';

                                                                    // Agrupar por nivel para mostrar como en el panel de asignaturas
                                                                    const niveles = ['Basic', 'Lower', 'Upper'];
                                                                    const nivelesInfo = niveles.map(nivel => {
                                                                        const assignment = englishLevelAssignments.find(a => a.nivel_ingles === nivel);
                                                                        return {
                                                                            nivel,
                                                                            docente: assignment?.docente,
                                                                            aula: assignment?.aula
                                                                        };
                                                                    }).filter(info => info.docente); // Solo mostrar niveles con docente asignado

                                                                    return (
                                                                        <div className="p-1.5 rounded-md h-full overflow-y-auto" style={{
                                                                            backgroundColor: subjectColors['Inglés'] || getSubjectColor('Inglés')
                                                                        }}>
                                                                            <div className="font-bold text-xs mb-1">{skill}</div>
                                                                            <div className="text-[10px] space-y-0.5">
                                                                                {nivelesInfo.map((info) => {
                                                                                    const docenteNombre = info.docente ?
                                                                                        `${info.docente.nombres.split(' ')[0]}` : 'N/A';
                                                                                    const aulaNombre = info.aula?.nombre || '';

                                                                                    return (
                                                                                        <div key={info.nivel} className="text-gray-700 border-b border-gray-300 pb-0.5 last:border-0">
                                                                                            <span className="font-semibold">{info.nivel}:</span>
                                                                                            <span className="text-gray-600"> {docenteNombre}</span>
                                                                                            {aulaNombre && <span className="text-gray-500"> - {aulaNombre}</span>}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : item.id_clase && (
                                                            // Render normal class (non-English or single English class)
                                                            <div
                                                                draggable={currentUser.role !== 'docente'}
                                                                onDragStart={(e) => handleDragStart(e, item, 'event')}
                                                                className={`h-full ${currentUser.role !== 'docente' ? 'cursor-grab' : 'cursor-default'}`}
                                                            >
                                                                {(clase => {
                                                                    const docente = docentes.find(d => d.id_docente === item.id_docente);
                                                                    // Priorizar aula del horario, si no tiene, usar la de la clase
                                                                    const aulaId = item.id_aula || clase?.id_aula;
                                                                    const aula = aulaId ? aulas.find(a => a.id_aula === aulaId) : undefined;

                                                                    return (
                                                                        <div className="p-1.5 rounded-md h-full overflow-y-auto" style={{ backgroundColor: subjectColors[clase?.nombre_materia || 'default'] || getSubjectColor(clase?.nombre_materia || '') }}>
                                                                            <div className="font-bold text-xs mb-0.5">{clase?.nombre_materia}</div>
                                                                            {docente && (
                                                                                <div className="text-gray-700 text-[10px] font-semibold">
                                                                                    {docente.nombres.split(' ')[0]} {docente.apellidos.split(' ')[0]}
                                                                                </div>
                                                                            )}
                                                                            {aula && (
                                                                                <div className="text-gray-600 text-[10px] mt-0.5">
                                                                                    📍 {aula.nombre}
                                                                                </div>
                                                                            )}
                                                                            {!aula && clase?.id_aula && (
                                                                                <div className="text-gray-500 text-[10px] mt-0.5 italic">
                                                                                    Sin aula asignada
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })(clases.find(c => c.id_clase === item.id_clase))}
                                                            </div>
                                                        )
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {(currentUser.role === 'coordinador' || currentUser.role === 'directivo') && (
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="font-bold text-lg mb-2">Asignaturas sin Horario</h3>
                        <div
                            className="space-y-2 min-h-[200px] p-2 rounded-md border-2 border-dashed border-gray-300 transition-all"
                            id="unassigned-classes-drop-zone"
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                                handleDropOutside();
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('bg-blue-50', 'border-blue-400');
                                e.currentTarget.classList.remove('border-gray-300');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                                e.currentTarget.classList.add('border-gray-300');
                            }}
                        >
                            {(() => {
                                // Agrupar clases de inglés consolidadas por skill para mostrar un solo bloque
                                const englishConsolidated = unassignedClasses.filter(c =>
                                    c.es_ingles_primaria &&
                                    c.nivel_ingles === null &&
                                    c.skill_rutina &&
                                    (selectedGrade === '5to Grado' || selectedGrade === '6to Grado')
                                );
                                const otherClasses = unassignedClasses.filter(c =>
                                    !(c.es_ingles_primaria && c.nivel_ingles === null && c.skill_rutina)
                                );

                                // Obtener skills únicos de clases consolidadas
                                const uniqueSkills = [...new Set(englishConsolidated.map(c => c.skill_rutina).filter(Boolean))];

                                return (
                                    <>
                                        {/* Mostrar un bloque por skill consolidado */}
                                        {uniqueSkills.map(skill => {
                                            const claseConsolidada = englishConsolidated.find(c => c.skill_rutina === skill);
                                            if (!claseConsolidada) return null;

                                            // Obtener todas las asignaciones de niveles activas (aplican a todos los skills)
                                            const assignmentsForSkill = englishLevelAssignments;

                                            return (
                                                <div
                                                    key={`consolidated-${skill}`}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, claseConsolidada, 'class')}
                                                    className="p-2 rounded-md cursor-grab hover:shadow-md transition-shadow"
                                                    style={{ backgroundColor: subjectColors['Inglés'] || getSubjectColor('Inglés') }}
                                                >
                                                    <div className="font-bold">{claseConsolidada.nombre_materia}</div>
                                                    {assignmentsForSkill.length > 0 && (
                                                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                                            {assignmentsForSkill.map(a => {
                                                                const docente = a.docente || docentes.find(d => d.id_docente === a.id_docente);
                                                                const aula = a.aula;
                                                                const docenteNombre = docente ? docente.nombres.split(' ')[0] : 'N/A';
                                                                const aulaNombre = aula?.nombre || '';
                                                                return (
                                                                    <div key={a.nivel_ingles}>
                                                                        <span className="font-semibold">{a.nivel_ingles}:</span>
                                                                        <span> {docenteNombre}</span>
                                                                        {aulaNombre && <span className="text-gray-500"> - {aulaNombre}</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Mostrar otras clases normalmente */}
                                        {otherClasses.map(clase => {
                                            const docente = docentes.find(d => d.id_docente === clase.id_docente_asignado);
                                            const aula = clase.id_aula ? aulas.find(a => a.id_aula === clase.id_aula) : undefined;

                                            return (
                                                <div key={clase.id_clase}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, clase, 'class')}
                                                    className="p-2 rounded-md cursor-grab hover:shadow-md transition-shadow"
                                                    style={{ backgroundColor: subjectColors[clase.nombre_materia] || getSubjectColor(clase.nombre_materia) }}
                                                >
                                                    <div className="font-bold">{clase.nombre_materia}</div>
                                                    {docente && (
                                                        <div className="text-xs text-gray-600 mt-0.5">
                                                            {docente.nombres.split(' ')[0]} {docente.apellidos.split(' ')[0]}
                                                        </div>
                                                    )}
                                                    {aula && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            📍 {aula.nombre}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                            {unassignedClasses.length === 0 && (
                                <div className="text-sm text-gray-500 p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
                                    <p className="mb-2">Todas las asignaturas están en el horario</p>
                                    <p className="text-xs">Arrastra aquí para remover del horario</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {isEventModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-bold mb-4">{eventData.id ? 'Editar Evento' : 'Añadir Evento'}</h2>
                        <InputField as="textarea" label="Descripción del Evento" name="event_desc" value={eventData.desc} onChange={e => setEventData(d => ({ ...d, desc: e.target.value }))} required />
                        <div className="flex justify-between items-center mt-6">
                            <div>
                                {eventData.id && <button onClick={handleDeleteEvent} className="px-6 py-3 bg-apple-red text-white rounded-lg font-medium transition-apple hover:opacity-90">Eliminar</button>}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setEventModalOpen(false)} className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg font-medium transition-apple hover:bg-apple-gray-light">Cancelar</button>
                                <button onClick={handleSaveEvent} className="px-6 py-3 bg-apple-blue text-white rounded-lg font-medium transition-apple hover:opacity-90">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TeamScheduleView: React.FC<{
    docentes: Docente[];
    schedules: WeeklySchedules;
    setSchedules: React.Dispatch<React.SetStateAction<WeeklySchedules>>;
    clases: Clase[];
    alumnos: Alumno[];
    aulas: Aula[];
}> = ({ docentes, schedules, setSchedules, clases, alumnos, aulas }) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [isGuardiaModalOpen, setGuardiaModalOpen] = useState(false);
    const [englishLevelAssignments, setEnglishLevelAssignments] = useState<Array<{
        id_docente: string,
        nivel_ingles: string
    }>>([]);

    type GuardiaData = { dia: number, hora: string, desc: string, grade: string, id: string | null };
    const [guardiaData, setGuardiaData] = useState<GuardiaData | null>(null);

    const allGrades = useMemo(() => Array.from(new Set(alumnos.map(a => a.salon))).sort(), [alumnos]);

    // Cargar asignaciones de niveles de inglés
    useEffect(() => {
        const loadEnglishAssignments = async () => {
            try {
                const anoEscolar = '2025-2026'; // TODO: Obtener del contexto

                const { data: docenteAssignments, error: docenteError } = await supabase
                    .from('asignacion_docente_nivel_ingles')
                    .select('id_docente, nivel_ingles')
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (docenteError) {
                    console.error('Error loading English assignments:', docenteError);
                    return;
                }

                setEnglishLevelAssignments(docenteAssignments || []);
            } catch (error) {
                console.error('Error loading English level assignments:', error);
            }
        };

        loadEnglishAssignments();
    }, []);

    const teacherPrimaryGrade = useMemo(() => {
        if (!selectedTeacherId) return allGrades[0] || '';
        const teacherClassesForGrade = clases.filter(c => c.id_docente_asignado === selectedTeacherId);
        return teacherClassesForGrade.length > 0 ? teacherClassesForGrade[0].grado_asignado : (allGrades[0] || '');
    }, [selectedTeacherId, clases, allGrades]);

    const teacherSchedule = useMemo(() => {
        if (!selectedTeacherId) return [];
        // Buscar en todas las semanas, no solo la semana 1
        const scheduleWithGrade: (Horario & { grade: string })[] = [];
        for (const grade in schedules) {
            for (const week in schedules[grade]) {
                const weekSchedule = schedules[grade][parseInt(week)] || [];
                for (const item of weekSchedule) {
                    const clase = item.id_clase ? clases.find(c => c.id_clase === item.id_clase) : null;

                    // Verificar si el docente está asignado directamente al horario
                    const isDirectlyAssigned = item.id_docente === selectedTeacherId;

                    // Verificar si el docente está asignado a la clase (MEJORADO: también si id_docente es null)
                    const isClassTeacher = clase?.id_docente_asignado === selectedTeacherId;

                    // Verificar si es una clase consolidada de inglés (SOLO 5to-6to) y el docente está asignado a algún nivel
                    let isEnglishLevelTeacher = false;
                    const isConsolidatedEnglish = clase?.es_ingles_primaria &&
                        clase?.nivel_ingles === null &&
                        clase?.skill_rutina &&
                        (clase?.grado_asignado === '5to Grado' || clase?.grado_asignado === '6to Grado');
                    if (isConsolidatedEnglish) {
                        // Es una clase consolidada de inglés (5to-6to), verificar asignaciones de nivel de inglés
                        isEnglishLevelTeacher = englishLevelAssignments.some(
                            assignment => assignment.id_docente === selectedTeacherId
                        );
                    }

                    // MEJORADO: También verificar si el horario tiene id_docente null pero debería tenerlo
                    const shouldHaveDocente = !item.id_docente && clase?.id_docente_asignado === selectedTeacherId;

                    // Incluir si el docente está asignado de alguna manera
                    if (isDirectlyAssigned || isClassTeacher || isEnglishLevelTeacher || shouldHaveDocente) {
                        // For classes, use the class's grade. For events (guardias), use the grade of the schedule it's in.
                        scheduleWithGrade.push({ ...item, grade: clase?.grado_asignado || grade });
                    }
                }
            }
        }
        // Eliminar duplicados basados en dia_semana, hora_inicio, id_clase
        const uniqueSchedule = scheduleWithGrade.filter((item, index, self) =>
            index === self.findIndex(t =>
                t.dia_semana === item.dia_semana &&
                t.hora_inicio === item.hora_inicio &&
                t.id_clase === item.id_clase &&
                t.id_horario === item.id_horario
            )
        );
        return uniqueSchedule;
    }, [selectedTeacherId, schedules, clases, englishLevelAssignments]);

    // Usar siempre los mismos time slots que ScheduleView (primaria: 07:30 - 15:30 con bloques de 45 minutos)
    const timeSlots = TIME_SLOTS_PRIMARIA;

    const handleOpenGuardiaModal = (dia: number, hora: string, existingEvent: (Horario & { grade: string }) | null = null) => {
        setGuardiaData({
            dia,
            hora,
            desc: existingEvent?.evento_descripcion || '',
            grade: existingEvent?.grade || teacherPrimaryGrade,
            id: existingEvent?.id_horario || null,
        });
        setGuardiaModalOpen(true);
    };

    const handleSaveGuardia = () => {
        if (!guardiaData || !guardiaData.desc || !selectedTeacherId) return;

        const [hora_inicio, hora_fin] = guardiaData.hora.split(' - ');
        let newSchedules = JSON.parse(JSON.stringify(schedules));
        const MASTER_WEEK = 1;

        if (guardiaData.id) {
            for (const grade in newSchedules) {
                if (newSchedules[grade][MASTER_WEEK]) {
                    newSchedules[grade][MASTER_WEEK] = newSchedules[grade][MASTER_WEEK].filter((item: Horario) => item.id_horario !== guardiaData.id);
                }
            }
        }

        const effectiveGrade = teacherPrimaryGrade;

        const newGuardia: Horario = {
            id_horario: guardiaData.id || `evt-${Date.now()}`,
            id_docente: selectedTeacherId,
            id_clase: null,
            dia_semana: guardiaData.dia,
            hora_inicio,
            hora_fin,
            evento_descripcion: guardiaData.desc,
        };

        if (!newSchedules[effectiveGrade]) newSchedules[effectiveGrade] = {};
        if (!newSchedules[effectiveGrade][MASTER_WEEK]) newSchedules[effectiveGrade][MASTER_WEEK] = [];

        newSchedules[effectiveGrade][MASTER_WEEK].push(newGuardia);

        setSchedules(newSchedules);
        setGuardiaModalOpen(false);
        setGuardiaData(null);
    };

    const handleDeleteGuardia = () => {
        if (!guardiaData || !guardiaData.id) return;
        let newSchedules = JSON.parse(JSON.stringify(schedules));
        const MASTER_WEEK = 1;

        for (const grade in newSchedules) {
            if (newSchedules[grade][MASTER_WEEK]) {
                newSchedules[grade][MASTER_WEEK] = newSchedules[grade][MASTER_WEEK].filter((item: Horario) => item.id_horario !== guardiaData.id);
            }
        }

        setSchedules(newSchedules);
        setGuardiaModalOpen(false);
        setGuardiaData(null);
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Horario por Docente</h2>
                <div className="flex items-center gap-4">
                    <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="p-2 border rounded-md min-w-[200px]">
                        <option value="">Seleccione un docente</option>
                        {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
                    </select>
                </div>
            </div>

            {selectedTeacherId ? (
                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200 border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Hora</th>
                                {WEEK_DAYS.map(d => <th key={d} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {timeSlots.map(slot => (
                                <tr key={slot}>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">{slot}</td>
                                    {WEEK_DAYS.map((_, dayIndex) => {
                                        const day = dayIndex + 1;
                                        const slotStartTime = slot.split(' - ')[0];
                                        // Normalizar formato de hora para comparación (HH:MM)
                                        const normalizeTime = (time: string) => {
                                            if (!time) return '';
                                            const parts = time.split(':');
                                            if (parts.length >= 2) {
                                                return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                                            }
                                            return time;
                                        };
                                        const normalizedSlotTime = normalizeTime(slotStartTime);
                                        const item = teacherSchedule.find(s =>
                                            s.dia_semana === day &&
                                            normalizeTime(s.hora_inicio) === normalizedSlotTime
                                        );
                                        return (
                                            <td key={`${day}-${slot}`} className="border p-1 align-top text-xs relative h-24"
                                                onDoubleClick={() => !item && handleOpenGuardiaModal(day, slot)}>
                                                {item && (item.evento_descripcion ? (
                                                    <div onClick={() => handleOpenGuardiaModal(day, slot, item)} className="bg-apple-gray-light p-2 rounded-lg h-full cursor-pointer hover:bg-apple-gray transition-apple">
                                                        <div className="font-semibold text-apple-gray-dark flex items-center gap-1">
                                                            <TagIcon className="h-4 w-4 text-apple-gray" />
                                                            {item.evento_descripcion}
                                                        </div>
                                                        <div className="text-gray-500 text-[10px] mt-1">({item.grade})</div>
                                                    </div>
                                                ) : item.id_clase && (
                                                    (clase => {
                                                        if (!clase) return null;
                                                        const docente = docentes.find(d => d.id_docente === item.id_docente);
                                                        const aulaId = item.id_aula || clase.id_aula;
                                                        const aula = aulaId ? aulas?.find(a => a.id_aula === aulaId) : undefined;
                                                        return (
                                                            <div className="p-1.5 rounded-md h-full overflow-y-auto" style={{ backgroundColor: subjectColors[clase.nombre_materia] || getSubjectColor(clase.nombre_materia) }}>
                                                                <div className="font-bold text-xs mb-0.5">{clase.nombre_materia}</div>
                                                                <div className="text-gray-600 text-[10px]">{clase.grado_asignado}</div>
                                                                {docente && (
                                                                    <div className="text-gray-700 text-[10px] mt-0.5 font-semibold">
                                                                        {docente.nombres.split(' ')[0]} {docente.apellidos.split(' ')[0]}
                                                                    </div>
                                                                )}
                                                                {aula && (
                                                                    <div className="text-gray-600 text-[10px] mt-0.5">
                                                                        📍 {aula.nombre}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })(clases.find(c => c.id_clase === item.id_clase))
                                                ))}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>Por favor, seleccione un docente para ver su horario.</p>
                </div>
            )}

            {isGuardiaModalOpen && guardiaData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{guardiaData.id ? 'Editar Guardia/Evento' : 'Añadir Guardia/Evento'}</h2>
                        <div className="space-y-4">
                            <InputField as="textarea" label="Descripción" name="desc" value={guardiaData.desc} onChange={e => setGuardiaData({ ...guardiaData, desc: e.target.value })} required />
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <div>
                                {guardiaData.id && <button onClick={handleDeleteGuardia} className="px-6 py-3 bg-apple-red text-white rounded-lg font-medium transition-apple hover:opacity-90">Eliminar</button>}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setGuardiaModalOpen(false)} className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg font-medium transition-apple hover:bg-apple-gray-light">Cancelar</button>
                                <button onClick={handleSaveGuardia} className="px-6 py-3 bg-apple-blue text-white rounded-lg font-medium transition-apple hover:opacity-90">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// SCHEDULE GENERATOR VIEW COMPONENT
// ============================================

const ScheduleGeneratorView: React.FC<{
    currentUser: Usuario;
}> = ({ currentUser }) => {
    const [anoEscolar, setAnoEscolar] = useState('2025-2026');
    const [semana, setSemana] = useState<number>(1);
    const [grado, setGrado] = useState<string>('');
    const [configuracion, setConfiguracion] = useState<ConfiguracionHorario | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generacionActual, setGeneracionActual] = useState<GeneracionHorario | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load configuration
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await configuracionHorariosService.getActive(anoEscolar);
                setConfiguracion(config);
                if (!config) {
                    setError(`No hay configuración activa para ${anoEscolar}. Ejecuta el script SQL 010_seed_initial_data.sql o crea una configuración manualmente.`);
                } else {
                    setError(null);
                }
            } catch (err: any) {
                console.error('Error loading configuration:', err);
                setError(`Error al cargar configuración: ${err.message}`);
            }
        };
        loadConfig();
    }, [anoEscolar]);

    const handleGenerate = async () => {
        if (!configuracion) {
            setError('No hay configuración de horarios para el año seleccionado');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setSuccess(null);

        try {
            // Get Supabase URL and anon key from environment
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Configuración de Supabase no encontrada');
            }

            // Call Edge Function
            const response = await fetch(`${supabaseUrl}/functions/v1/schedule-optimizer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                    ano_escolar: anoEscolar,
                    semana: semana,
                    grado: grado || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al generar horarios');
            }

            // Load the generation record
            if (data.generacion_id) {
                // Poll for updates
                const pollGeneration = async () => {
                    const maxAttempts = 30; // 30 seconds max
                    let attempts = 0;

                    const interval = setInterval(async () => {
                        attempts++;
                        const generacion = await generacionesHorariosService.getById(data.generacion_id);

                        if (generacion) {
                            setGeneracionActual(generacion);

                            if (generacion.estado === 'completado' || generacion.estado === 'fallido' || generacion.estado === 'aplicado') {
                                clearInterval(interval);
                                if (generacion.estado === 'completado') {
                                    setSuccess(data.mensaje || 'Horarios generados exitosamente');
                                } else if (generacion.estado === 'fallido') {
                                    setError('La generación falló. Revisa los errores.');
                                }
                            }
                        }

                        if (attempts >= maxAttempts) {
                            clearInterval(interval);
                            setError('Tiempo de espera agotado. La generación puede estar aún en proceso.');
                        }
                    }, 1000); // Poll every second
                };

                pollGeneration();
            }

            setSuccess('Generación iniciada. Esperando resultados...');
        } catch (err: any) {
            console.error('Error generating schedule:', err);
            setError(err.message || 'Error al generar horarios');
        } finally {
            setIsGenerating(false);
        }
    };

    const GRADOS = ['Preescolar', '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado',
        '6to Grado', '1er Año', '2do Año', '3er Año', '4to Año', '5to Año'];

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-8">
                    <MagicWandIcon className="h-8 w-8 text-apple-blue opacity-60" />
                    <div>
                        <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Generador de Horarios</h2>
                        <p className="text-apple-gray font-light">Genera horarios automáticamente usando optimización matemática</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800 text-sm">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Año Escolar
                        </label>
                        <select
                            value={anoEscolar}
                            onChange={(e) => setAnoEscolar(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent text-base"
                        >
                            {ANOS_ESCOLARES.map(ano => (
                                <option key={ano} value={ano}>{ano}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semana
                        </label>
                        <select
                            value={semana}
                            onChange={(e) => setSemana(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent text-base"
                        >
                            {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Semana {w}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grado (Opcional)
                        </label>
                        <select
                            value={grado}
                            onChange={(e) => setGrado(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent text-base"
                        >
                            <option value="">Todos los Grados</option>
                            {GRADOS.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {configuracion ? (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">Configuración Actual</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Bloques:</strong> {configuracion.bloques_horarios.length} bloques configurados</p>
                            <p><strong>Días:</strong> {configuracion.dias_semana.join(', ')}</p>
                            <p><strong>Semanas totales:</strong> {configuracion.semanas_totales}</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Configuración Requerida</h3>
                        <div className="text-sm text-yellow-700 space-y-2">
                            <p>No hay una configuración de horarios activa para el año escolar <strong>{anoEscolar}</strong>.</p>
                            <p>Para generar horarios, necesitas:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>Crear una configuración de horarios en la base de datos</li>
                                <li>Definir los bloques horarios (horas de inicio y fin)</li>
                                <li>Marcar la configuración como activa</li>
                            </ul>
                            <p className="mt-2 text-xs">
                                <strong>Nota:</strong> Puedes crear la configuración ejecutando el script SQL <code className="bg-yellow-100 px-1 rounded">010_seed_initial_data.sql</code> en Supabase, o crearla manualmente.
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !configuracion}
                    className={`w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-medium min-h-[44px]`}
                    title={!configuracion ? 'Primero debes crear una configuración de horarios para el año escolar seleccionado' : ''}
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generando...
                        </>
                    ) : (
                        <>
                            <MagicWandIcon className="h-5 w-5" />
                            Generar Horarios
                        </>
                    )}
                </button>

                {generacionActual && (
                    <div className="mt-6 space-y-4">
                        <div className={`p-4 border rounded-lg ${generacionActual.estado === 'completado'
                            ? 'bg-green-50 border-green-200'
                            : generacionActual.estado === 'fallido'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}>
                            <h3 className="font-semibold mb-2 text-lg">
                                {generacionActual.estado === 'completado' ? '✅ Generación Completada' :
                                    generacionActual.estado === 'fallido' ? '❌ Generación Fallida' :
                                        '⏳ Generando...'}
                            </h3>
                            <div className="text-sm space-y-2">
                                {generacionActual.estadisticas && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-700">Asignaciones</p>
                                            <p className="text-2xl font-bold">{generacionActual.estadisticas.total_asignaciones || 0}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Docentes</p>
                                            <p className="text-2xl font-bold">{generacionActual.estadisticas.docentes_asignados || 0}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Aulas</p>
                                            <p className="text-2xl font-bold">{generacionActual.estadisticas.aulas_utilizadas || 0}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Tiempo</p>
                                            <p className="text-lg font-bold">{generacionActual.tiempo_ejecucion_ms || 0}ms</p>
                                        </div>
                                    </div>
                                )}
                                {generacionActual.estadisticas?.conflictos && generacionActual.estadisticas.conflictos.length > 0 && (
                                    <div className="mt-4">
                                        <strong className="text-red-800">Conflictos encontrados:</strong>
                                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                            {generacionActual.estadisticas.conflictos.map((conflicto: string, i: number) => (
                                                <li key={i} className="text-red-700">{conflicto}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {generacionActual.errores && generacionActual.errores.length > 0 && (
                                    <div className="mt-4">
                                        <strong className="text-red-800">Errores:</strong>
                                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                            {generacionActual.errores.map((err: string, i: number) => (
                                                <li key={i} className="text-red-700">{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {generacionActual.estado === 'completado' && generacionActual.resultado && Array.isArray(generacionActual.resultado) && generacionActual.resultado.length > 0 && (
                                    <div className="mt-4">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    // Apply generated schedules to database
                                                    const horarios = generacionActual.resultado
                                                    if (!horarios || !Array.isArray(horarios)) return

                                                    // Delete existing schedules for this week and grade
                                                    const grado = horarios[0]?.grado
                                                    if (grado) {
                                                        const { error: deleteError } = await supabase
                                                            .from('horarios')
                                                            .delete()
                                                            .eq('grado', grado)
                                                            .eq('semana', semana)

                                                        if (deleteError) throw deleteError
                                                    }

                                                    // Insert new schedules
                                                    const horariosToInsert = horarios.map((h: any) => ({
                                                        id_docente: h.id_docente,
                                                        id_clase: h.id_clase,
                                                        id_aula: h.id_aula,
                                                        grado: h.grado,
                                                        semana: h.semana,
                                                        dia_semana: h.dia_semana,
                                                        hora_inicio: h.hora_inicio,
                                                        hora_fin: h.hora_fin
                                                    }))

                                                    const { error: insertError } = await supabase
                                                        .from('horarios')
                                                        .insert(horariosToInsert)

                                                    if (insertError) throw insertError

                                                    // Update generation status
                                                    await generacionesHorariosService.update(generacionActual.id, {
                                                        estado: 'aplicado'
                                                    })

                                                    setSuccess(`✅ ${horarios.length} horarios aplicados exitosamente`)
                                                    setGeneracionActual({ ...generacionActual, estado: 'aplicado' })
                                                } catch (err: any) {
                                                    setError('Error al aplicar horarios: ' + err.message)
                                                }
                                            }}
                                            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            Aplicar Horarios Generados
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-semibold text-apple-gray-dark mb-6 tracking-tight">Información</h3>
                <div className="space-y-4 text-sm text-apple-gray font-light">
                    <p>
                        <strong>¿Qué hace el Generador de Horarios?</strong><br />
                        Utiliza algoritmos de optimización matemática para generar horarios que respetan todas las restricciones
                        (docentes, aulas, grados) y maximizan las preferencias configuradas.
                    </p>
                    <p>
                        <strong>Estado actual:</strong><br />
                        El solver básico está implementado y funcional. Genera horarios respetando todas las restricciones duras
                        (docentes, aulas, grados) y optimiza las preferencias configuradas. Puedes generar horarios ahora mismo.
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- NEW EVALUATION VIEW COMPONENT ---

// ============================================
// CALENDAR VIEW COMPONENT
// ============================================

// Helper functions for Caracas timezone (GMT-4 / America/Caracas)
// Caracas is UTC-4 (VET - Venezuela Time)

const toCaracasISOString = (dateString: string): string => {
    // dateString is in format "YYYY-MM-DDTHH:mm" from datetime-local input
    // We treat it as Caracas local time (UTC-4) and convert to UTC for storage
    // Parse the date string manually to avoid timezone interpretation issues
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Caracas is UTC-4, so to convert Caracas time to UTC, we add 4 hours
    // Create UTC date directly with the adjusted time
    const utcHours = hours + 4; // Add 4 hours for UTC conversion
    const utcDate = new Date(Date.UTC(year, month - 1, day, utcHours, minutes, 0));
    return utcDate.toISOString();
};

const fromCaracasISOString = (isoString: string): Date => {
    // Convert UTC ISO string from database to Caracas local time
    const utcDate = new Date(isoString);
    // Subtract 4 hours (Caracas offset) to get Caracas local time
    const caracasDate = new Date(utcDate.getTime() - (4 * 60 * 60 * 1000));
    return caracasDate;
};

const formatDateForInput = (date: Date): string => {
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    // This assumes the date is already in Caracas timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getCaracasDateString = (date: Date): string => {
    // Get date string in Caracas timezone for comparison
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' }); // YYYY-MM-DD format
};

type CalendarViewType = 'month' | 'week' | 'day' | 'list';

const CalendarView: React.FC<{
    currentUser: Usuario;
}> = ({ currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    // Initialize with 'list' view on mobile, 'month' on desktop
    const [viewType, setViewType] = useState<CalendarViewType>(() => {
        // Check if window is available (SSR safety) and if it's mobile
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return 'list';
        }
        return 'month';
    });
    const [eventos, setEventos] = useState<EventoCalendario[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventoCalendario | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Filtros
    const [filtrosTipo, setFiltrosTipo] = useState<{ [key: string]: boolean }>({
        'Actividades Generales': true,
        'Actos Cívicos': true,
        'Entregas Administrativas': true,
        'Reuniones de Etapa': true,
    });
    const [filtrosNivel, setFiltrosNivel] = useState<{ [key: string]: boolean }>({
        'Preescolar': true,
        'Primaria': true,
        'Bachillerato': true,
    });

    // Colores para cada tipo de evento
    const coloresEventos: { [key: string]: string } = {
        'Actividades Generales': '#3B82F6', // Azul
        'Actos Cívicos': '#EF4444', // Rojo
        'Entregas Administrativas': '#10B981', // Verde
        'Reuniones de Etapa': '#F59E0B', // Amarillo/Naranja
    };

    // Cargar eventos
    const loadEventos = useCallback(async () => {
        setIsLoading(true);
        try {
            let startDateCaracas: Date;
            let endDateCaracas: Date;

            if (viewType === 'month') {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                startDateCaracas = new Date(`${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`);
                endDateCaracas = new Date(year, month + 1, 0, 23, 59, 59);
            } else if (viewType === 'week') {
                // Get start of week (Monday)
                const startOfWeek = new Date(currentDate);
                const day = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                startOfWeek.setDate(diff);
                startOfWeek.setHours(0, 0, 0, 0);
                startDateCaracas = startOfWeek;

                // Get end of week (Sunday)
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                endDateCaracas = endOfWeek;
            } else if (viewType === 'day') {
                startDateCaracas = new Date(currentDate);
                startDateCaracas.setHours(0, 0, 0, 0);
                endDateCaracas = new Date(currentDate);
                endDateCaracas.setHours(23, 59, 59, 999);
            } else { // list view - show current week
                const startOfWeek = new Date(currentDate);
                const day = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
                startOfWeek.setDate(diff);
                startOfWeek.setHours(0, 0, 0, 0);
                startDateCaracas = startOfWeek;

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                endDateCaracas = endOfWeek;
            }

            // Convert Caracas dates to UTC for database query
            const startDateUTC = new Date(startDateCaracas.getTime() + (4 * 60 * 60 * 1000));
            const endDateUTC = new Date(endDateCaracas.getTime() + (4 * 60 * 60 * 1000));

            const startDate = startDateUTC.toISOString();
            const endDate = endDateUTC.toISOString();

            const eventosData = await eventosCalendarioService.getByDateRange(startDate, endDate);
            setEventos(eventosData);
        } catch (error: any) {
            console.error('Error loading eventos:', error);
            alert('Error al cargar eventos: ' + (error.message || 'Error desconocido'));
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, viewType]);

    // Cargar eventos cuando cambia la fecha o la vista
    useEffect(() => {
        loadEventos();
    }, [loadEventos]);

    // Navegación del calendario
    const goToPrevious = () => {
        const newDate = new Date(currentDate);
        if (viewType === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else if (viewType === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else if (viewType === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        } else { // list
            newDate.setDate(newDate.getDate() - 7);
        }
        setCurrentDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(currentDate);
        if (viewType === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else if (viewType === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else if (viewType === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        } else { // list
            newDate.setDate(newDate.getDate() + 7);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Formatear fecha
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long'
        });
    };

    // Formatear fecha según la vista
    const formatDateForView = (): string => {
        if (viewType === 'month') {
            return formatDate(currentDate);
        } else if (viewType === 'week') {
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (viewType === 'day') {
            return currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else { // list
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            return `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
        }
    };

    // Obtener días del mes
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
        // But our calendar starts with Monday, so we need to convert:
        // Sunday (0) -> 6, Monday (1) -> 0, Tuesday (2) -> 1, etc.
        const startingDayOfWeek = firstDay.getDay();
        const offset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Convert to Monday-based week

        const days: (Date | null)[] = [];

        // Días del mes anterior para completar la primera semana (empezando en lunes)
        for (let i = 0; i < offset; i++) {
            days.push(null);
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        // Días del mes siguiente para completar la última semana
        const remainingDays = 42 - days.length; // 6 semanas * 7 días
        for (let day = 1; day <= remainingDays; day++) {
            days.push(null);
        }

        return days;
    };

    // Abrir modal para crear/editar evento
    const handleOpenModal = (date?: Date, evento?: EventoCalendario) => {
        // Docentes no pueden crear ni editar eventos
        if (currentUser.role === 'docente') return;

        if (evento) {
            setSelectedEvent(evento);
            setSelectedDate(null);
        } else {
            setSelectedEvent(null);
            setSelectedDate(date || null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedDate(null);
    };

    // Guardar evento
    const handleSaveEvent = async (eventoData: Omit<EventoCalendario, 'id_evento' | 'created_at' | 'updated_at'>) => {
        // Docentes no pueden guardar eventos
        if (currentUser.role === 'docente') return;

        try {
            // eventoData.fecha_inicio and fecha_fin are ISO strings from the form
            // They represent dates in Caracas timezone, so we need to convert to UTC
            const fechaInicioUTC = toCaracasISOString(eventoData.fecha_inicio);
            const fechaFinUTC = toCaracasISOString(eventoData.fecha_fin);

            const eventoToSave = {
                ...eventoData,
                fecha_inicio: fechaInicioUTC,
                fecha_fin: fechaFinUTC,
            };

            if (selectedEvent) {
                // Actualizar evento existente
                await eventosCalendarioService.update(selectedEvent.id_evento, eventoToSave);
            } else {
                // Crear nuevo evento
                await eventosCalendarioService.create({
                    ...eventoToSave,
                    creado_por: currentUser.id,
                });
            }
            await loadEventos();
            handleCloseModal();
        } catch (error: any) {
            console.error('Error saving evento:', error);
            alert('Error al guardar evento: ' + (error.message || 'Error desconocido'));
        }
    };

    // Eliminar evento
    const handleDeleteEvent = async () => {
        // Docentes no pueden eliminar eventos
        if (currentUser.role === 'docente') return;
        if (!selectedEvent) return;
        if (!window.confirm('¿Está seguro de que desea eliminar este evento?')) return;

        try {
            await eventosCalendarioService.delete(selectedEvent.id_evento);
            await loadEventos();
            handleCloseModal();
        } catch (error: any) {
            console.error('Error deleting evento:', error);
            alert('Error al eliminar evento: ' + (error.message || 'Error desconocido'));
        }
    };

    // Obtener eventos filtrados
    const getFilteredEventos = (): EventoCalendario[] => {
        return eventos.filter(evento => {
            if (!filtrosTipo[evento.tipo_evento]) return false;
            if (!evento.nivel_educativo.some(nivel => filtrosNivel[nivel])) return false;
            return true;
        });
    };

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const weekDaysFull = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const today = new Date();
    const isToday = (date: Date | null): boolean => {
        if (!date) return false;
        return date.toDateString() === today.toDateString();
    };

    // Obtener días de la semana
    const getWeekDays = (): Date[] => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }
        return days;
    };

    // Obtener eventos para una fecha específica (con filtros aplicados)
    const getEventosForDate = (date: Date): EventoCalendario[] => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return getFilteredEventos().filter(evento => {
            const eventoInicio = fromCaracasISOString(evento.fecha_inicio);
            const eventoFin = fromCaracasISOString(evento.fecha_fin);

            const eventoInicioStr = `${eventoInicio.getFullYear()}-${String(eventoInicio.getMonth() + 1).padStart(2, '0')}-${String(eventoInicio.getDate()).padStart(2, '0')}`;
            const eventoFinStr = `${eventoFin.getFullYear()}-${String(eventoFin.getMonth() + 1).padStart(2, '0')}-${String(eventoFin.getDate()).padStart(2, '0')}`;

            return dateStr >= eventoInicioStr && dateStr <= eventoFinStr;
        });
    };

    // Renderizar vista de mes
    const renderMonthView = () => {
        const days = getDaysInMonth();
        return (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-100 border-b">
                    {weekDays.map(day => (
                        <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={index} className="min-h-[100px] border-r border-b bg-gray-50" />;
                        }
                        const eventosDelDia = getEventosForDate(date);
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                        return (
                            <div
                                key={index}
                                className={`min-h-[100px] border-r border-b p-2 ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                                    } ${isToday(date) ? 'bg-blue-50' : ''} ${currentUser.role !== 'docente' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                                onClick={() => {
                                    if (currentUser.role !== 'docente' && date) {
                                        handleOpenModal(date);
                                    }
                                }}
                            >
                                {date && (
                                    <>
                                        <div className={`text-sm font-medium mb-1 ${isToday(date)
                                            ? 'text-blue-600 font-bold'
                                            : isCurrentMonth
                                                ? 'text-gray-900'
                                                : 'text-gray-400'
                                            }`}>
                                            {date.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {eventosDelDia.slice(0, 3).map(evento => (
                                                <div
                                                    key={evento.id_evento}
                                                    onClick={(e) => {
                                                        if (currentUser.role !== 'docente') {
                                                            e.stopPropagation();
                                                            handleOpenModal(date, evento);
                                                        }
                                                    }}
                                                    className={`text-xs p-1 rounded text-white truncate ${currentUser.role !== 'docente' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                                    style={{ backgroundColor: evento.color || coloresEventos[evento.tipo_evento] }}
                                                    title={evento.titulo}
                                                >
                                                    {evento.todo_dia ? evento.titulo : (() => {
                                                        const fechaCaracas = fromCaracasISOString(evento.fecha_inicio);
                                                        const hora = String(fechaCaracas.getHours()).padStart(2, '0');
                                                        const minutos = String(fechaCaracas.getMinutes()).padStart(2, '0');
                                                        return `${hora}:${minutos} ${evento.titulo}`;
                                                    })()}
                                                </div>
                                            ))}
                                            {eventosDelDia.length > 3 && (
                                                <div className="text-xs text-gray-500 font-medium">
                                                    +{eventosDelDia.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Renderizar vista de semana
    const renderWeekView = () => {
        const weekDaysList = getWeekDays();
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 bg-gray-100 border-b">
                    <div className="p-3 text-center text-sm font-semibold text-gray-700 border-r"></div>
                    {weekDaysList.map((date, idx) => (
                        <div key={idx} className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0">
                            <div>{weekDays[idx]}</div>
                            <div className={`text-lg ${isToday(date) ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="overflow-y-auto max-h-[600px]">
                    {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b">
                            <div className="p-2 text-xs text-gray-500 border-r text-right pr-2">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            {weekDaysList.map((date, dayIdx) => {
                                const eventosDelDia = getEventosForDate(date);
                                const eventosEnHora = eventosDelDia.filter(evento => {
                                    if (evento.todo_dia) return false;
                                    const fechaCaracas = fromCaracasISOString(evento.fecha_inicio);
                                    return fechaCaracas.getHours() === hour;
                                });

                                return (
                                    <div
                                        key={dayIdx}
                                        className={`min-h-[60px] border-r p-1 ${currentUser.role !== 'docente' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                                        onClick={() => {
                                            if (currentUser.role !== 'docente') {
                                                const newDate = new Date(date);
                                                newDate.setHours(hour, 0, 0, 0);
                                                handleOpenModal(newDate);
                                            }
                                        }}
                                    >
                                        {eventosEnHora.map(evento => (
                                            <div
                                                key={evento.id_evento}
                                                onClick={(e) => {
                                                    if (currentUser.role !== 'docente') {
                                                        e.stopPropagation();
                                                        handleOpenModal(date, evento);
                                                    }
                                                }}
                                                className={`text-xs p-1 rounded text-white mb-1 ${currentUser.role !== 'docente' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                                style={{ backgroundColor: evento.color || coloresEventos[evento.tipo_evento] }}
                                                title={evento.titulo}
                                            >
                                                {evento.titulo}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Renderizar vista de día
    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const eventosDelDia = getEventosForDate(currentDate);
        const eventosTodoElDia = eventosDelDia.filter(e => e.todo_dia);

        return (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 border-b p-4">
                    <div className="text-lg font-semibold text-gray-800">
                        {weekDaysFull[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]}, {currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                <div className="overflow-y-auto max-h-[600px]">
                    {eventosTodoElDia.length > 0 && (
                        <div className="border-b p-4 bg-gray-50">
                            <div className="text-sm font-semibold text-gray-700 mb-2">Todo el día</div>
                            <div className="space-y-2">
                                {eventosTodoElDia.map(evento => (
                                    <div
                                        key={evento.id_evento}
                                        onClick={() => {
                                            if (currentUser.role !== 'docente') {
                                                handleOpenModal(currentDate, evento);
                                            }
                                        }}
                                        className={`p-2 rounded text-white ${currentUser.role !== 'docente' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                        style={{ backgroundColor: evento.color || coloresEventos[evento.tipo_evento] }}
                                    >
                                        {evento.titulo}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {hours.map(hour => {
                        const eventosEnHora = eventosDelDia.filter(evento => {
                            if (evento.todo_dia) return false;
                            const fechaCaracas = fromCaracasISOString(evento.fecha_inicio);
                            return fechaCaracas.getHours() === hour;
                        });

                        return (
                            <div key={hour} className="grid grid-cols-12 border-b">
                                <div className="col-span-2 p-3 text-sm text-gray-500 border-r text-right pr-4">
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                                <div
                                    className={`col-span-10 min-h-[80px] p-2 ${currentUser.role !== 'docente' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                                    onClick={() => {
                                        if (currentUser.role !== 'docente') {
                                            const newDate = new Date(currentDate);
                                            newDate.setHours(hour, 0, 0, 0);
                                            handleOpenModal(newDate);
                                        }
                                    }}
                                >
                                    {eventosEnHora.map(evento => {
                                        const fechaInicio = fromCaracasISOString(evento.fecha_inicio);
                                        const fechaFin = fromCaracasISOString(evento.fecha_fin);
                                        const horaInicio = `${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}`;
                                        const horaFin = `${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}`;

                                        return (
                                            <div
                                                key={evento.id_evento}
                                                onClick={(e) => {
                                                    if (currentUser.role !== 'docente') {
                                                        e.stopPropagation();
                                                        handleOpenModal(currentDate, evento);
                                                    }
                                                }}
                                                className={`p-2 rounded text-white mb-2 ${currentUser.role !== 'docente' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                                style={{ backgroundColor: evento.color || coloresEventos[evento.tipo_evento] }}
                                            >
                                                <div className="font-semibold">{evento.titulo}</div>
                                                <div className="text-xs opacity-90">{horaInicio} - {horaFin}</div>
                                                {evento.descripcion && (
                                                    <div className="text-xs opacity-75 mt-1">{evento.descripcion}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Renderizar vista de lista
    const renderListView = () => {
        const weekDaysList = getWeekDays();
        const filteredEventos = getFilteredEventos();

        // Agrupar eventos por día
        const eventosPorDia = weekDaysList.map(date => ({
            date,
            eventos: filteredEventos.filter(evento => {
                const eventoInicio = fromCaracasISOString(evento.fecha_inicio);
                const eventoFin = fromCaracasISOString(evento.fecha_fin);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const eventoInicioStr = `${eventoInicio.getFullYear()}-${String(eventoInicio.getMonth() + 1).padStart(2, '0')}-${String(eventoInicio.getDate()).padStart(2, '0')}`;
                const eventoFinStr = `${eventoFin.getFullYear()}-${String(eventoFin.getMonth() + 1).padStart(2, '0')}-${String(eventoFin.getDate()).padStart(2, '0')}`;
                return dateStr >= eventoInicioStr && dateStr <= eventoFinStr;
            }).sort((a, b) => {
                if (a.todo_dia && !b.todo_dia) return -1;
                if (!a.todo_dia && b.todo_dia) return 1;
                if (a.todo_dia && b.todo_dia) return 0;
                const fechaA = fromCaracasISOString(a.fecha_inicio);
                const fechaB = fromCaracasISOString(b.fecha_inicio);
                return fechaA.getTime() - fechaB.getTime();
            })
        })).filter(day => day.eventos.length > 0);

        if (eventosPorDia.length === 0) {
            return (
                <div className="border border-gray-200 rounded-lg p-12 text-center text-gray-500">
                    <p className="text-lg">No hay eventos en esta semana</p>
                </div>
            );
        }

        return (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {eventosPorDia.map(({ date, eventos }, idx) => (
                    <div key={idx} className="border-b last:border-b-0">
                        <div className="p-4 bg-gray-50 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-gray-800">
                                        {weekDaysFull[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {eventos.map(evento => {
                                const fechaInicio = fromCaracasISOString(evento.fecha_inicio);
                                const fechaFin = fromCaracasISOString(evento.fecha_fin);

                                return (
                                    <div
                                        key={evento.id_evento}
                                        onClick={() => {
                                            if (currentUser.role !== 'docente') {
                                                handleOpenModal(date, evento);
                                            }
                                        }}
                                        className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${currentUser.role !== 'docente' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                                        style={{ borderLeftColor: evento.color || coloresEventos[evento.tipo_evento] }}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: evento.color || coloresEventos[evento.tipo_evento] }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {evento.todo_dia ? (
                                                    <span className="text-xs font-medium text-gray-600">Todo el día</span>
                                                ) : (
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {`${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}`}
                                                        {fechaInicio.getTime() !== fechaFin.getTime() && (
                                                            <> - {`${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}`}</>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-semibold text-gray-900">{evento.titulo}</div>
                                            {evento.descripcion && (
                                                <div className="text-sm text-gray-600 mt-1">{evento.descripcion}</div>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span
                                                    className="text-xs px-2 py-1 rounded"
                                                    style={{
                                                        backgroundColor: (evento.color || coloresEventos[evento.tipo_evento]) + '20',
                                                        color: evento.color || coloresEventos[evento.tipo_evento]
                                                    }}
                                                >
                                                    {evento.tipo_evento}
                                                </span>
                                                {evento.nivel_educativo.length > 0 && (
                                                    <span className="text-xs text-gray-500">
                                                        {evento.nivel_educativo.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="mb-8">
            {/* Header con navegación */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={goToPrevious}
                        className="p-2 hover:bg-gray-100 rounded-md"
                    >
                        <ArrowLeftIcon />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {formatDateForView()}
                    </h2>
                    <button
                        onClick={goToNext}
                        className="p-2 hover:bg-gray-100 rounded-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToToday}
                        className="ml-4 px-4 py-2 border border-apple-gray text-apple-gray-dark hover:bg-apple-gray-light rounded-lg text-sm font-medium transition-apple"
                    >
                        Hoy
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {/* Selector de vista */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                        <button
                            onClick={() => setViewType('month')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${viewType === 'month'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setViewType('week')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${viewType === 'week'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setViewType('day')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${viewType === 'day'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Día
                        </button>
                        <button
                            onClick={() => setViewType('list')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${viewType === 'list'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Lista
                        </button>
                    </div>
                    {(currentUser.role === 'directivo' || currentUser.role === 'coordinador') && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90"
                        >
                            <PlusIcon />
                            Nuevo Evento
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
                {/* Filtros por tipo de evento */}
                <div>
                    <h3 className="font-semibold text-gray-800 mb-4 text-base">Ver Calendarios:</h3>
                    <div className="space-y-2.5">
                        {Object.keys(filtrosTipo).map(tipo => {
                            const isActive = filtrosTipo[tipo];
                            const color = coloresEventos[tipo];
                            return (
                                <button
                                    key={tipo}
                                    type="button"
                                    onClick={() => setFiltrosTipo(prev => ({ ...prev, [tipo]: !prev[tipo] }))}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth hover-scale ${isActive
                                        ? 'bg-opacity-10 border-2 shadow-sm'
                                        : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                                        }`}
                                    style={isActive ? {
                                        backgroundColor: `${color}15`,
                                        borderColor: color
                                    } : {}}
                                >
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => { }}
                                            className="sr-only"
                                            readOnly
                                        />
                                        <div
                                            className={`w-5 h-5 rounded-md border-2 transition-smooth flex items-center justify-center ${isActive ? 'border-current' : 'border-gray-300'
                                                }`}
                                            style={isActive ? {
                                                backgroundColor: color,
                                                borderColor: color
                                            } : {}}
                                        >
                                            {isActive && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`flex items-center gap-2 font-medium text-sm ${isActive ? 'text-gray-800' : 'text-gray-500'
                                            }`}
                                    >
                                        <span
                                            className={`w-3 h-3 rounded transition-smooth ${isActive ? 'shadow-sm' : 'opacity-50'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                        {tipo}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filtros por nivel educativo */}
                <div>
                    <h3 className="font-semibold text-gray-800 mb-4 text-base">Ver Niveles:</h3>
                    <div className="space-y-2.5">
                        {Object.keys(filtrosNivel).map(nivel => {
                            const isActive = filtrosNivel[nivel];
                            const nivelColors: { [key: string]: string } = {
                                'Preescolar': '#EC4899', // Rosa
                                'Primaria': '#3B82F6', // Azul
                                'Bachillerato': '#10B981' // Verde
                            };
                            const color = nivelColors[nivel] || '#6B7280';
                            return (
                                <button
                                    key={nivel}
                                    type="button"
                                    onClick={() => setFiltrosNivel(prev => ({ ...prev, [nivel]: !prev[nivel] }))}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth hover-scale ${isActive
                                        ? 'bg-opacity-10 border-2 shadow-sm'
                                        : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                                        }`}
                                    style={isActive ? {
                                        backgroundColor: `${color}15`,
                                        borderColor: color
                                    } : {}}
                                >
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => { }}
                                            className="sr-only"
                                            readOnly
                                        />
                                        <div
                                            className={`w-5 h-5 rounded-md border-2 transition-smooth flex items-center justify-center ${isActive ? 'border-current' : 'border-gray-300'
                                                }`}
                                            style={isActive ? {
                                                backgroundColor: color,
                                                borderColor: color
                                            } : {}}
                                        >
                                            {isActive && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`font-medium text-sm ${isActive ? 'text-gray-800' : 'text-gray-500'
                                            }`}
                                    >
                                        Mostrar solo {nivel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Calendario - Vista seleccionada */}
            {isLoading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Cargando eventos...</p>
                </div>
            ) : (
                <>
                    {viewType === 'month' && renderMonthView()}
                    {viewType === 'week' && renderWeekView()}
                    {viewType === 'day' && renderDayView()}
                    {viewType === 'list' && renderListView()}
                </>
            )}

            {/* Modal para crear/editar evento */}
            {isModalOpen && (
                <EventoModal
                    evento={selectedEvent}
                    fechaInicial={selectedDate}
                    onClose={handleCloseModal}
                    onSave={handleSaveEvent}
                    onDelete={selectedEvent ? handleDeleteEvent : undefined}
                    coloresEventos={coloresEventos}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

// Modal para crear/editar evento
const EventoModal: React.FC<{
    evento: EventoCalendario | null;
    fechaInicial: Date | null;
    onClose: () => void;
    onSave: (evento: Omit<EventoCalendario, 'id_evento' | 'created_at' | 'updated_at'>) => void;
    onDelete?: () => void;
    coloresEventos: { [key: string]: string };
    currentUser: Usuario;
}> = ({ evento, fechaInicial, onClose, onSave, onDelete, coloresEventos, currentUser }) => {
    const [formData, setFormData] = useState({
        titulo: evento?.titulo || '',
        descripcion: evento?.descripcion || '',
        fecha_inicio: evento
            ? formatDateForInput(fromCaracasISOString(evento.fecha_inicio))
            : fechaInicial
                ? (() => {
                    const date = new Date(fechaInicial);
                    date.setHours(9, 0, 0, 0);
                    return formatDateForInput(date);
                })()
                : formatDateForInput(new Date()),
        fecha_fin: evento
            ? formatDateForInput(fromCaracasISOString(evento.fecha_fin))
            : fechaInicial
                ? (() => {
                    const date = new Date(fechaInicial);
                    date.setHours(10, 0, 0, 0);
                    return formatDateForInput(date);
                })()
                : formatDateForInput(new Date(Date.now() + 3600000)),
        tipo_evento: evento?.tipo_evento || 'Actividades Generales' as EventoCalendario['tipo_evento'],
        nivel_educativo: evento?.nivel_educativo || [] as string[],
        color: evento?.color || coloresEventos['Actividades Generales'],
        todo_dia: evento?.todo_dia || false,
    });

    const nivelesDisponibles = ['Preescolar', 'Primaria', 'Bachillerato'];
    const tiposEvento: EventoCalendario['tipo_evento'][] = [
        'Actividades Generales',
        'Actos Cívicos',
        'Entregas Administrativas',
        'Reuniones de Etapa'
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.titulo.trim()) {
            alert('El título es requerido');
            return;
        }
        if (formData.nivel_educativo.length === 0) {
            alert('Debe seleccionar al menos un nivel educativo');
            return;
        }

        // formData.fecha_inicio and fecha_fin are in format "YYYY-MM-DDTHH:mm"
        // We treat these as Caracas local time and convert to UTC for storage
        const fechaInicioUTC = toCaracasISOString(formData.fecha_inicio);
        const fechaFinUTC = toCaracasISOString(formData.fecha_fin);

        onSave({
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            fecha_inicio: fechaInicioUTC,
            fecha_fin: fechaFinUTC,
            tipo_evento: formData.tipo_evento,
            nivel_educativo: formData.nivel_educativo,
            color: formData.color,
            todo_dia: formData.todo_dia,
        });
    };

    const toggleNivel = (nivel: string) => {
        setFormData(prev => ({
            ...prev,
            nivel_educativo: prev.nivel_educativo.includes(nivel)
                ? prev.nivel_educativo.filter(n => n !== nivel)
                : [...prev.nivel_educativo, nivel]
        }));
    };

    const handleTipoChange = (tipo: EventoCalendario['tipo_evento']) => {
        setFormData(prev => ({
            ...prev,
            tipo_evento: tipo,
            color: coloresEventos[tipo],
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {evento ? 'Editar Evento' : 'Nuevo Evento'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <CloseIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField
                        label="Título"
                        name="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                        required
                    />

                    <InputField
                        as="textarea"
                        label="Descripción"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                        rows={3}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputField
                                label="Fecha y Hora de Inicio"
                                name="fecha_inicio"
                                type={formData.todo_dia ? "date" : "datetime-local"}
                                value={formData.todo_dia ? formData.fecha_inicio.split('T')[0] : formData.fecha_inicio}
                                onChange={(e) => {
                                    const value = formData.todo_dia
                                        ? `${e.target.value}T00:00`
                                        : e.target.value;
                                    setFormData(prev => ({ ...prev, fecha_inicio: value }));
                                }}
                                required
                            />
                        </div>
                        <div>
                            <InputField
                                label="Fecha y Hora de Fin"
                                name="fecha_fin"
                                type={formData.todo_dia ? "date" : "datetime-local"}
                                value={formData.todo_dia ? formData.fecha_fin.split('T')[0] : formData.fecha_fin}
                                onChange={(e) => {
                                    const value = formData.todo_dia
                                        ? `${e.target.value}T23:59`
                                        : e.target.value;
                                    setFormData(prev => ({ ...prev, fecha_fin: value }));
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="todo_dia"
                            checked={formData.todo_dia}
                            onChange={(e) => setFormData(prev => ({ ...prev, todo_dia: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="todo_dia" className="text-sm font-medium text-gray-700">
                            Evento de todo el día
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Evento
                        </label>
                        <select
                            value={formData.tipo_evento}
                            onChange={(e) => handleTipoChange(e.target.value as EventoCalendario['tipo_evento'])}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                        >
                            {tiposEvento.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-gray-600">Color:</span>
                            <span
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: formData.color }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Niveles Educativos
                        </label>
                        <div className="space-y-2">
                            {nivelesDisponibles.map(nivel => (
                                <label key={nivel} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.nivel_educativo.includes(nivel)}
                                        onChange={() => toggleNivel(nivel)}
                                        className="rounded"
                                    />
                                    <span>{nivel}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t">
                        <div>
                            {evento && onDelete && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light font-medium transition-apple"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90"
                            >
                                {evento ? 'Actualizar' : 'Crear'} Evento
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GradeChart: React.FC<{ data: { [key in Nota]?: number } }> = ({ data }) => {
    const grades: Nota[] = ['A', 'B', 'C', 'D', 'E', 'SE'];
    const maxCount = Math.max(...Object.values(data).filter(v => typeof v === 'number'), 1);
    const chartData = grades.filter(g => g !== '').map(grade => ({
        name: grade,
        value: data[grade] || 0,
        color: gradeColors[grade] || '#D1D5DB'
    }));

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-center">Distribución de Notas</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};


const EvaluationView: React.FC<{
    alumnos: Alumno[];
    clases: Clase[];
    minutas: MinutaEvaluacion[];
    setMinutas: React.Dispatch<React.SetStateAction<MinutaEvaluacion[]>>;
    currentUser: Usuario;
}> = ({ alumnos, clases, minutas, setMinutas, currentUser }) => {
    const { showToast } = useToast();
    // Validar que los datos estén disponibles
    if (!alumnos || !clases || !minutas) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>Los datos no están disponibles. Por favor, recarga la página.</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }
    const [viewMode, setViewMode] = useState<'new' | 'history' | 'progress'>('new');
    const [selectedMinuta, setSelectedMinuta] = useState<MinutaEvaluacion | null>(null);

    const [filters, setFilters] = useState({
        ano_escolar: '2025-2026',
        lapso: 'I Lapso',
        evaluacion: 'I Mensual',
        grado: '',
        materia: ''
    });
    const [studentEvals, setStudentEvals] = useState<Map<string, EvaluacionAlumno>>(new Map());
    const [aiAnalysis, setAiAnalysis] = useState<AnalisisDificultad[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Clinical-Pedagogical Diagnostic System States
    const [indicadoresDisponibles, setIndicadoresDisponibles] = useState<MaestraIndicador[]>([]);
    const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
    const [detallesIndicadores, setDetallesIndicadores] = useState<Map<string, Map<string, number>>>(new Map());
    const [softData, setSoftData] = useState<{
        nivel_independencia: '' | 'Autónomo' | 'Apoyo Parcial' | 'Apoyo Total';
        estado_emocional: '' | 'Enfocado' | 'Ansioso' | 'Distraído' | 'Participativo';
        eficacia_accion_anterior: '' | 'Resuelto' | 'En Proceso' | 'Ineficaz';
    }>({
        nivel_independencia: '',
        estado_emocional: '',
        eficacia_accion_anterior: ''
    });

    // Estados para el dashboard de progreso
    const [progressFilters, setProgressFilters] = useState({
        ano_escolar: '2025-2026',
        lapso: 'I Lapso',
        grado: '',
        materia: 'all'
    });
    const [progressData, setProgressData] = useState<any>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);
    const [historicalBenchmark, setHistoricalBenchmark] = useState<any>(null);
    const [riskData, setRiskData] = useState<any>(null);
    const [isLoadingRisk, setIsLoadingRisk] = useState(false);
    const [eficaciaData, setEficaciaData] = useState<any>(null);
    const [isLoadingEficacia, setIsLoadingEficacia] = useState(false);
    const [competenciasData, setCompetenciasData] = useState<any>(null);
    const [isLoadingCompetencias, setIsLoadingCompetencias] = useState(false);

    // Group indicators by Routine and Competency
    const groupedIndicators = useMemo(() => {
        const groups: Record<string, Record<string, MaestraIndicador[]>> = {};
        const competencyMap = new Map<string, MaestraIndicador>();

        // First pass: Find competencies
        indicadoresDisponibles.filter(i => i.categoria === 'Competencia').forEach(c => {
            competencyMap.set(c.id_indicador, c);
        });

        // Initialize groups
        indicadoresDisponibles.forEach(ind => {
            const rutina = ind.rutina || 'General';
            if (!groups[rutina]) groups[rutina] = {};

            if (ind.categoria === 'Indicador') {
                const parentId = ind.id_padre || 'NoCompetencia';
                if (!groups[rutina][parentId]) groups[rutina][parentId] = [];
                groups[rutina][parentId].push(ind);
            }
        });

        return { groups, competencyMap };
    }, [indicadoresDisponibles]);

    // Helper function to check if subject is an English level
    const isEnglishLevel = (subjectName: string): boolean => {
        const englishLevels = ['Basic', 'Lower', 'Upper', 'Advanced', 'IB'];
        return englishLevels.includes(subjectName);
    };

    const availableSubjects = useMemo(() => {
        if (!filters.grado) return [];

        const isEnglishGrade = filters.grado === '5to Grado' || filters.grado === '6to Grado';
        const isEnglishLevelsGrade = filters.grado === 'Niveles de Inglés (5to-6to)';

        // Special case: Niveles de Inglés (5to-6to) - show only English levels
        if (isEnglishLevelsGrade) {
            // Get unique English levels from students in 5th and 6th grade
            const studentsIn5thAnd6th = alumnos.filter(a =>
                a.salon === '5to Grado' || a.salon === '6to Grado'
            );
            const uniqueLevels = [...new Set(studentsIn5thAnd6th.map(s => s.nivel_ingles).filter(Boolean))];

            // Create a subject entry for each level
            const englishLevelSubjects = uniqueLevels.map(level => ({
                id_clase: `english-level-${level}`,
                nombre_materia: level as string,
                grado_asignado: filters.grado,
                id_docente_asignado: '',
                studentIds: []
            }));

            return englishLevelSubjects;
        }

        // Get regular subjects (excluding English for 5to-6to)
        const regularSubjects = clases
            .filter(c => c.grado_asignado === filters.grado)
            .filter(c => c.nombre_materia && c.nombre_materia.trim() !== '')
            .filter(c => {
                // For 5to-6to, exclude all English classes
                if (isEnglishGrade &&
                    (c.nombre_materia?.toLowerCase().includes('inglés') ||
                        c.nombre_materia?.toLowerCase().includes('ingles'))) {
                    return false;
                }
                return true;
            });

        // For 5to-6to, add English levels as subjects
        if (isEnglishGrade) {
            // Get unique English levels from students in this grade
            const studentsInGrade = alumnos.filter(a => a.salon === filters.grado);
            const uniqueLevels = [...new Set(studentsInGrade.map(s => s.nivel_ingles).filter(Boolean))];

            // Create a subject entry for each level
            const englishLevelSubjects = uniqueLevels.map(level => ({
                id_clase: `english-level-${level}`,
                nombre_materia: level as string,
                grado_asignado: filters.grado,
                id_docente_asignado: '',
                studentIds: []
            }));

            return [...regularSubjects, ...englishLevelSubjects];
        }

        return regularSubjects;
    }, [filters.grado, clases, alumnos]);

    const studentsInGrade = useMemo(() => {
        if (!filters.grado) return [];

        const isEnglishLevelsGrade = filters.grado === 'Niveles de Inglés (5to-6to)';

        // Special case: Niveles de Inglés (5to-6to)
        if (isEnglishLevelsGrade) {
            // Start with all students from 5th and 6th grade
            let students = alumnos.filter(a =>
                a.salon === '5to Grado' || a.salon === '6to Grado'
            );

            // If an English level is selected, filter by nivel_ingles
            if (filters.materia && isEnglishLevel(filters.materia)) {
                students = students.filter(a => a.nivel_ingles === filters.materia);
            }

            return students;
        }

        // Regular grade filtering
        let students = alumnos.filter(a => a.salon === filters.grado);

        // SPECIAL: If 6to Grado + English level selected, show students from BOTH 5to and 6to
        if (filters.grado === '6to Grado' && filters.materia && isEnglishLevel(filters.materia)) {
            // Get all students from both grades with this English level
            students = alumnos.filter(a =>
                (a.salon === '5to Grado' || a.salon === '6to Grado') &&
                a.nivel_ingles === filters.materia
            );
        }
        // For 5to Grado with English level, show only 5to students (normal behavior)
        else if (filters.grado === '5to Grado' && filters.materia && isEnglishLevel(filters.materia)) {
            students = students.filter(a => a.nivel_ingles === filters.materia);
        }

        return students;
    }, [filters.grado, filters.materia, alumnos]);

    const calculateAdvancedAnalytics = (evals: EvaluacionAlumno[]) => {
        const adaptationCounts: { [key: string]: number } = {};
        const overallGradeCounts: { [key: string]: number } = {};
        const gradeDistributionByAdaptation: { [key: string]: { [key: string]: number } } = { 'Reg': {}, 'AC+': {}, 'AC-': {} };

        for (const evalData of evals) {
            if (evalData.adaptacion) {
                adaptationCounts[evalData.adaptacion] = (adaptationCounts[evalData.adaptacion] || 0) + 1;
            }
            if (evalData.nota) {
                overallGradeCounts[evalData.nota] = (overallGradeCounts[evalData.nota] || 0) + 1;
                if (evalData.adaptacion && gradeDistributionByAdaptation[evalData.adaptacion]) {
                    const group = gradeDistributionByAdaptation[evalData.adaptacion];
                    group[evalData.nota] = (group[evalData.nota] || 0) + 1;
                }
            }
        }
        return { adaptationCounts, overallGradeCounts, gradeDistributionByAdaptation };
    };

    const liveGradeDistribution = useMemo(() => {
        const counts: { [key in Nota]?: number } = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'SE': 0 };
        for (const evalData of studentEvals.values()) {
            if (evalData.nota && counts[evalData.nota] !== undefined) {
                counts[evalData.nota]!++;
            }
        }
        return counts;
    }, [studentEvals]);

    const calculateGradeDistribution = (evals: EvaluacionAlumno[]): { [key in Nota]?: number } => {
        const counts: { [key in Nota]?: number } = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'SE': 0 };
        for (const evalData of evals) {
            if (evalData.nota && counts[evalData.nota] !== undefined) {
                counts[evalData.nota]!++;
            }
        }
        return counts;
    }

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'grado') {
                newFilters.materia = '';
            }
            return newFilters;
        });
        setStudentEvals(new Map());
        setAiAnalysis([]);
    };

    const handleStudentEvalChange = (studentId: string, field: keyof Omit<EvaluacionAlumno, 'id_alumno'>, value: string | number) => {
        setStudentEvals(prevMap => {
            const newMap = new Map(prevMap);
            const currentData = newMap.get(studentId) || { id_alumno: studentId, nota: '', adaptacion: '', observaciones: '' };
            newMap.set(studentId, { ...currentData, [field]: value as any });
            return newMap;
        });
    };

    // Clinical-Pedagogical Diagnostic System: Load indicators when class/subject is selected
    useEffect(() => {
        if (filters.grado && filters.materia) {
            const claseSeleccionada = clases.find(
                c => c.grado_asignado === filters.grado && c.nombre_materia === filters.materia
            );

            if (claseSeleccionada) {
                maestraIndicadoresService.getByClase(claseSeleccionada.id_clase)
                    .then(data => {
                        setIndicadoresDisponibles(data);
                    })
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
    const handleIndicadorChange = (idAlumno: string, idIndicador: string, nivel: string) => {
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

    // New State for Selected Indicators (The "Bank")
    const [selectedIndicators, setSelectedIndicators] = useState<Map<string, Set<string>>>(new Map());

    const toggleIndicatorSelection = (idAlumno: string, idIndicador: string) => {
        setSelectedIndicators(prev => {
            const newMap = new Map(prev);
            const studentSet = new Set(newMap.get(idAlumno) || []);

            if (studentSet.has(idIndicador)) {
                studentSet.delete(idIndicador);
                // Also remove the rating if deselected
                setDetallesIndicadores(prevDetails => {
                    const newDetails = new Map(prevDetails);
                    const studentDetails = newDetails.get(idAlumno);
                    if (studentDetails) {
                        studentDetails.delete(idIndicador);
                        newDetails.set(idAlumno, studentDetails);
                    }
                    return newDetails;
                });
            } else {
                studentSet.add(idIndicador);
            }

            newMap.set(idAlumno, studentSet);
            return newMap;
        });
    };

    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setAiAnalysis([]);
        const dataForAI = Array.from(studentEvals.values()).map(evalData => {
            const student = alumnos.find(a => a.id_alumno === evalData.id_alumno);
            return {
                nombre_alumno: `${student?.nombres} ${student?.apellidos}`,
                nota: evalData.nota || 'No asignada',
                adaptacion: evalData.adaptacion || 'No asignada',
                observaciones: evalData.observaciones || 'Sin observaciones'
            };
        });

        const responseString = await getAIEvaluationAnalysis(dataForAI);
        try {
            const result = JSON.parse(responseString);
            setAiAnalysis(result);
        } catch (e) {
            console.error("Failed to parse AI response:", e);
            setAiAnalysis([{
                dificultad: "Error de Formato",
                categoria: "Sistema",
                frecuencia: 0,
                estudiantes: "N/A",
                accionesSugeridas: "La respuesta de Coco no pudo ser procesada. Inténtelo de nuevo."
            }]);
        }
        setIsLoading(false);
    };

    const handleAiActionChange = (index: number, value: string) => {
        setAiAnalysis(prev => prev.map((item, i) => i === index ? { ...item, accionesSugeridas: value } : item));
    }

    const handleSaveMinuta = async () => {
        try {
            // Prepare basic minuta data with soft data included
            const minutaToSave = {
                ...filters,
                datos_alumnos: Array.from(studentEvals.values()),
                analisis_ia: aiAnalysis,
                nivel_independencia: softData.nivel_independencia || null,
                estado_emocional: softData.estado_emocional || null,
                eficacia_accion_anterior: softData.eficacia_accion_anterior || null,
                created_by: currentUser?.id || null
            };

            // Create minuta in database
            const created = await minutasService.create(minutaToSave);

            // Save detailed indicator evaluations if any exist
            const detallesParaGuardar: Omit<DetalleEvaluacionAlumno, 'id_detalle' | 'created_at' | 'updated_at'>[] = [];

            for (const [idAlumno, indicadoresMap] of detallesIndicadores.entries()) {
                for (const [idIndicador, nivelLogro] of indicadoresMap.entries()) {
                    if (nivelLogro) { // Only save if a level was selected (string check)
                        detallesParaGuardar.push({
                            id_minuta: created.id_minuta,
                            id_alumno: idAlumno,
                            id_indicador: idIndicador,
                            nivel_logro: nivelLogro // Now string (A-E)
                        });
                    }
                }
            }

            if (detallesParaGuardar.length > 0) {
                await detalleEvaluacionService.createBulk(detallesParaGuardar);
            }

            // Save Pedagogical Intelligence Summaries (ResumenEvaluacionAlumno)
            const resumenesParaGuardar: Omit<ResumenEvaluacionAlumno, 'id_resumen' | 'created_at' | 'updated_at'>[] = [];

            for (const evalData of studentEvals.values()) {
                // Only save if there is some data worth saving (grade or soft data)
                if (evalData.nota || evalData.inasistencias !== undefined || evalData.nivel_independencia || evalData.estado_emocional || evalData.eficacia_accion_anterior || evalData.observaciones) {
                    resumenesParaGuardar.push({
                        id_minuta: created.id_minuta,
                        id_alumno: evalData.id_alumno,
                        nota: evalData.nota || undefined,
                        inasistencias: evalData.inasistencias, // Now number (count)
                        nivel_independencia: evalData.nivel_independencia,
                        estado_emocional: evalData.estado_emocional,
                        eficacia_accion_anterior: evalData.eficacia_accion_anterior,
                        observaciones: evalData.observaciones
                    });
                }
            }

            // Save resúmenes (try-catch individual para no fallar toda la operación)
            let resumenesGuardados = 0;
            if (resumenesParaGuardar.length > 0) {
                try {
                    await resumenEvaluacionService.createBulk(resumenesParaGuardar);
                    resumenesGuardados = resumenesParaGuardar.length;
                } catch (resumenError: any) {
                    console.error('Error al guardar resúmenes de evaluación:', resumenError);
                    // Si el error es de RLS, dar instrucciones específicas
                    if (resumenError.message?.includes('row-level security') || resumenError.message?.includes('RLS')) {
                        console.warn('Error de RLS al guardar resúmenes. Asegúrate de aplicar la migración 051.');
                        // Continuar con el flujo normal, la minuta ya se guardó
                    } else {
                        // Para otros errores, también continuar pero registrar
                        console.warn('Error al guardar resúmenes:', resumenError.message);
                    }
                }
            }

            // Reload all minutas
            const allMinutas = await minutasService.getAll();
            setMinutas(allMinutas);

            // Mensaje de éxito más detallado
            let mensajeExito = 'Minuta guardada con éxito.';
            let tipoToast: 'success' | 'warning' = 'success';
            
            if (detallesParaGuardar.length > 0) {
                mensajeExito += ` ${detallesParaGuardar.length} detalles de indicadores guardados.`;
            }
            if (resumenesGuardados > 0) {
                mensajeExito += ` ${resumenesGuardados} resúmenes de evaluación guardados.`;
            } else if (resumenesParaGuardar.length > 0) {
                mensajeExito += ' Nota: Los resúmenes de evaluación no se pudieron guardar. La minuta se guardó correctamente, pero es posible que necesites aplicar la migración 051 en Supabase.';
                tipoToast = 'warning';
            }

            showToast({
                type: tipoToast,
                title: tipoToast === 'success' ? 'Minuta guardada exitosamente' : 'Minuta guardada con advertencias',
                message: mensajeExito,
                duration: tipoToast === 'warning' ? 8000 : 6000,
            });

            // Reset form
            setFilters({ ano_escolar: '2025-2026', lapso: 'I Lapso', evaluacion: 'I Mensual', grado: '', materia: '' });
            setStudentEvals(new Map());
            setAiAnalysis([]);
            setDetallesIndicadores(new Map());
            setSoftData({ nivel_independencia: '', estado_emocional: '', eficacia_accion_anterior: '' });
            setExpandedStudents(new Set());
        } catch (error: any) {
            console.error('Error saving minuta:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            
            // Mensaje de error más específico
            let mensajeError = 'Error al guardar la minuta: ' + (error.message || 'Error desconocido');
            
            // Si es error de RLS, dar instrucciones específicas
            if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
                mensajeError += '\n\n⚠️ Error de políticas RLS. Por favor, aplica la migración 051 en Supabase:\n';
                mensajeError += '1. Ve a Supabase Dashboard > SQL Editor\n';
                mensajeError += '2. Ejecuta el contenido de: supabase/migrations/051_fix_evaluation_tables_rls.sql\n';
                mensajeError += '3. O revisa el archivo APLICAR_MIGRACION_051.md para más detalles.';
            } else {
                mensajeError += '\n\nRevisa la consola para más detalles.';
            }
            
            alert(mensajeError);
        }
    }

    const isFormReady = filters.grado && filters.materia;

    // ============================================
    // FUNCIONES DE ANÁLISIS ESTADÍSTICO
    // ============================================

    // Función para convertir nota a número (sistema de letras primaria)
    // A = 5, B = 4, C = 3, D = 2, E = 1, F = 0, SE = 0
    const convertNotaToNumber = (nota: string | undefined): number => {
        if (!nota) return 0;
        const notaUpper = nota.toUpperCase().trim();
        const gradeMap: Record<string, number> = { 
            'A': 5, 
            'B': 4, 
            'C': 3, 
            'D': 2, 
            'E': 1, 
            'F': 0, 
            'SE': 0 
        };
        if (gradeMap[notaUpper]) return gradeMap[notaUpper];
        // Si es un número, intentar convertirlo (para compatibilidad)
        const num = parseFloat(nota);
        return isNaN(num) ? 0 : num;
    };
    
    // Función para convertir número a letra (para mostrar promedios)
    const convertNumberToLetter = (num: number): string => {
        if (num >= 4.5) return 'A';
        if (num >= 3.5) return 'B';
        if (num >= 2.5) return 'C';
        if (num >= 1.5) return 'D';
        if (num >= 0.5) return 'E';
        if (num > 0) return 'F';
        return 'SE';
    };
    
    // Función para obtener el valor numérico de una letra (para cálculos)
    const getLetterValue = (letter: string): number => {
        return convertNotaToNumber(letter);
    };
    
    // Umbral de aprobación: C o superior (3 o más)
    const isAprobado = (notaNum: number): boolean => {
        return notaNum >= 3; // C o superior
    };

    // Función para calcular regresión lineal (pendiente y intercepto)
    const calculateLinearRegression = (data: Array<{x: number, y: number}>): {slope: number, intercept: number, r2: number} => {
        if (data.length < 2) return { slope: 0, intercept: 0, r2: 0 };
        
        const n = data.length;
        const sumX = data.reduce((sum, d) => sum + d.x, 0);
        const sumY = data.reduce((sum, d) => sum + d.y, 0);
        const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
        const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
        const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calcular R² (coeficiente de determinación)
        const meanY = sumY / n;
        const ssRes = data.reduce((sum, d) => {
            const predicted = slope * d.x + intercept;
            return sum + Math.pow(d.y - predicted, 2);
        }, 0);
        const ssTot = data.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0);
        const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
        
        return { slope, intercept, r2 };
    };

    // Función para calcular correlación de Pearson
    const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
        const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    };

    // Función para calcular desviación estándar
    const calculateStandardDeviation = (values: number[]): number => {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    };

    // Función para calcular percentiles
    const calculatePercentile = (values: number[], percentile: number): number => {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    };

    // Función para cargar datos de progreso
    const loadProgressData = async () => {
        if (!progressFilters.grado || !progressFilters.lapso) return;
        
        setIsLoadingProgress(true);
        try {
            // Obtener todas las minutas del lapso para el grado y materia seleccionados
            const minutasFiltradas = minutas.filter(m => 
                m.ano_escolar === progressFilters.ano_escolar &&
                m.lapso === progressFilters.lapso &&
                m.grado === progressFilters.grado &&
                (progressFilters.materia === 'all' || progressFilters.materia === '' || m.materia === progressFilters.materia)
            );

            // Agrupar por evaluación (I Mensual, II Mensual, III Mensual, Seguimiento)
            const evaluaciones = ['I Mensual', 'II Mensual', 'III Mensual', 'Seguimiento Pedagógico'];
            
            const progressByEvaluation: Record<string, any> = {};
            
            for (const evalType of evaluaciones) {
                const minutasEval = minutasFiltradas.filter(m => m.evaluacion === evalType);
                
                if (minutasEval.length > 0) {
                    // Agrupar por materia
                    const byMateria: Record<string, any> = {};
                    
                    for (const minuta of minutasEval) {
                        if (!byMateria[minuta.materia]) {
                            byMateria[minuta.materia] = {
                                materia: minuta.materia,
                                datos: [],
                                promedio: 0,
                                totalEstudiantes: 0,
                                aprobados: 0,
                                reprobados: 0
                            };
                        }
                        
                        // Procesar datos de alumnos de esta minuta
                        if (minuta.datos_alumnos && Array.isArray(minuta.datos_alumnos)) {
                            minuta.datos_alumnos.forEach((evalData: any) => {
                                const notaNum = convertNotaToNumber(evalData.nota);
                                byMateria[minuta.materia].datos.push({
                                    id_alumno: evalData.id_alumno,
                                    nota: evalData.nota,
                                    notaNum: notaNum,
                                    adaptacion: evalData.adaptacion,
                                    observaciones: evalData.observaciones
                                });
                                
                                if (isAprobado(notaNum)) {
                                    byMateria[minuta.materia].aprobados++;
                                } else {
                                    byMateria[minuta.materia].reprobados++;
                                }
                            });
                        }
                    }
                    
                    // Calcular promedios por materia
                    Object.keys(byMateria).forEach(materia => {
                        const datos = byMateria[materia].datos;
                        if (datos.length > 0) {
                            const suma = datos.reduce((acc: number, d: any) => acc + d.notaNum, 0);
                            byMateria[materia].promedio = suma / datos.length;
                            byMateria[materia].totalEstudiantes = datos.length;
                        }
                    });
                    
                    progressByEvaluation[evalType] = byMateria;
                }
            }
            
            setProgressData(progressByEvaluation);
            
            // Cargar benchmark histórico si hay materia seleccionada (y no es "all")
            if (progressFilters.materia && progressFilters.materia !== 'all') {
                try {
                    const benchmark = await analyticsService.getHistoricalBenchmark(
                        progressFilters.grado,
                        progressFilters.materia,
                        progressFilters.lapso,
                        progressFilters.ano_escolar
                    );
                    setHistoricalBenchmark(benchmark);
                } catch (error) {
                    console.error('Error loading historical benchmark:', error);
                }
            }
        } catch (error) {
            console.error('Error loading progress data:', error);
        } finally {
            setIsLoadingProgress(false);
        }
    };

    // Función para cargar datos de riesgo
    const loadRiskData = async () => {
        if (!progressFilters.grado || !progressFilters.lapso) return;
        
        setIsLoadingRisk(true);
        try {
            // Obtener estudiantes del grado seleccionado
            const estudiantesGrado = alumnos.filter(a => a.salon === progressFilters.grado);
            const studentIds = estudiantesGrado.map(a => a.id_alumno);
            
            if (studentIds.length === 0) {
                setRiskData(null);
                return;
            }
            
            // Obtener risk scores usando el servicio existente
            const riskScores = await analyticsService.getRiskScores(
                studentIds,
                progressFilters.ano_escolar,
                progressFilters.lapso
            );
            
            // Procesar datos para análisis
            const riskDistribution = {
                bajo: riskScores.filter(r => (r.risk_score || 0) < 30).length,
                medio: riskScores.filter(r => (r.risk_score || 0) >= 30 && (r.risk_score || 0) < 60).length,
                alto: riskScores.filter(r => (r.risk_score || 0) >= 60 && (r.risk_score || 0) < 80).length,
                critico: riskScores.filter(r => (r.risk_score || 0) >= 80).length
            };
            
            // Estudiantes en riesgo (score >= 60)
            const estudiantesEnRiesgo = riskScores
                .filter(r => (r.risk_score || 0) >= 60)
                .map(risk => {
                    const estudiante = estudiantesGrado.find(a => a.id_alumno === risk.id_alumno);
                    return {
                        id: risk.id_alumno,
                        nombre: estudiante ? `${estudiante.apellidos}, ${estudiante.nombres}` : 'Desconocido',
                        salon: estudiante?.salon || '',
                        riskScore: risk.risk_score || 0,
                        riskLevel: risk.risk_level || 'Sin Datos',
                        factores: risk.factores_riesgo || {}
                    };
                })
                .sort((a, b) => b.riskScore - a.riskScore);
            
            // Análisis de factores de riesgo
            const factoresAnalisis = {
                promedio_bajo: riskScores.filter(r => r.factores_riesgo?.promedio_bajo).length,
                asistencia_critica: riskScores.filter(r => r.factores_riesgo?.asistencia_critica).length,
                asistencia_baja: riskScores.filter(r => r.factores_riesgo?.asistencia_baja).length,
                evaluaciones_reprobadas: riskScores.filter(r => r.factores_riesgo?.evaluaciones_reprobadas > 0).length,
                estados_negativos: riskScores.filter(r => r.factores_riesgo?.estados_negativos).length,
                baja_independencia: riskScores.filter(r => r.factores_riesgo?.baja_independencia).length
            };
            
            // Datos para histograma de distribución
            const histogramData = [
                { range: '0-29', label: 'Bajo', count: riskDistribution.bajo, color: '#22c55e' },
                { range: '30-59', label: 'Medio', count: riskDistribution.medio, color: '#eab308' },
                { range: '60-79', label: 'Alto', count: riskDistribution.alto, color: '#f97316' },
                { range: '80-100', label: 'Crítico', count: riskDistribution.critico, color: '#ef4444' }
            ];
            
            setRiskData({
                distribution: riskDistribution,
                histogramData,
                estudiantesEnRiesgo,
                factoresAnalisis,
                totalEstudiantes: riskScores.length,
                promedioRiskScore: riskScores.length > 0 
                    ? riskScores.reduce((sum, r) => sum + (r.risk_score || 0), 0) / riskScores.length 
                    : 0
            });
        } catch (error) {
            console.error('Error loading risk data:', error);
            setRiskData(null);
        } finally {
            setIsLoadingRisk(false);
        }
    };

    // Función para cargar datos de eficacia pedagógica
    const loadEficaciaData = async () => {
        if (!progressFilters.grado || !progressFilters.lapso) return;
        
        setIsLoadingEficacia(true);
        try {
            // Obtener minutas filtradas
            const minutasFiltradas = minutas.filter(m => 
                m.ano_escolar === progressFilters.ano_escolar &&
                m.lapso === progressFilters.lapso &&
                m.grado === progressFilters.grado &&
                (progressFilters.materia === 'all' || progressFilters.materia === '' || m.materia === progressFilters.materia)
            );
            
            if (minutasFiltradas.length === 0) {
                setEficaciaData(null);
                return;
            }
            
            // Procesar datos de eficacia
            let totalIntervenciones = 0;
            let intervencionesResueltas = 0;
            let intervencionesEnProceso = 0;
            let intervencionesIneficaces = 0;
            
            const timelineAcciones: any[] = [];
            const intervencionesPorEstudiante = new Map<string, {
                estudiante: string;
                intervenciones: number;
                resueltas: number;
                enProceso: number;
                ineficaces: number;
                mejoras: number;
                primeraNota: number;
                ultimaNota: number;
            }>();
            
            // Procesar cada minuta
            minutasFiltradas.forEach((minuta) => {
                // Obtener acciones sugeridas del análisis IA
                const accionesSugeridas = minuta.analisis_ia && Array.isArray(minuta.analisis_ia) 
                    ? minuta.analisis_ia.map((a: any) => a.accionesSugeridas || '').filter((a: string) => a.trim() !== '').join('; ')
                    : '';
                
                // Procesar datos de alumnos para obtener eficacia de acciones
                if (minuta.datos_alumnos && Array.isArray(minuta.datos_alumnos)) {
                    minuta.datos_alumnos.forEach((evalData: any) => {
                        const eficacia = evalData.eficacia_accion_anterior;
                        
                        if (eficacia && eficacia !== 'No Aplica' && eficacia !== '') {
                            totalIntervenciones++;
                            
                            if (eficacia === 'Resuelto') {
                                intervencionesResueltas++;
                            } else if (eficacia === 'En Proceso') {
                                intervencionesEnProceso++;
                            } else if (eficacia === 'Ineficaz') {
                                intervencionesIneficaces++;
                            }
                            
                            // Trackear por estudiante
                            const estudiante = alumnos.find(a => a.id_alumno === evalData.id_alumno);
                            const nombreEstudiante = estudiante ? `${estudiante.apellidos}, ${estudiante.nombres}` : 'Desconocido';
                            
                            if (!intervencionesPorEstudiante.has(evalData.id_alumno)) {
                                intervencionesPorEstudiante.set(evalData.id_alumno, {
                                    estudiante: nombreEstudiante,
                                    intervenciones: 0,
                                    resueltas: 0,
                                    enProceso: 0,
                                    ineficaces: 0,
                                    mejoras: 0,
                                    primeraNota: convertNotaToNumber(evalData.nota),
                                    ultimaNota: convertNotaToNumber(evalData.nota)
                                });
                            }
                            
                            const estudianteData = intervencionesPorEstudiante.get(evalData.id_alumno)!;
                            estudianteData.intervenciones++;
                            if (eficacia === 'Resuelto') estudianteData.resueltas++;
                            if (eficacia === 'En Proceso') estudianteData.enProceso++;
                            if (eficacia === 'Ineficaz') estudianteData.ineficaces++;
                            
                            // Actualizar última nota
                            const notaNum = convertNotaToNumber(evalData.nota);
                            estudianteData.ultimaNota = notaNum;
                        }
                    });
                }
                
                // Agregar al timeline si hay acciones sugeridas
                if (accionesSugeridas) {
                    timelineAcciones.push({
                        fecha: new Date(minuta.fecha_creacion),
                        evaluacion: minuta.evaluacion,
                        materia: minuta.materia,
                        grado: minuta.grado,
                        accionesSugeridas: accionesSugeridas,
                        totalEstudiantes: minuta.datos_alumnos?.length || 0
                    });
                }
            });
            
            // Calcular mejoras por estudiante
            intervencionesPorEstudiante.forEach((data) => {
                data.mejoras = data.ultimaNota - data.primeraNota;
            });
            
            // Ordenar timeline por fecha
            timelineAcciones.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
            
            // Calcular tasa de éxito
            const tasaExito = totalIntervenciones > 0 
                ? (intervencionesResueltas / totalIntervenciones) * 100 
                : 0;
            
            // Calcular ROI pedagógico
            const estudiantesConMejora = Array.from(intervencionesPorEstudiante.values())
                .filter(e => e.mejoras > 0);
            const promedioMejora = estudiantesConMejora.length > 0
                ? estudiantesConMejora.reduce((sum, e) => sum + e.mejoras, 0) / estudiantesConMejora.length
                : 0;
            const totalMejora = estudiantesConMejora.reduce((sum, e) => sum + e.mejoras, 0);
            
            // Calcular "inversión" (número de intervenciones) vs "retorno" (mejoras)
            const totalInversion = totalIntervenciones;
            const roi = totalInversion > 0 ? (totalMejora / totalInversion) * 100 : 0;
            
            setEficaciaData({
                tasaExito: tasaExito.toFixed(1),
                totalIntervenciones,
                intervencionesResueltas,
                intervencionesEnProceso,
                intervencionesIneficaces,
                timelineAcciones,
                intervencionesPorEstudiante: Array.from(intervencionesPorEstudiante.values()),
                promedioMejora: promedioMejora.toFixed(2),
                totalMejora: totalMejora.toFixed(2),
                estudiantesConMejora: estudiantesConMejora.length,
                roi: roi.toFixed(1),
                totalInversion
            });
        } catch (error) {
            console.error('Error loading eficacia data:', error);
            setEficaciaData(null);
        } finally {
            setIsLoadingEficacia(false);
        }
    };

    // Función para cargar datos de competencias e indicadores
    const loadCompetenciasData = async () => {
        if (!progressFilters.grado || !progressFilters.lapso) return;
        
        setIsLoadingCompetencias(true);
        try {
            // Obtener minutas filtradas
            const minutasFiltradas = minutas.filter(m => 
                m.ano_escolar === progressFilters.ano_escolar &&
                m.lapso === progressFilters.lapso &&
                m.grado === progressFilters.grado &&
                (progressFilters.materia === 'all' || progressFilters.materia === '' || m.materia === progressFilters.materia)
            );
            
            if (minutasFiltradas.length === 0) {
                setCompetenciasData(null);
                return;
            }
            
            // Obtener clases relacionadas con el grado y materia
            const clasesFiltradas = clases.filter(c => 
                c.grado_asignado === progressFilters.grado &&
                (progressFilters.materia === 'all' || progressFilters.materia === '' || 
                 c.nombre_materia.toLowerCase().includes(progressFilters.materia.toLowerCase()) ||
                 (progressFilters.materia === 'Lengua' && (c.nombre_materia.toLowerCase().includes('lengua') || c.nombre_materia.toLowerCase().includes('lenguaje'))) ||
                 (progressFilters.materia === 'Inglés' && c.nombre_materia.toLowerCase().includes('inglés')) ||
                 (progressFilters.materia === 'Matemáticas' && c.nombre_materia.toLowerCase().includes('matemática')))
            );
            
            // Obtener todos los indicadores de las clases
            const allIndicadores: MaestraIndicador[] = [];
            for (const clase of clasesFiltradas) {
                try {
                    const indicadores = await maestraIndicadoresService.getByClase(clase.id_clase);
                    allIndicadores.push(...indicadores);
                } catch (error) {
                    console.error(`Error loading indicators for class ${clase.id_clase}:`, error);
                }
            }
            
            // Separar competencias e indicadores
            const competencias = allIndicadores.filter(i => i.categoria === 'Competencia' && i.activo);
            const indicadores = allIndicadores.filter(i => i.categoria === 'Indicador' && i.activo);
            
            // Obtener detalles de evaluación de todas las minutas
            const allDetalles: DetalleEvaluacionAlumno[] = [];
            for (const minuta of minutasFiltradas) {
                try {
                    const detalles = await detalleEvaluacionService.getByMinuta(minuta.id_minuta);
                    allDetalles.push(...detalles);
                } catch (error) {
                    console.error(`Error loading details for minuta ${minuta.id_minuta}:`, error);
                }
            }
            
            // Crear mapa de competencias con sus indicadores
            const competenciasMap = new Map<string, {
                competencia: MaestraIndicador;
                indicadores: MaestraIndicador[];
                promedios: Map<string, number>; // id_indicador -> promedio nivel_logro
                estudiantes: Map<string, number>; // id_alumno -> promedio nivel_logro
            }>();
            
            competencias.forEach(comp => {
                const indicadoresComp = indicadores.filter(ind => ind.id_padre === comp.id_indicador);
                competenciasMap.set(comp.id_indicador, {
                    competencia: comp,
                    indicadores: indicadoresComp,
                    promedios: new Map(),
                    estudiantes: new Map()
                });
            });
            
            // Procesar detalles de evaluación
            const indicadoresMap = new Map(indicadores.map(ind => [ind.id_indicador, ind]));
            
            // Contadores para calcular promedios correctamente
            const indicadorCounts = new Map<string, number>();
            const estudianteCounts = new Map<string, number>();
            
            allDetalles.forEach(detalle => {
                const indicador = indicadoresMap.get(detalle.id_indicador);
                if (!indicador || !indicador.id_padre) return;
                
                const competenciaData = competenciasMap.get(indicador.id_padre);
                if (!competenciaData) return;
                
                // Convertir nivel_logro a número (1-5)
                const nivelLogro = typeof detalle.nivel_logro === 'string' 
                    ? parseFloat(detalle.nivel_logro) 
                    : (detalle.nivel_logro as any);
                
                if (isNaN(nivelLogro) || nivelLogro < 1 || nivelLogro > 5) return;
                
                // Actualizar suma y contador por indicador
                const indicadorKey = `${indicador.id_padre}-${detalle.id_indicador}`;
                const currentSum = competenciaData.promedios.get(detalle.id_indicador) || 0;
                const currentCount = indicadorCounts.get(indicadorKey) || 0;
                competenciaData.promedios.set(detalle.id_indicador, currentSum + nivelLogro);
                indicadorCounts.set(indicadorKey, currentCount + 1);
                
                // Actualizar suma y contador por estudiante
                const estudianteKey = `${indicador.id_padre}-${detalle.id_alumno}`;
                const estudianteSum = competenciaData.estudiantes.get(detalle.id_alumno) || 0;
                const estudianteCount = estudianteCounts.get(estudianteKey) || 0;
                competenciaData.estudiantes.set(detalle.id_alumno, estudianteSum + nivelLogro);
                estudianteCounts.set(estudianteKey, estudianteCount + 1);
            });
            
            // Calcular promedios finales
            const competenciasConDatos = Array.from(competenciasMap.values()).map(compData => {
                const indicadoresPromedios = Array.from(compData.promedios.entries()).map(([idInd, sum]) => {
                    const indicadorKey = `${compData.competencia.id_indicador}-${idInd}`;
                    const count = indicadorCounts.get(indicadorKey) || 0;
                    return {
                        id_indicador: idInd,
                        indicador: compData.indicadores.find(ind => ind.id_indicador === idInd),
                        promedio: count > 0 ? sum / count : 0,
                        totalEvaluaciones: count
                    };
                });
                
                const estudiantesPromedios = Array.from(compData.estudiantes.entries()).map(([idAlumno, sum]) => {
                    const estudiante = alumnos.find(a => a.id_alumno === idAlumno);
                    const estudianteKey = `${compData.competencia.id_indicador}-${idAlumno}`;
                    const count = estudianteCounts.get(estudianteKey) || 0;
                    return {
                        id_alumno: idAlumno,
                        nombre: estudiante ? `${estudiante.apellidos}, ${estudiante.nombres}` : 'Desconocido',
                        promedio: count > 0 ? sum / count : 0
                    };
                });
                
                const promedioGeneral = indicadoresPromedios.length > 0
                    ? indicadoresPromedios.reduce((sum, ind) => sum + ind.promedio, 0) / indicadoresPromedios.length
                    : 0;
                
                return {
                    ...compData,
                    indicadoresPromedios,
                    estudiantesPromedios,
                    promedioGeneral
                };
            });
            
            // Identificar fortalezas y debilidades
            const fortalezas = competenciasConDatos
                .filter(c => c.promedioGeneral >= 4)
                .sort((a, b) => b.promedioGeneral - a.promedioGeneral);
            
            const debilidades = competenciasConDatos
                .filter(c => c.promedioGeneral < 3 && c.promedioGeneral > 0)
                .sort((a, b) => a.promedioGeneral - b.promedioGeneral);
            
            // Crear datos para heatmap (competencia x estudiante)
            const heatmapData: any[] = [];
            const estudiantesIds = new Set(allDetalles.map(d => d.id_alumno));
            
            competenciasConDatos.forEach(compData => {
                estudiantesIds.forEach(idAlumno => {
                    const estudianteData = compData.estudiantesPromedios.find(e => e.id_alumno === idAlumno);
                    const estudiante = alumnos.find(a => a.id_alumno === idAlumno);
                    heatmapData.push({
                        competencia: compData.competencia.descripcion,
                        estudiante: estudiante ? `${estudiante.apellidos}, ${estudiante.nombres}` : 'Desconocido',
                        nivel: estudianteData?.promedio || 0
                    });
                });
            });
            
            // Progreso por competencia (a lo largo del tiempo)
            const progresoPorCompetencia: any[] = [];
            const evaluaciones = ['I Mensual', 'II Mensual', 'III Mensual', 'Seguimiento Pedagógico'];
            
            competenciasConDatos.forEach(compData => {
                const progreso: any[] = [];
                evaluaciones.forEach(evalType => {
                    const minutasEval = minutasFiltradas.filter(m => m.evaluacion === evalType);
                    let promedioEval = 0;
                    let count = 0;
                    
                    minutasEval.forEach(minuta => {
                        const detallesEval = allDetalles.filter(d => {
                            const indicador = indicadoresMap.get(d.id_indicador);
                            return indicador?.id_padre === compData.competencia.id_indicador;
                        });
                        detallesEval.forEach(detalle => {
                            const nivel = typeof detalle.nivel_logro === 'string' 
                                ? parseFloat(detalle.nivel_logro) 
                                : (detalle.nivel_logro as any);
                            if (!isNaN(nivel) && nivel >= 1 && nivel <= 5) {
                                promedioEval += nivel;
                                count++;
                            }
                        });
                    });
                    
                    if (count > 0) {
                        progreso.push({
                            evaluacion: evalType,
                            promedio: promedioEval / count
                        });
                    }
                });
                
                if (progreso.length > 0) {
                    progresoPorCompetencia.push({
                        competencia: compData.competencia.descripcion,
                        progreso
                    });
                }
            });
            
            setCompetenciasData({
                competencias: competenciasConDatos,
                fortalezas,
                debilidades,
                heatmapData,
                progresoPorCompetencia,
                totalCompetencias: competenciasConDatos.length,
                totalIndicadores: indicadores.length
            });
        } catch (error) {
            console.error('Error loading competencias data:', error);
            setCompetenciasData(null);
        } finally {
            setIsLoadingCompetencias(false);
        }
    };

    // Cargar datos cuando cambien los filtros
    useEffect(() => {
        if (progressFilters.grado && progressFilters.lapso) {
            loadProgressData();
            loadRiskData();
            loadEficaciaData();
            loadCompetenciasData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progressFilters.grado, progressFilters.lapso, progressFilters.ano_escolar, progressFilters.materia]);

    // Preparar datos para gráficos (fuera de la función para poder usar useMemo)
    const evaluaciones = ['I Mensual', 'II Mensual', 'III Mensual', 'Seguimiento Pedagógico'];
    
    // Extraer materias reales de los datos
    const materiasDisponibles = useMemo(() => {
        if (!progressData) return [];
        const materiasSet = new Set<string>();
        Object.keys(progressData).forEach(evalType => {
            if (progressData[evalType]) {
                Object.keys(progressData[evalType]).forEach(materia => {
                    materiasSet.add(materia);
                });
            }
        });
        return Array.from(materiasSet).sort();
    }, [progressData]);
    
    // Función para categorizar materias por tipo
    const categorizarMateria = (materia: string): 'Lengua' | 'Inglés' | 'Matemáticas' | 'Otra' => {
        const materiaLower = materia.toLowerCase();
        if (materiaLower.includes('lengua') || materiaLower.includes('lenguaje') || materiaLower.includes('lengua ac')) {
            return 'Lengua';
        }
        if (materiaLower.includes('inglés') || materiaLower.includes('ingles') || materiaLower.includes('use of english')) {
            return 'Inglés';
        }
        if (materiaLower.includes('matemática') || materiaLower.includes('matematicas') || materiaLower.includes('matemáticas ac')) {
            return 'Matemáticas';
        }
        return 'Otra';
    };
    
    const timelineData = useMemo(() => {
        try {
            if (!progressData) return [];
            
            const data: any[] = [];
            
            // Usar las materias reales de los datos
            materiasDisponibles.forEach(materia => {
                evaluaciones.forEach(evalType => {
                    if (progressData[evalType] && progressData[evalType][materia]) {
                        const info = progressData[evalType][materia];
                        data.push({
                            evaluacion: evalType,
                            materia: materia,
                            categoria: categorizarMateria(materia),
                            promedio: info.promedio || 0,
                            aprobados: info.aprobados || 0,
                            reprobados: info.reprobados || 0,
                            totalEstudiantes: info.totalEstudiantes || 0
                        });
                    }
                });
            });
            
            return data;
        } catch (error) {
            console.error('Error calculating timelineData:', error);
            return [];
        }
    }, [progressData, materiasDisponibles]);
    
    // Calcular KPIs (fuera de la función para poder usar useMemo)
    const kpis = useMemo(() => {
        try {
            if (!progressData) {
                return {
                    promedioLapso: 'SE',
                    promedioLapsoNum: '0.00',
                    tasaMejora: '0.0',
                    tasaAprobacion: '0.0',
                    estudiantesEnRiesgo: 0
                };
            }
            
            // Si no hay materia seleccionada (o es "all"), calcular promedios generales
            if (!progressFilters.materia || progressFilters.materia === 'all') {
                let totalPromedio = 0;
                let count = 0;
                let totalAprobados = 0;
                let totalEstudiantes = 0;
                
                materias.forEach(materia => {
                    evaluaciones.forEach(evalType => {
                        if (progressData[evalType] && progressData[evalType][materia]) {
                            const info = progressData[evalType][materia];
                            totalPromedio += info.promedio || 0;
                            count++;
                            totalAprobados += info.aprobados || 0;
                            totalEstudiantes += info.totalEstudiantes || 0;
                        }
                    });
                });
                
                const promedioGeneral = count > 0 ? totalPromedio / count : 0;
                const tasaAprobacion = totalEstudiantes > 0 
                    ? (totalAprobados / totalEstudiantes) * 100 
                    : 0;
                
                return {
                    promedioLapso: convertNumberToLetter(promedioGeneral),
                    promedioLapsoNum: promedioGeneral.toFixed(2),
                    tasaMejora: '0.0',
                    tasaAprobacion: tasaAprobacion.toFixed(1),
                    estudiantesEnRiesgo: 0
                };
            }
            
            // Promedio del lapso (última evaluación disponible)
            let promedioLapso = 0;
            let primeraEvaluacion = null;
            let ultimaEvaluacion = null;
            
            for (const evalType of [...evaluaciones].reverse()) {
                if (progressData[evalType] && progressData[evalType][progressFilters.materia]) {
                    if (!ultimaEvaluacion) {
                        ultimaEvaluacion = progressData[evalType][progressFilters.materia].promedio;
                    }
                }
            }
            
            for (const evalType of evaluaciones) {
                if (progressData[evalType] && progressData[evalType][progressFilters.materia]) {
                    if (!primeraEvaluacion) {
                        primeraEvaluacion = progressData[evalType][progressFilters.materia].promedio;
                    }
                }
            }
            
            promedioLapso = ultimaEvaluacion || 0;
            const tasaMejora = primeraEvaluacion && ultimaEvaluacion 
                ? ((ultimaEvaluacion - primeraEvaluacion) / primeraEvaluacion) * 100 
                : 0;
            
            // Tasa de aprobación (última evaluación)
            let totalAprobados = 0;
            let totalEstudiantes = 0;
            for (const evalType of evaluaciones) {
                if (progressData[evalType] && progressData[evalType][progressFilters.materia]) {
                    totalAprobados += progressData[evalType][progressFilters.materia].aprobados || 0;
                    totalEstudiantes += progressData[evalType][progressFilters.materia].totalEstudiantes || 0;
                }
            }
            const tasaAprobacion = totalEstudiantes > 0 
                ? (totalAprobados / totalEstudiantes) * 100 
                : 0;
            
            return {
                promedioLapso: convertNumberToLetter(promedioLapso),
                promedioLapsoNum: promedioLapso.toFixed(2),
                tasaMejora: tasaMejora.toFixed(1),
                tasaAprobacion: tasaAprobacion.toFixed(1),
                estudiantesEnRiesgo: riskData?.estudiantesEnRiesgo?.length || 0
            };
        } catch (error) {
            console.error('Error calculating KPIs:', error);
            return {
                promedioLapso: 'SE',
                promedioLapsoNum: '0.00',
                tasaMejora: '0.0',
                tasaAprobacion: '0.0',
                estudiantesEnRiesgo: riskData?.estudiantesEnRiesgo?.length || 0
            };
        }
    }, [progressData, progressFilters.materia, riskData]);

    const renderNewMeetingForm = () => {
        const advancedAnalytics = calculateAdvancedAnalytics(Array.from(studentEvals.values()));

        return (
            <div className="space-y-8">
                {/* Section 1: Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Contexto de la Reunión</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <InputField as="select" label="Año Escolar" name="ano_escolar" value={filters.ano_escolar} onChange={handleFilterChange}>
                                {ANOS_ESCOLARES.map(ano => (
                                    <option key={ano} value={ano}>{ano}</option>
                                ))}
                            </InputField>
                            <InputField as="select" label="Lapso" name="lapso" value={filters.lapso} onChange={handleFilterChange}>
                                <option value="I Lapso">I Lapso</option>
                                <option value="II Lapso">II Lapso</option>
                                <option value="III Lapso">III Lapso</option>
                            </InputField>
                            <InputField as="select" label="Evaluación" name="evaluacion" value={filters.evaluacion} onChange={handleFilterChange}>
                                <option value="I Mensual">I Mensual</option>
                                <option value="II Mensual">II Mensual</option>
                                <option value="Examen de Lapso">Examen de Lapso</option>
                            </InputField>
                            <InputField as="select" label="Grado" name="grado" value={filters.grado} onChange={handleFilterChange}>
                                <option value="">Seleccione un grado</option>
                                {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                            </InputField>
                            <InputField as="select" label="Materia" name="materia" value={filters.materia} onChange={handleFilterChange} disabled={!filters.grado}>
                                <option value="">Seleccione una materia</option>
                                {availableSubjects
                                    .filter(s => s.nombre_materia && s.nombre_materia.trim() !== '') // Filtrar materias vacías
                                    .map(s => <option key={s.id_clase} value={s.nombre_materia}>{s.nombre_materia}</option>)}
                            </InputField>
                        </div>
                    </CardContent>
                </Card>

                {isFormReady && studentsInGrade && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Carga de Datos de Evaluación</CardTitle>
                        </CardHeader>
                        <CardContent>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3">Alumno</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nota</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Adaptación</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/2">Observaciones</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background divide-y divide-border">
                                        {(studentsInGrade || []).map(student => {
                                            const evalData = studentEvals.get(student.id_alumno) || { nota: '', adaptacion: '', observaciones: '' };
                                            return (
                                                <React.Fragment key={student.id_alumno}>
                                                    <tr className="hover:bg-muted/50">
                                                        <td className="px-4 py-2 whitespace-nowrap font-medium">{student.apellidos}, {student.nombres}</td>
                                                        <td className="px-4 py-2">
                                                            <Select
                                                                value={evalData.nota || undefined}
                                                                onValueChange={(value) => handleStudentEvalChange(student.id_alumno, 'nota', value === 'none' ? '' : value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Seleccionar nota" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Sin nota</SelectItem>
                                                                    <SelectItem value="A">A</SelectItem>
                                                                    <SelectItem value="B">B</SelectItem>
                                                                    <SelectItem value="C">C</SelectItem>
                                                                    <SelectItem value="D">D</SelectItem>
                                                                    <SelectItem value="E">E</SelectItem>
                                                                    <SelectItem value="SE">SE</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <Select
                                                                value={evalData.adaptacion || undefined}
                                                                onValueChange={(value) => handleStudentEvalChange(student.id_alumno, 'adaptacion', value === 'none' ? '' : value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Seleccionar adaptación" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Sin adaptación</SelectItem>
                                                                    <SelectItem value="Reg">Reg</SelectItem>
                                                                    <SelectItem value="AC+">AC+</SelectItem>
                                                                    <SelectItem value="AC-">AC-</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <Input
                                                                type="text"
                                                                value={evalData.observaciones}
                                                                onChange={e => handleStudentEvalChange(student.id_alumno, 'observaciones', e.target.value)}
                                                                placeholder="Observaciones..."
                                                            />
                                                        </td>
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
                                                    </tr>
                                                    {expandedStudents.has(student.id_alumno) && indicadoresDisponibles.length > 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="bg-muted/30">
                                                                <div className="p-6 space-y-4">
                                                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                                                        <span className="text-primary">📊</span>
                                                                        Evaluación Detallada: {student.nombres} {student.apellidos}
                                                                    </h4>

                                                                    {/* Pedagogical Intelligence Inputs */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Inasistencias (Cant.)</Label>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                placeholder="Ej. 3"
                                                                                value={evalData.inasistencias !== undefined ? evalData.inasistencias : ''}
                                                                                onChange={(e) => handleStudentEvalChange(student.id_alumno, 'inasistencias', parseInt(e.target.value) || 0)}
                                                                                className="bg-white"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Nivel de Independencia</Label>
                                                                            <Select
                                                                                value={evalData.nivel_independencia}
                                                                                onValueChange={(val) => handleStudentEvalChange(student.id_alumno, 'nivel_independencia', val)}
                                                                            >
                                                                                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Autónomo">Autónomo</SelectItem>
                                                                                    <SelectItem value="Apoyo Parcial">Apoyo Parcial</SelectItem>
                                                                                    <SelectItem value="Apoyo Constante">Apoyo Constante</SelectItem>
                                                                                    <SelectItem value="No Logrado">No Logrado</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Estado Emocional</Label>
                                                                            <Select
                                                                                value={evalData.estado_emocional}
                                                                                onValueChange={(val) => handleStudentEvalChange(student.id_alumno, 'estado_emocional', val)}
                                                                            >
                                                                                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Enfocado">Enfocado</SelectItem>
                                                                                    <SelectItem value="Participativo">Participativo</SelectItem>
                                                                                    <SelectItem value="Ansioso/Nervioso">Ansioso/Nervioso</SelectItem>
                                                                                    <SelectItem value="Distraído">Distraído</SelectItem>
                                                                                    <SelectItem value="Apatía/Desinterés">Apatía/Desinterés</SelectItem>
                                                                                    <SelectItem value="Cansado">Cansado</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Eficacia Acción Anterior</Label>
                                                                            <Select
                                                                                value={evalData.eficacia_accion_anterior}
                                                                                onValueChange={(val) => handleStudentEvalChange(student.id_alumno, 'eficacia_accion_anterior', val)}
                                                                            >
                                                                                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Resuelto">Resuelto</SelectItem>
                                                                                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                                                                                    <SelectItem value="Ineficaz">Ineficaz</SelectItem>
                                                                                    <SelectItem value="No Aplica">No Aplica</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="border rounded-lg p-4 bg-background">
                                                                        <div className="flex justify-between items-center mb-4">
                                                                            <p className="text-sm text-muted-foreground">
                                                                                Selecciona los indicadores a evaluar y califícalos (A-E):
                                                                            </p>

                                                                            {/* Indicator Selector Dropdown */}
                                                                            <Select onValueChange={(val) => toggleIndicatorSelection(student.id_alumno, val)}>
                                                                                <SelectTrigger className="w-[300px]">
                                                                                    <SelectValue placeholder="➕ Agregar Indicador a Evaluar" />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="max-h-[300px]">
                                                                                    {Object.entries(groupedIndicators.groups).flatMap(([rutina, competencies]) =>
                                                                                        Object.entries(competencies).flatMap(([compId, indicators]) =>
                                                                                            indicators.map(ind => (
                                                                                                <SelectItem
                                                                                                    key={ind.id_indicador}
                                                                                                    value={ind.id_indicador}
                                                                                                    disabled={selectedIndicators.get(student.id_alumno)?.has(ind.id_indicador)}
                                                                                                >
                                                                                                    {ind.descripcion.substring(0, 50)}...
                                                                                                </SelectItem>
                                                                                            ))
                                                                                        )
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {Object.entries(groupedIndicators.groups).map(([rutina, competencies]) => (
                                                                                <div key={rutina}>
                                                                                    {Object.entries(competencies).map(([compId, indicators]) => {
                                                                                        // Filter indicators: only show selected ones
                                                                                        const studentSelectedSet = selectedIndicators.get(student.id_alumno);
                                                                                        const visibleIndicators = indicators.filter(ind => studentSelectedSet?.has(ind.id_indicador));

                                                                                        if (visibleIndicators.length === 0) return null;

                                                                                        const competency = groupedIndicators.competencyMap.get(compId);
                                                                                        return (
                                                                                            <div key={compId} className="mb-4 ml-2">
                                                                                                {competency && (
                                                                                                    <div className="mb-2 pl-2 border-l-2 border-gray-300">
                                                                                                        <h5 className="font-semibold text-sm text-gray-700 italic">{competency.descripcion}</h5>
                                                                                                    </div>
                                                                                                )}

                                                                                                <div className="space-y-2 pl-4">
                                                                                                    {visibleIndicators.map((indicador, idx) => {
                                                                                                        const currentValue = detallesIndicadores.get(student.id_alumno)?.get(indicador.id_indicador) || '';

                                                                                                        return (
                                                                                                            <div key={indicador.id_indicador} className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded border border-transparent hover:border-gray-200 transition-colors">
                                                                                                                <Button
                                                                                                                    variant="ghost"
                                                                                                                    size="icon"
                                                                                                                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                                                                    onClick={() => toggleIndicatorSelection(student.id_alumno, indicador.id_indicador)}
                                                                                                                    title="Remover indicador"
                                                                                                                >
                                                                                                                    ✕
                                                                                                                </Button>

                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                    <p className="text-sm font-medium">{indicador.descripcion}</p>
                                                                                                                </div>

                                                                                                                <div className="flex gap-1">
                                                                                                                    {['A', 'B', 'C', 'D', 'E'].map(nivel => (
                                                                                                                        <button
                                                                                                                            key={nivel}
                                                                                                                            type="button"
                                                                                                                            onClick={() => handleIndicadorChange(student.id_alumno, indicador.id_indicador, nivel)}
                                                                                                                            className={`w-8 h-8 rounded-md border text-sm font-bold transition-all ${currentValue === nivel
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
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            ))}

                                                                            {(!selectedIndicators.get(student.id_alumno) || selectedIndicators.get(student.id_alumno)?.size === 0) && (
                                                                                <div className="text-center p-8 text-muted-foreground italic border-2 border-dashed rounded-lg">
                                                                                    No has seleccionado indicadores para evaluar. <br />
                                                                                    Usa el selector arriba para agregar indicadores del banco.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <GradeChart data={liveGradeDistribution} />

                            <div className="mt-8 border-t pt-6">
                                <h3 className="text-xl font-bold mb-4">Análisis Gráfico Avanzado</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <EnhancedPieChart title="Estudiantes por Adaptación" data={advancedAnalytics.adaptationCounts} colors={adaptationColors} />
                                    <EnhancedPieChart title="Porcentaje Global de Notas" data={advancedAnalytics.overallGradeCounts} colors={gradeColors} />
                                </div>
                                <AdaptationGradeDistributionCharts data={advancedAnalytics.gradeDistributionByAdaptation as any} />

                                {/* Phase 2: Pedagogical Intelligence Dashboard */}
                                <PedagogicalDashboard
                                    students={alumnos}
                                    studentEvals={studentEvals}
                                    detallesIndicadores={detallesIndicadores}
                                    indicators={indicadoresDisponibles}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}



                {isFormReady && (
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Análisis Pedagógico Asistido por IA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleGenerateAnalysis}
                                disabled={isLoading || studentEvals.size === 0}
                                className="w-full"
                                size="lg"
                            >
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                {isLoading ? 'Analizando datos...' : 'Generar Análisis Pedagógico con IA'}
                            </Button>
                            {isLoading && <div className="text-center mt-4">La IA está procesando la información, esto puede tardar unos segundos...</div>}

                            {aiAnalysis.length > 0 && (
                                <div className="mt-6">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-border">
                                            <thead className="bg-muted">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dificultad Detectada</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Frec.</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estudiantes</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3">Acciones Sugeridas</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-background divide-y divide-border">
                                                {(aiAnalysis || []).map((item, index) => (
                                                    <tr key={index} className="hover:bg-muted/50">
                                                        <td className="px-4 py-2 align-top font-medium">{item.dificultad}</td>
                                                        <td className="px-4 py-2 align-top">
                                                            <Badge variant={item.categoria === 'Académico' ? 'default' : 'secondary'}>
                                                                {item.categoria}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-2 align-top text-center">{item.frecuencia}</td>
                                                        <td className="px-4 py-2 align-top text-sm">{item.estudiantes}</td>
                                                        <td className="px-4 py-2 align-top">
                                                            <Textarea
                                                                value={item.accionesSugeridas}
                                                                onChange={(e) => handleAiActionChange(index, e.target.value)}
                                                                rows={4}
                                                                className="w-full"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button onClick={handleSaveMinuta} size="lg">
                                            Guardar Minuta de Reunión
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }


    // Función para eliminar minuta
    const handleDeleteMinuta = async (idMinuta: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta minuta del historial? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await minutasService.delete(idMinuta);
            // Actualizar la lista de minutas
            const updatedMinutas = await minutasService.getAll();
            setMinutas(updatedMinutas);
            // Si la minuta eliminada estaba seleccionada, limpiar la selección
            if (selectedMinuta?.id_minuta === idMinuta) {
                setSelectedMinuta(null);
            }
        } catch (error) {
            console.error('Error al eliminar minuta:', error);
            alert('Error al eliminar la minuta. Por favor, intenta nuevamente.');
        }
    };

    // Verificar si el usuario puede eliminar minutas (solo coordinadores y directivos)
    const canDeleteMinutas = currentUser?.role === 'coordinador' || currentUser?.role === 'directivo';

    const renderHistoryView = () => {
        if (selectedMinuta) {
            const advancedAnalytics = calculateAdvancedAnalytics(selectedMinuta.datos_alumnos);
            return (
                <Card className="space-y-8">
                    <CardContent className="pt-6">
                        <Button
                            onClick={() => setSelectedMinuta(null)}
                            variant="ghost"
                            className="mb-4"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Volver al Historial
                        </Button>

                        {/* Minuta Context */}
                        <div>
                            <h2 className="text-2xl font-bold text-text-main mb-2">Detalle de la Minuta</h2>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-600">
                                <span><strong>Grado:</strong> {selectedMinuta.grado}</span>
                                <span><strong>Materia:</strong> {selectedMinuta.materia}</span>
                                <span><strong>Evaluación:</strong> {selectedMinuta.evaluacion}</span>
                                <span><strong>Lapso:</strong> {selectedMinuta.lapso}</span>
                                <span><strong>Año Escolar:</strong> {selectedMinuta.ano_escolar}</span>
                                <span><strong>Fecha:</strong> {new Date(selectedMinuta.fecha_creacion).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Student Data */}
                        <div>
                            <h3 className="text-xl font-bold text-text-main mb-4">Datos de Evaluación Registrados</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3">Alumno</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Nota</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Adaptación</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/2">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background divide-y divide-border">
                                        {(selectedMinuta.datos_alumnos || []).map(evalData => {
                                            const student = alumnos.find(a => a.id_alumno === evalData.id_alumno);
                                            return (
                                                <tr key={evalData.id_alumno} className="hover:bg-muted/50">
                                                    <td className="px-4 py-2 whitespace-nowrap font-medium">{student ? `${student.apellidos}, ${student.nombres}` : 'Alumno no encontrado'}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        {evalData.nota ? (
                                                            <GradeBadge nota={evalData.nota} />
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {evalData.adaptacion ? (
                                                            <Badge variant="outline">{evalData.adaptacion}</Badge>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">{evalData.observaciones || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <GradeChart data={calculateGradeDistribution(selectedMinuta.datos_alumnos)} />
                            <div className="mt-8 border-t pt-6">
                                <h3 className="text-xl font-bold text-text-main mb-4">Análisis Gráfico Avanzado</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <EnhancedPieChart title="Estudiantes por Adaptación" data={advancedAnalytics.adaptationCounts} colors={adaptationColors} />
                                    <EnhancedPieChart title="Porcentaje Global de Notas" data={advancedAnalytics.overallGradeCounts} colors={gradeColors} />
                                </div>
                                <AdaptationGradeDistributionCharts data={advancedAnalytics.gradeDistributionByAdaptation as any} />
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div>
                            <h3 className="text-xl font-bold text-text-main mb-4">Análisis Pedagógico de IA</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dificultad Detectada</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Frec.</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estudiantes</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3">Acciones Sugeridas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background divide-y divide-border">
                                        {(selectedMinuta.analisis_ia || []).map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/50">
                                                <td className="px-4 py-2 align-top font-medium">{item.dificultad}</td>
                                                <td className="px-4 py-2 align-top">
                                                    <Badge variant={item.categoria === 'Académico' ? 'default' : 'secondary'}>
                                                        {item.categoria}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2 align-top text-center">{item.frecuencia}</td>
                                                <td className="px-4 py-2 align-top text-sm">{item.estudiantes}</td>
                                                <td className="px-4 py-2 align-top text-sm whitespace-pre-wrap">{item.accionesSugeridas}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Minutas de Reunión</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {minutas.length > 0 ? (
                            minutas
                                .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
                                .map(minuta => (
                                    <Card key={minuta.id_minuta} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex justify-between items-center gap-2">
                                            <div className="flex-1">
                                                <p className="font-bold">{minuta.grado} - {minuta.materia}</p>
                                                <p className="text-sm text-muted-foreground">{minuta.evaluacion} ({minuta.lapso})</p>
                                                <p className="text-xs text-muted-foreground">Fecha: {new Date(minuta.fecha_creacion).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => setSelectedMinuta(minuta)}
                                                    variant="outline"
                                                >
                                                    Ver Detalles
                                                </Button>
                                                {canDeleteMinutas && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteMinuta(minuta.id_minuta)}
                                                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        title="Eliminar minuta"
                                                    >
                                                        <DeleteIcon className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No hay minutas guardadas todavía.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };
    const renderProgressView = () => {
        try {
            console.log('🔍 renderProgressView called', {
                progressFilters,
                progressData: progressData ? 'exists' : 'null',
                timelineDataLength: timelineData?.length || 0,
                isLoadingProgress
            });
            
            // Calcular datos de análisis de tendencias (fuera del JSX)
            let tendenciasData: any = null;
            if (progressFilters.materia && progressFilters.materia !== 'all' && timelineData.length > 0) {
                try {
                    // Si se selecciona una materia específica, usar esa materia
                    // Si se selecciona una categoría (Lengua, Inglés, Matemáticas), agrupar todas las materias de esa categoría
                    let materiaData: any[] = [];
                    const categoria = categorizarMateria(progressFilters.materia);
                    
                    if (categoria !== 'Otra' && progressFilters.materia === categoria) {
                        // Si se selecciona la categoría completa, agrupar todas las materias de esa categoría
                        const materiasCategoria = materiasDisponibles.filter(m => categorizarMateria(m) === categoria);
                        materiaData = timelineData.filter(d => materiasCategoria.includes(d.materia));
                        // Agrupar por evaluación y calcular promedio
                        const dataByEval: Record<string, any[]> = {};
                        materiaData.forEach(d => {
                            if (!dataByEval[d.evaluacion]) dataByEval[d.evaluacion] = [];
                            dataByEval[d.evaluacion].push(d);
                        });
                        materiaData = Object.keys(dataByEval).map(evalType => {
                            const datos = dataByEval[evalType];
                            return {
                                evaluacion: evalType,
                                materia: categoria,
                                promedio: datos.reduce((sum, d) => sum + d.promedio, 0) / datos.length,
                                aprobados: datos.reduce((sum, d) => sum + d.aprobados, 0),
                                reprobados: datos.reduce((sum, d) => sum + d.reprobados, 0),
                                totalEstudiantes: datos.reduce((sum, d) => sum + d.totalEstudiantes, 0)
                            };
                        });
                    } else {
                        // Materia específica
                        materiaData = timelineData.filter(d => d.materia === progressFilters.materia);
                    }
                    
                    if (materiaData.length > 0) {
                        const regressionData = materiaData
                            .map((d) => ({
                                x: evaluaciones.indexOf(d.evaluacion) + 1,
                                y: d.promedio,
                                evaluacion: d.evaluacion
                            }))
                            .filter(d => d.y > 0);
                        
                        const regression = regressionData.length >= 2 ? calculateLinearRegression(regressionData) : { slope: 0, intercept: 0, r2: 0 };
                        
                        const promedios = materiaData.map(d => d.promedio).filter(p => p > 0);
                        const primeraNota = promedios[0] || 0;
                        const ultimaNota = promedios[promedios.length - 1] || 0;
                        const tasaCambio = primeraNota > 0 ? ((ultimaNota - primeraNota) / primeraNota) * 100 : 0;
                        const estabilidad = promedios.length > 0 ? calculateStandardDeviation(promedios) : 0;
                        
                        const primeraEval = materiaData.find(d => d.evaluacion === 'I Mensual');
                        const ultimaEval = materiaData.find(d => d.evaluacion === 'III Mensual' || d.evaluacion === 'Seguimiento Pedagógico');
                        const reprobadosInicial = primeraEval?.reprobados || 0;
                        const reprobadosFinal = ultimaEval?.reprobados || 0;
                        const tasaRecuperacion = reprobadosInicial > 0 
                            ? ((reprobadosInicial - reprobadosFinal) / reprobadosInicial) * 100 
                            : 0;
                        
                        const chartData = materiaData.map(d => ({
                            evaluacion: d.evaluacion,
                            promedio: d.promedio,
                            aprobados: d.aprobados,
                            reprobados: d.reprobados,
                            totalEstudiantes: d.totalEstudiantes,
                            tendencia: regression.intercept + regression.slope * (evaluaciones.indexOf(d.evaluacion) + 1)
                        }));
                        
                        tendenciasData = {
                            regression,
                            tasaCambio,
                            primeraNota,
                            ultimaNota,
                            estabilidad,
                            tasaRecuperacion,
                            reprobadosInicial,
                            reprobadosFinal,
                            chartData
                        };
                    }
                } catch (error) {
                    console.error('Error calculating tendencias data:', error);
                }
            }
            
            // Calcular datos de análisis comparativo (fuera del JSX)
            let comparativoData: any = null;
            if ((!progressFilters.materia || progressFilters.materia === 'all') && timelineData.length > 0) {
                try {
                    // Agrupar materias por categoría y calcular promedios
                    const materiasLengua = materiasDisponibles.filter(m => categorizarMateria(m) === 'Lengua');
                    const materiasIngles = materiasDisponibles.filter(m => categorizarMateria(m) === 'Inglés');
                    const materiasMatematicas = materiasDisponibles.filter(m => categorizarMateria(m) === 'Matemáticas');
                    
                    const promediosLengua = evaluaciones.map(e => {
                        const datosLengua = timelineData.filter(t => t.evaluacion === e && materiasLengua.includes(t.materia));
                        if (datosLengua.length === 0) return 0;
                        const suma = datosLengua.reduce((acc, d) => acc + d.promedio, 0);
                        return suma / datosLengua.length;
                    }).filter(p => p > 0);
                    
                    const promediosIngles = evaluaciones.map(e => {
                        const datosIngles = timelineData.filter(t => t.evaluacion === e && materiasIngles.includes(t.materia));
                        if (datosIngles.length === 0) return 0;
                        const suma = datosIngles.reduce((acc, d) => acc + d.promedio, 0);
                        return suma / datosIngles.length;
                    }).filter(p => p > 0);
                    
                    const promediosMatematicas = evaluaciones.map(e => {
                        const datosMatematicas = timelineData.filter(t => t.evaluacion === e && materiasMatematicas.includes(t.materia));
                        if (datosMatematicas.length === 0) return 0;
                        const suma = datosMatematicas.reduce((acc, d) => acc + d.promedio, 0);
                        return suma / datosMatematicas.length;
                    }).filter(p => p > 0);
                    
                    const calcularConsistencia = (notas: number[]) => {
                        if (notas.length < 2) return 0;
                        const desvStd = calculateStandardDeviation(notas);
                        const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
                        return promedio > 0 ? (1 - (desvStd / promedio)) * 100 : 0;
                    };
                    
                    const correlacionLenguaIngles = promediosLengua.length > 0 && promediosIngles.length > 0 
                        ? calculatePearsonCorrelation(promediosLengua, promediosIngles) 
                        : 0;
                    const correlacionLenguaMatematicas = promediosLengua.length > 0 && promediosMatematicas.length > 0
                        ? calculatePearsonCorrelation(promediosLengua, promediosMatematicas)
                        : 0;
                    const correlacionInglesMatematicas = promediosIngles.length > 0 && promediosMatematicas.length > 0
                        ? calculatePearsonCorrelation(promediosIngles, promediosMatematicas)
                        : 0;
                    
                    const consistenciaLengua = calcularConsistencia(promediosLengua);
                    const consistenciaIngles = calcularConsistencia(promediosIngles);
                    const consistenciaMatematicas = calcularConsistencia(promediosMatematicas);
                    
                    const promedioLengua = promediosLengua.length > 0 ? promediosLengua.reduce((a, b) => a + b, 0) / promediosLengua.length : 0;
                    const promedioIngles = promediosIngles.length > 0 ? promediosIngles.reduce((a, b) => a + b, 0) / promediosIngles.length : 0;
                    const promedioMatematicas = promediosMatematicas.length > 0 ? promediosMatematicas.reduce((a, b) => a + b, 0) / promediosMatematicas.length : 0;
                    
                    const promedios = [
                        { materia: 'Lengua', promedio: promedioLengua },
                        { materia: 'Inglés', promedio: promedioIngles },
                        { materia: 'Matemáticas', promedio: promedioMatematicas }
                    ];
                    
                    const materiaMasDesafiante = promedios.reduce((min, curr) => 
                        curr.promedio < min.promedio ? curr : min
                    );
                    
                    const chartData = evaluaciones.map(evalType => {
                        const datosLengua = timelineData.filter(d => d.evaluacion === evalType && materiasLengua.includes(d.materia));
                        const datosIngles = timelineData.filter(d => d.evaluacion === evalType && materiasIngles.includes(d.materia));
                        const datosMatematicas = timelineData.filter(d => d.evaluacion === evalType && materiasMatematicas.includes(d.materia));
                        
                        const promedioLengua = datosLengua.length > 0 
                            ? datosLengua.reduce((acc, d) => acc + d.promedio, 0) / datosLengua.length 
                            : 0;
                        const promedioIngles = datosIngles.length > 0 
                            ? datosIngles.reduce((acc, d) => acc + d.promedio, 0) / datosIngles.length 
                            : 0;
                        const promedioMatematicas = datosMatematicas.length > 0 
                            ? datosMatematicas.reduce((acc, d) => acc + d.promedio, 0) / datosMatematicas.length 
                            : 0;
                        
                        return {
                            evaluacion: evalType,
                            Lengua: promedioLengua,
                            Inglés: promedioIngles,
                            Matemáticas: promedioMatematicas
                        };
                    }).filter(d => d.Lengua > 0 || d.Inglés > 0 || d.Matemáticas > 0);
                    
                    comparativoData = {
                        correlacionLenguaIngles,
                        correlacionLenguaMatematicas,
                        correlacionInglesMatematicas,
                        consistenciaLengua,
                        consistenciaIngles,
                        consistenciaMatematicas,
                        materiaMasDesafiante,
                        chartData
                    };
                } catch (error) {
                    console.error('Error calculating comparativo data:', error);
                }
            }
            
            // Calcular datos de cohortes (fuera del JSX)
            let cohortesData: any = null;
            if (progressFilters.materia && progressFilters.materia !== 'all' && timelineData.length > 0 && progressData) {
                try {
                    const estudiantesMap = new Map<string, {
                        id: string;
                        nombre: string;
                        notas: number[];
                        primeraNota: number;
                        ultimaNota: number;
                        cambio: number;
                        promedio: number;
                        estabilidad: number;
                        tendencia: 'mejora' | 'estable' | 'deterioro';
                    }>();
                    
                    evaluaciones.forEach(evalType => {
                        if (progressData[evalType] && progressData[evalType][progressFilters.materia]) {
                            const datos = progressData[evalType][progressFilters.materia].datos || [];
                            datos.forEach((d: any) => {
                                if (!estudiantesMap.has(d.id_alumno)) {
                                    const estudiante = alumnos.find(a => a.id_alumno === d.id_alumno);
                                    estudiantesMap.set(d.id_alumno, {
                                        id: d.id_alumno,
                                        nombre: estudiante ? `${estudiante.apellidos}, ${estudiante.nombres}` : 'Desconocido',
                                        notas: [],
                                        primeraNota: 0,
                                        ultimaNota: 0,
                                        cambio: 0,
                                        promedio: 0,
                                        estabilidad: 0,
                                        tendencia: 'estable'
                                    });
                                }
                                const estudiante = estudiantesMap.get(d.id_alumno)!;
                                estudiante.notas.push(d.notaNum);
                            });
                        }
                    });
                    
                    estudiantesMap.forEach((estudiante) => {
                        if (estudiante.notas.length > 0) {
                            estudiante.primeraNota = estudiante.notas[0];
                            estudiante.ultimaNota = estudiante.notas[estudiante.notas.length - 1];
                            estudiante.cambio = estudiante.ultimaNota - estudiante.primeraNota;
                            estudiante.promedio = estudiante.notas.reduce((a, b) => a + b, 0) / estudiante.notas.length;
                            estudiante.estabilidad = calculateStandardDeviation(estudiante.notas);
                            
                            // Tendencia basada en cambio de 1 punto (una letra de diferencia)
                            if (estudiante.cambio >= 1) {
                                estudiante.tendencia = 'mejora';
                            } else if (estudiante.cambio <= -1) {
                                estudiante.tendencia = 'deterioro';
                            } else {
                                estudiante.tendencia = 'estable';
                            }
                        }
                    });
                    
                    // Clasificación de cohortes según nueva lógica:
                    // - A = 5, B = 4, C = 3, D = 2, E = 1, F/SE = 0
                    // - Buen rendimiento: A y B (promedio >= 3.5)
                    // - Bajo rendimiento: C (promedio < 3.5 pero >= 2.5)
                    // - Alto rendimiento: Mantiene A constantemente (promedio >= 4.5 y todas las notas >= 4.5)
                    // - Riesgo académico: C o peor (promedio < 3.5)
                    // - Mejora significativa: Mejora de al menos 1 punto (una letra)
                    // - Inestabilidad: Alta variabilidad (desviación estándar > 0.5)
                    
                    const cohortes = {
                        // Alto rendimiento: Estudiantes que mantienen A constantemente
                        altoRendimiento: Array.from(estudiantesMap.values()).filter(e => {
                            if (e.notas.length === 0) return false;
                            const promedioAlto = e.promedio >= 4.5; // Promedio de A
                            const todasNotasA = e.notas.every(nota => nota >= 4.5); // Todas las notas son A
                            return promedioAlto && todasNotasA && e.estabilidad < 0.5; // Baja variabilidad
                        }),
                        // Mejora significativa: Mejora de al menos 1 punto (una letra de diferencia)
                        mejoraSignificativa: Array.from(estudiantesMap.values()).filter(e => 
                            e.cambio >= 1 && e.ultimaNota >= 3.5 // Mejora de al menos una letra y última nota es B o mejor
                        ),
                        // Riesgo académico: C o peor (promedio < 3.5)
                        riesgoAcademico: Array.from(estudiantesMap.values()).filter(e => 
                            e.promedio < 3.5 // Promedio menor a C
                        ),
                        // Bajo rendimiento: C (promedio < 3.5 pero >= 2.5)
                        bajoRendimiento: Array.from(estudiantesMap.values()).filter(e => 
                            e.promedio >= 2.5 && e.promedio < 3.5 // Promedio es C
                        ),
                        // Inestabilidad: Alta variabilidad en las notas
                        inestabilidad: Array.from(estudiantesMap.values()).filter(e => 
                            e.estabilidad > 0.5 // Alta desviación estándar
                        )
                    };
                    
                    const calcularCaracteristicasCohorte = (cohorte: typeof cohortes.altoRendimiento) => {
                        if (cohorte.length === 0) return null;
                        return {
                            tamaño: cohorte.length,
                            promedioGeneral: cohorte.reduce((sum, e) => sum + e.promedio, 0) / cohorte.length,
                            cambioPromedio: cohorte.reduce((sum, e) => sum + e.cambio, 0) / cohorte.length,
                            estabilidadPromedio: cohorte.reduce((sum, e) => sum + e.estabilidad, 0) / cohorte.length
                        };
                    };
                    
                    const caracteristicas = {
                        altoRendimiento: calcularCaracteristicasCohorte(cohortes.altoRendimiento),
                        mejoraSignificativa: calcularCaracteristicasCohorte(cohortes.mejoraSignificativa),
                        riesgoAcademico: calcularCaracteristicasCohorte(cohortes.riesgoAcademico),
                        bajoRendimiento: calcularCaracteristicasCohorte(cohortes.bajoRendimiento),
                        inestabilidad: calcularCaracteristicasCohorte(cohortes.inestabilidad)
                    };
                    
                    cohortesData = { cohortes, caracteristicas };
                } catch (error) {
                    console.error('Error calculating cohortes data:', error);
                }
            }
            
            console.log('✅ renderProgressView returning JSX', {
                tendenciasData: tendenciasData ? 'exists' : 'null',
                comparativoData: comparativoData ? 'exists' : 'null',
                cohortesData: cohortesData ? 'exists' : 'null'
            });
            
            return (
                <div className="space-y-6">
                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros de Progreso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>Año Escolar</Label>
                                <Select
                                    value={progressFilters.ano_escolar}
                                    onValueChange={(value) => setProgressFilters({...progressFilters, ano_escolar: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Lapso</Label>
                                <Select
                                    value={progressFilters.lapso}
                                    onValueChange={(value) => setProgressFilters({...progressFilters, lapso: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="I Lapso">I Lapso</SelectItem>
                                        <SelectItem value="II Lapso">II Lapso</SelectItem>
                                        <SelectItem value="III Lapso">III Lapso</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Grado</Label>
                                <Select
                                    value={progressFilters.grado}
                                    onValueChange={(value) => setProgressFilters({...progressFilters, grado: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar grado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {alumnos && alumnos.length > 0 ? (
                                            [...new Set(alumnos.map(a => a.salon).filter(Boolean))].map(grado => (
                                                <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-grades" disabled>No hay grados disponibles</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Materia (Opcional)</Label>
                                <Select
                                    value={progressFilters.materia || 'all'}
                                    onValueChange={(value) => setProgressFilters({...progressFilters, materia: value === 'all' ? 'all' : value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las materias" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las materias</SelectItem>
                                        {materiasDisponibles.map(materia => (
                                            <SelectItem key={materia} value={materia}>{materia}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {isLoadingProgress ? (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center">
                                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                                <span>Cargando datos de progreso...</span>
                            </div>
                        </CardContent>
                    </Card>
                ) : !progressFilters.grado ? (
                    <Card>
                        <CardContent className="p-6">
                            <Alert>
                                <AlertDescription>
                                    Por favor selecciona un grado para ver el progreso del lapso.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                ) : !progressData || Object.keys(progressData).length === 0 ? (
                    <Card>
                        <CardContent className="p-6">
                            <Alert>
                                <AlertDescription>
                                    No hay datos disponibles para el grado y lapso seleccionados. Por favor, verifica que existan evaluaciones registradas para este período.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Promedio del Lapso</p>
                                            <p className="text-3xl font-bold">{kpis.promedioLapso}</p>
                                        </div>
                                        <AcademicCapIcon className="h-8 w-8 text-primary opacity-60" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tasa de Mejora</p>
                                            <p className="text-3xl font-bold">{kpis.tasaMejora}%</p>
                                        </div>
                                        <SparklesIcon className="h-8 w-8 text-primary opacity-60" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tasa de Aprobación</p>
                                            <p className="text-3xl font-bold">{kpis.tasaAprobacion}%</p>
                                        </div>
                                        <ClipboardCheckIcon className="h-8 w-8 text-primary opacity-60" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Estudiantes en Riesgo</p>
                                            <p className="text-3xl font-bold">{kpis.estudiantesEnRiesgo}</p>
                                        </div>
                                        <BellIcon className="h-8 w-8 text-destructive opacity-60" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Tabla de Resumen */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen por Evaluación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Evaluación</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Materia</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Promedio</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Aprobados</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Reprobados</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-background divide-y divide-border">
                                            {timelineData.length > 0 ? timelineData.map((row, index) => (
                                                <tr key={index} className="hover:bg-muted/50">
                                                    <td className="px-4 py-2 whitespace-nowrap">{row.evaluacion}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{row.materia}</td>
                                                    <td className="px-4 py-2 text-center font-medium">
                                                        <span className="text-lg font-bold">{convertNumberToLetter(row.promedio)}</span>
                                                        <span className="text-xs text-muted-foreground ml-1">({row.promedio.toFixed(2)})</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <Badge variant="default">{row.aprobados}</Badge>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <Badge variant="destructive">{row.reprobados}</Badge>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">{row.totalEstudiantes}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                                                        No hay datos disponibles para mostrar
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* ANÁLISIS DE TENDENCIAS TEMPORALES */}
                        {tendenciasData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>📈 Análisis de Tendencias Temporales - {progressFilters.materia}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Evolución del rendimiento a lo largo del lapso con métricas estadísticas
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Métricas de Tendencia */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <Card className="bg-blue-50 dark:bg-blue-950">
                                                <CardContent className="p-4">
                                                    <p className="text-xs text-muted-foreground mb-1">Tasa de Cambio</p>
                                                    <p className={`text-2xl font-bold ${tendenciasData.tasaCambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tendenciasData.tasaCambio >= 0 ? '+' : ''}{tendenciasData.tasaCambio.toFixed(1)}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {tendenciasData.primeraNota.toFixed(2)} → {tendenciasData.ultimaNota.toFixed(2)}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-purple-50 dark:bg-purple-950">
                                                <CardContent className="p-4">
                                                    <p className="text-xs text-muted-foreground mb-1">Velocidad de Mejora</p>
                                                    <p className={`text-2xl font-bold ${tendenciasData.regression.slope >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tendenciasData.regression.slope >= 0 ? '+' : ''}{tendenciasData.regression.slope.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        R² = {tendenciasData.regression.r2.toFixed(3)}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-orange-50 dark:bg-orange-950">
                                                <CardContent className="p-4">
                                                    <p className="text-xs text-muted-foreground mb-1">Estabilidad</p>
                                                    <p className="text-2xl font-bold">{tendenciasData.estabilidad.toFixed(2)}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Desv. Estándar (escala 0-5)
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-green-50 dark:bg-green-950">
                                                <CardContent className="p-4">
                                                    <p className="text-xs text-muted-foreground mb-1">Tasa de Recuperación</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {tendenciasData.tasaRecuperacion.toFixed(1)}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {tendenciasData.reprobadosInicial} → {tendenciasData.reprobadosFinal} reprobados
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        
                                        {/* Gráfico de Línea con Tendencia */}
                                        <div>
                                            <h4 className="text-lg font-semibold mb-4">Evolución de Promedios con Línea de Tendencia</h4>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <LineChart data={tendenciasData.chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="evaluacion" 
                                                        tick={{ fontSize: 12 }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis 
                                                        domain={[0, 5]}
                                                        tick={{ fontSize: 12 }}
                                                        label={{ value: 'Promedio (A=5, B=4, C=3, D=2, E=1, F/SE=0)', angle: -90, position: 'insideLeft' }}
                                                    />
                                                    <RechartsTooltip 
                                                        formatter={(value: any, name: string) => {
                                                            if (name === 'promedio') {
                                                                const letter = convertNumberToLetter(value);
                                                                return [`${letter} (${value.toFixed(2)})`, 'Promedio Real'];
                                                            }
                                                            if (name === 'tendencia') {
                                                                const letter = convertNumberToLetter(value);
                                                                return [`${letter} (${value.toFixed(2)})`, 'Tendencia (Regresión)'];
                                                            }
                                                            return [value, name];
                                                        }}
                                                    />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="promedio"
                                                        stroke="#007AFF" 
                                                        strokeWidth={3}
                                                        dot={{ r: 6 }}
                                                        name="Promedio Real"
                                                    />
                                                    <Line 
                                                        type="linear" 
                                                        dataKey="tendencia" 
                                                        stroke="#FF3B30" 
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                        dot={false}
                                                        name="Tendencia (Regresión)"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* ANÁLISIS COMPARATIVO ENTRE MATERIAS */}
                        {comparativoData && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>📊 Análisis Comparativo entre Materias</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Correlaciones, consistencia y rendimiento relativo entre Lengua, Inglés y Matemáticas
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* Métricas de Correlación */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <Card className="bg-blue-50 dark:bg-blue-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Correlación Lengua-Inglés</p>
                                                        <p className="text-2xl font-bold">{comparativoData.correlacionLenguaIngles.toFixed(3)}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {comparativoData.correlacionLenguaIngles > 0.7 ? 'Fuerte' : 
                                                             comparativoData.correlacionLenguaIngles > 0.4 ? 'Moderada' : 'Débil'}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-green-50 dark:bg-green-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Correlación Lengua-Matemáticas</p>
                                                        <p className="text-2xl font-bold">{comparativoData.correlacionLenguaMatematicas.toFixed(3)}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {comparativoData.correlacionLenguaMatematicas > 0.7 ? 'Fuerte' : 
                                                             comparativoData.correlacionLenguaMatematicas > 0.4 ? 'Moderada' : 'Débil'}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-purple-50 dark:bg-purple-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Correlación Inglés-Matemáticas</p>
                                                        <p className="text-2xl font-bold">{comparativoData.correlacionInglesMatematicas.toFixed(3)}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {comparativoData.correlacionInglesMatematicas > 0.7 ? 'Fuerte' : 
                                                             comparativoData.correlacionInglesMatematicas > 0.4 ? 'Moderada' : 'Débil'}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-red-50 dark:bg-red-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Materia Más Desafiante</p>
                                                        <p className="text-2xl font-bold">{comparativoData.materiaMasDesafiante.materia}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Promedio: {convertNumberToLetter(comparativoData.materiaMasDesafiante.promedio)} ({comparativoData.materiaMasDesafiante.promedio.toFixed(2)})
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            
                                            {/* Matriz de Correlación */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Matriz de Correlación entre Materias</h4>
                                                <div className="grid grid-cols-4 gap-2 max-w-md">
                                                    <div className="font-semibold text-sm"></div>
                                                    <div className="font-semibold text-sm text-center">Lengua</div>
                                                    <div className="font-semibold text-sm text-center">Inglés</div>
                                                    <div className="font-semibold text-sm text-center">Matemáticas</div>
                                                    
                                                    <div className="font-semibold text-sm">Lengua</div>
                                                    <div className="bg-blue-500 text-white text-center py-2 rounded font-bold">1.000</div>
                                                    <div className={`text-white text-center py-2 rounded font-bold ${comparativoData.correlacionLenguaIngles >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {comparativoData.correlacionLenguaIngles.toFixed(3)}
                                                    </div>
                                                    <div className={`text-white text-center py-2 rounded font-bold ${comparativoData.correlacionLenguaMatematicas >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {comparativoData.correlacionLenguaMatematicas.toFixed(3)}
                                                    </div>
                                                    
                                                    <div className="font-semibold text-sm">Inglés</div>
                                                    <div className={`text-white text-center py-2 rounded font-bold ${comparativoData.correlacionLenguaIngles >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {comparativoData.correlacionLenguaIngles.toFixed(3)}
                                                    </div>
                                                    <div className="bg-blue-500 text-white text-center py-2 rounded font-bold">1.000</div>
                                                    <div className={`text-white text-center py-2 rounded font-bold ${comparativoData.correlacionInglesMatematicas >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {comparativoData.correlacionInglesMatematicas.toFixed(3)}
                                                    </div>
                                                    
                                                    <div className="font-semibold text-sm">Matemáticas</div>
                                                    <div className={`text-white text-center py-2 rounded font-bold ${comparativoData.correlacionLenguaMatematicas >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {comparativoData.correlacionLenguaMatematicas.toFixed(3)}
                                                    </div>
                                                    <div className={`text-white text-center py-2 rounded font-bold ${comparativoData.correlacionInglesMatematicas >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {comparativoData.correlacionInglesMatematicas.toFixed(3)}
                                                    </div>
                                                    <div className="bg-blue-500 text-white text-center py-2 rounded font-bold">1.000</div>
                                                </div>
                                            </div>
                                            
                                            {/* Gráfico de Barras Agrupadas */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Comparación de Promedios por Evaluación</h4>
                                                <ResponsiveContainer width="100%" height={400}>
                                                    <BarChart data={comparativoData.chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis 
                                                            dataKey="evaluacion" 
                                                            tick={{ fontSize: 12 }}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={80}
                                                        />
                                                        <YAxis 
                                                            domain={[0, 5]}
                                                            tick={{ fontSize: 12 }}
                                                            label={{ value: 'Promedio (A=5, B=4, C=3, D=2, E=1)', angle: -90, position: 'insideLeft' }}
                                                        />
                                                        <RechartsTooltip />
                                                        <Bar dataKey="Lengua" fill="#007AFF" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="Inglés" fill="#FADB16" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="Matemáticas" fill="#FF3B30" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                        )}
                        
                        {/* ANÁLISIS DE COHORTES Y SEGMENTACIÓN */}
                        {cohortesData && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>👥 Análisis de Cohortes y Segmentación</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Identificación de grupos de estudiantes con características similares y análisis de transiciones.
                                            <br />
                                            <span className="font-semibold">Criterios:</span> Buen rendimiento (A y B), Bajo rendimiento (C), Alto rendimiento (mantiene A constantemente), Riesgo académico (C o peor).
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* Resumen de Cohortes */}
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                {[
                                                    { nombre: 'Alto Rendimiento', datos: cohortesData.caracteristicas.altoRendimiento, color: 'bg-green-500' },
                                                    { nombre: 'Mejora Significativa', datos: cohortesData.caracteristicas.mejoraSignificativa, color: 'bg-blue-500' },
                                                    { nombre: 'Riesgo Académico', datos: cohortesData.caracteristicas.riesgoAcademico, color: 'bg-red-500' },
                                                    { nombre: 'Bajo Rendimiento', datos: cohortesData.caracteristicas.bajoRendimiento, color: 'bg-orange-500' },
                                                    { nombre: 'Inestabilidad', datos: cohortesData.caracteristicas.inestabilidad, color: 'bg-purple-500' }
                                                ].map((cohorte, idx) => (
                                                    <Card key={idx} className={cohorte.color + ' text-white'}>
                                                        <CardContent className="p-4">
                                                            <p className="text-xs opacity-90 mb-1">{cohorte.nombre}</p>
                                                            <p className="text-3xl font-bold">{cohorte.datos?.tamaño || 0}</p>
                                                            <p className="text-xs opacity-90 mt-1">
                                                                {cohorte.datos ? `Prom: ${convertNumberToLetter(cohorte.datos.promedioGeneral)} (${cohorte.datos.promedioGeneral.toFixed(1)})` : 'Sin datos'}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                            
                                            {/* Perfil de Cohortes */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Perfil Promedio por Cohorte</h4>
                                                <ResponsiveContainer width="100%" height={400}>
                                                    <BarChart data={[
                                                        {
                                                            name: 'Promedio',
                                                            'Alto Rendimiento': cohortesData.caracteristicas.altoRendimiento?.promedioGeneral || 0,
                                                            'Mejora Significativa': cohortesData.caracteristicas.mejoraSignificativa?.promedioGeneral || 0,
                                                            'Riesgo Académico': cohortesData.caracteristicas.riesgoAcademico?.promedioGeneral || 0,
                                                            'Bajo Rendimiento': cohortesData.caracteristicas.bajoRendimiento?.promedioGeneral || 0,
                                                            'Inestabilidad': cohortesData.caracteristicas.inestabilidad?.promedioGeneral || 0
                                                        },
                                                        {
                                                            name: 'Cambio',
                                                            'Alto Rendimiento': cohortesData.caracteristicas.altoRendimiento?.cambioPromedio || 0,
                                                            'Mejora Significativa': cohortesData.caracteristicas.mejoraSignificativa?.cambioPromedio || 0,
                                                            'Riesgo Académico': cohortesData.caracteristicas.riesgoAcademico?.cambioPromedio || 0,
                                                            'Bajo Rendimiento': cohortesData.caracteristicas.bajoRendimiento?.cambioPromedio || 0,
                                                            'Inestabilidad': cohortesData.caracteristicas.inestabilidad?.cambioPromedio || 0
                                                        }
                                                    ]}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <RechartsTooltip />
                                                        <Bar dataKey="Alto Rendimiento" fill="#34C759" />
                                                        <Bar dataKey="Mejora Significativa" fill="#007AFF" />
                                                        <Bar dataKey="Riesgo Académico" fill="#FF3B30" />
                                                        <Bar dataKey="Bajo Rendimiento" fill="#FF9500" />
                                                        <Bar dataKey="Inestabilidad" fill="#AF52DE" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            
                                            {/* Tabla de Estudiantes por Cohorte */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Estudiantes por Cohorte</h4>
                                                <div className="space-y-4">
                                                    {[
                                                        { 
                                                            nombre: 'Alto Rendimiento', 
                                                            descripcion: 'Estudiantes que mantienen A constantemente',
                                                            estudiantes: cohortesData.cohortes.altoRendimiento, 
                                                            color: 'border-green-500' 
                                                        },
                                                        { 
                                                            nombre: 'Mejora Significativa', 
                                                            descripcion: 'Estudiantes que mejoran al menos una letra (A, B, C, D, E)',
                                                            estudiantes: cohortesData.cohortes.mejoraSignificativa, 
                                                            color: 'border-blue-500' 
                                                        },
                                                        { 
                                                            nombre: 'Riesgo Académico', 
                                                            descripcion: 'Estudiantes con C o peor (promedio < 3.5)',
                                                            estudiantes: cohortesData.cohortes.riesgoAcademico, 
                                                            color: 'border-red-500' 
                                                        },
                                                        { 
                                                            nombre: 'Bajo Rendimiento', 
                                                            descripcion: 'Estudiantes con C (promedio entre 2.5 y 3.5)',
                                                            estudiantes: cohortesData.cohortes.bajoRendimiento, 
                                                            color: 'border-orange-500' 
                                                        },
                                                        { 
                                                            nombre: 'Inestabilidad', 
                                                            descripcion: 'Estudiantes con alta variabilidad en sus notas',
                                                            estudiantes: cohortesData.cohortes.inestabilidad, 
                                                            color: 'border-purple-500' 
                                                        }
                                                    ].map((cohorte, idx) => (
                                                        <Card key={idx} className={`border-2 ${cohorte.color}`}>
                                                            <CardHeader>
                                                                <CardTitle className="text-lg">{cohorte.nombre} ({cohorte.estudiantes.length} estudiantes)</CardTitle>
                                                                <p className="text-sm text-muted-foreground mt-1">{cohorte.descripcion}</p>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="overflow-x-auto">
                                                                    <table className="min-w-full divide-y divide-border">
                                                                        <thead className="bg-muted">
                                                                            <tr>
                                                                                <th className="px-4 py-2 text-left text-xs font-medium">Estudiante</th>
                                                                                <th className="px-4 py-2 text-center text-xs font-medium">Promedio</th>
                                                                                <th className="px-4 py-2 text-center text-xs font-medium">Cambio</th>
                                                                                <th className="px-4 py-2 text-center text-xs font-medium">Estabilidad</th>
                                                                                <th className="px-4 py-2 text-center text-xs font-medium">Tendencia</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-border">
                                                                            {cohorte.estudiantes.slice(0, 10).map((est, estIdx) => (
                                                                                <tr key={estIdx} className="hover:bg-muted/50">
                                                                                    <td className="px-4 py-2 text-sm">{est.nombre}</td>
                                                                                    <td className="px-4 py-2 text-center font-medium">
                                                                                        <span className="text-lg font-bold">{convertNumberToLetter(est.promedio)}</span>
                                                                                        <span className="text-xs text-muted-foreground ml-1">({est.promedio.toFixed(2)})</span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center">
                                                                                        <Badge variant={est.cambio >= 0 ? 'default' : 'destructive'}>
                                                                                            {est.cambio >= 0 ? '+' : ''}{est.cambio.toFixed(2)}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center">{est.estabilidad.toFixed(2)}</td>
                                                                                    <td className="px-4 py-2 text-center">
                                                                                        <Badge variant={
                                                                                            est.tendencia === 'mejora' ? 'default' :
                                                                                            est.tendencia === 'estable' ? 'secondary' : 'destructive'
                                                                                        }>
                                                                                            {est.tendencia === 'mejora' ? 'Mejora' :
                                                                                             est.tendencia === 'estable' ? 'Estable' : 'Deterioro'}
                                                                                        </Badge>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                {cohorte.estudiantes.length > 10 && (
                                                                    <p className="text-sm text-muted-foreground mt-2 text-center">
                                                                        Mostrando 10 de {cohorte.estudiantes.length} estudiantes
                                                                    </p>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                        )}
                        
                        {/* ANÁLISIS DE RIESGO Y PREDICCIÓN */}
                        {riskData && progressFilters.grado && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>⚠️ Análisis de Riesgo y Predicción</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Identificación proactiva de estudiantes en riesgo académico basado en múltiples factores
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingRisk ? (
                                        <div className="flex items-center justify-center p-6">
                                            <Skeleton className="h-8 w-8 rounded-full mr-3" />
                                            <span>Cargando datos de riesgo...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Métricas de Riesgo */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <Card className="bg-green-50 dark:bg-green-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Riesgo Bajo</p>
                                                        <p className="text-2xl font-bold text-green-600">{riskData.distribution.bajo}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Score &lt; 30
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-yellow-50 dark:bg-yellow-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Riesgo Medio</p>
                                                        <p className="text-2xl font-bold text-yellow-600">{riskData.distribution.medio}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Score 30-59
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-orange-50 dark:bg-orange-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Riesgo Alto</p>
                                                        <p className="text-2xl font-bold text-orange-600">{riskData.distribution.alto}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Score 60-79
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-red-50 dark:bg-red-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Riesgo Crítico</p>
                                                        <p className="text-2xl font-bold text-red-600">{riskData.distribution.critico}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Score ≥ 80
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            
                                            {/* Distribución de Risk Scores */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Distribución de Risk Scores</h4>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={riskData.histogramData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis 
                                                            dataKey="label" 
                                                            tick={{ fontSize: 12 }}
                                                        />
                                                        <YAxis 
                                                            tick={{ fontSize: 12 }}
                                                            label={{ value: 'Cantidad de Estudiantes', angle: -90, position: 'insideLeft' }}
                                                        />
                                                        <RechartsTooltip />
                                                        <Bar 
                                                            dataKey="count" 
                                                            fill="#8884d8"
                                                            radius={[4, 4, 0, 0]}
                                                        >
                                                            {riskData.histogramData.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                                <div className="mt-4 text-center">
                                                    <p className="text-sm text-muted-foreground">
                                                        Promedio de Risk Score: <span className="font-bold">{riskData.promedioRiskScore.toFixed(1)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Factores de Riesgo */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Factores de Riesgo Identificados</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">Promedio Bajo</p>
                                                                    <p className="text-2xl font-bold">{riskData.factoresAnalisis.promedio_bajo}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {riskData.totalEstudiantes > 0 ? ((riskData.factoresAnalisis.promedio_bajo / riskData.totalEstudiantes) * 100).toFixed(1) : 0}% de estudiantes
                                                                    </p>
                                                                </div>
                                                                <AlertTriangle className="h-8 w-8 text-orange-500 opacity-60" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">Asistencia Crítica</p>
                                                                    <p className="text-2xl font-bold">{riskData.factoresAnalisis.asistencia_critica}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {riskData.totalEstudiantes > 0 ? ((riskData.factoresAnalisis.asistencia_critica / riskData.totalEstudiantes) * 100).toFixed(1) : 0}% de estudiantes
                                                                    </p>
                                                                </div>
                                                                <AlertCircle className="h-8 w-8 text-red-500 opacity-60" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">Evaluaciones Reprobadas</p>
                                                                    <p className="text-2xl font-bold">{riskData.factoresAnalisis.evaluaciones_reprobadas}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {riskData.totalEstudiantes > 0 ? ((riskData.factoresAnalisis.evaluaciones_reprobadas / riskData.totalEstudiantes) * 100).toFixed(1) : 0}% de estudiantes
                                                                    </p>
                                                                </div>
                                                                <XCircle className="h-8 w-8 text-destructive opacity-60" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">Asistencia Baja</p>
                                                                    <p className="text-2xl font-bold">{riskData.factoresAnalisis.asistencia_baja}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {riskData.totalEstudiantes > 0 ? ((riskData.factoresAnalisis.asistencia_baja / riskData.totalEstudiantes) * 100).toFixed(1) : 0}% de estudiantes
                                                                    </p>
                                                                </div>
                                                                <AlertCircle className="h-8 w-8 text-yellow-500 opacity-60" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">Estados Emocionales Negativos</p>
                                                                    <p className="text-2xl font-bold">{riskData.factoresAnalisis.estados_negativos}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {riskData.totalEstudiantes > 0 ? ((riskData.factoresAnalisis.estados_negativos / riskData.totalEstudiantes) * 100).toFixed(1) : 0}% de estudiantes
                                                                    </p>
                                                                </div>
                                                                <Heart className="h-8 w-8 text-purple-500 opacity-60" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">Baja Independencia</p>
                                                                    <p className="text-2xl font-bold">{riskData.factoresAnalisis.baja_independencia}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {riskData.totalEstudiantes > 0 ? ((riskData.factoresAnalisis.baja_independencia / riskData.totalEstudiantes) * 100).toFixed(1) : 0}% de estudiantes
                                                                    </p>
                                                                </div>
                                                                <UserMinus className="h-8 w-8 text-blue-500 opacity-60" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </div>
                                            
                                            {/* Estudiantes en Riesgo */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">
                                                    Estudiantes en Riesgo (Score ≥ 60) - {riskData.estudiantesEnRiesgo.length} estudiantes
                                                </h4>
                                                {riskData.estudiantesEnRiesgo.length > 0 ? (
                                                    <div className="overflow-x-auto border rounded-lg">
                                                        <table className="min-w-full divide-y divide-border">
                                                            <thead className="bg-muted">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estudiante</th>
                                                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Risk Score</th>
                                                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Nivel de Riesgo</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Factores Identificados</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-background divide-y divide-border">
                                                                {riskData.estudiantesEnRiesgo.map((est: any, idx: number) => {
                                                                    const getRiskColor = (score: number) => {
                                                                        if (score >= 80) return 'bg-red-500';
                                                                        if (score >= 60) return 'bg-orange-500';
                                                                        return 'bg-yellow-500';
                                                                    };
                                                                    
                                                                    const factoresList = Object.entries(est.factores || {})
                                                                        .filter(([key, value]) => {
                                                                            if (key === 'promedio_bajo' || key === 'asistencia_critica' || 
                                                                                key === 'asistencia_baja' || key === 'estados_negativos' || 
                                                                                key === 'baja_independencia') {
                                                                                return value === true;
                                                                            }
                                                                            if (key === 'evaluaciones_reprobadas') {
                                                                                return (value as number) > 0;
                                                                            }
                                                                            return false;
                                                                        })
                                                                        .map(([key]) => {
                                                                            const nombres: Record<string, string> = {
                                                                                promedio_bajo: 'Promedio Bajo',
                                                                                asistencia_critica: 'Asistencia Crítica',
                                                                                asistencia_baja: 'Asistencia Baja',
                                                                                evaluaciones_reprobadas: 'Evaluaciones Reprobadas',
                                                                                estados_negativos: 'Estados Emocionales Negativos',
                                                                                baja_independencia: 'Baja Independencia'
                                                                            };
                                                                            return nombres[key] || key;
                                                                        });
                                                                    
                                                                    return (
                                                                        <tr key={idx} className="hover:bg-muted/50">
                                                                            <td className="px-4 py-2 text-sm font-medium">{est.nombre}</td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <Badge 
                                                                                    variant="destructive" 
                                                                                    className={getRiskColor(est.riskScore)}
                                                                                >
                                                                                    {est.riskScore.toFixed(1)}
                                                                                </Badge>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <Badge variant="outline">{est.riskLevel}</Badge>
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {factoresList.map((factor, fIdx) => (
                                                                                        <Badge key={fIdx} variant="secondary" className="text-xs">
                                                                                            {factor}
                                                                                        </Badge>
                                                                                    ))}
                                                                                    {factoresList.length === 0 && (
                                                                                        <span className="text-xs text-muted-foreground">Sin factores específicos</span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <Alert>
                                                        <AlertDescription>
                                                            No se identificaron estudiantes en riesgo para este grado y lapso.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* EFICACIA PEDAGÓGICA */}
                        {eficaciaData && progressFilters.grado && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>📊 Eficacia Pedagógica</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Análisis del impacto y retorno de inversión de las intervenciones pedagógicas realizadas
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingEficacia ? (
                                        <div className="flex items-center justify-center p-6">
                                            <Skeleton className="h-8 w-8 rounded-full mr-3" />
                                            <span>Cargando datos de eficacia...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Métricas de Eficacia */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <Card className="bg-green-50 dark:bg-green-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Tasa de Éxito</p>
                                                        <p className="text-2xl font-bold text-green-600">{eficaciaData.tasaExito}%</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {eficaciaData.intervencionesResueltas} de {eficaciaData.totalIntervenciones} resueltas
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-blue-50 dark:bg-blue-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">En Proceso</p>
                                                        <p className="text-2xl font-bold text-blue-600">{eficaciaData.intervencionesEnProceso}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Intervenciones activas
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-orange-50 dark:bg-orange-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Ineficaces</p>
                                                        <p className="text-2xl font-bold text-orange-600">{eficaciaData.intervencionesIneficaces}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Requieren revisión
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-purple-50 dark:bg-purple-950">
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">ROI Pedagógico</p>
                                                        <p className="text-2xl font-bold text-purple-600">{eficaciaData.roi}%</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Retorno por intervención
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            
                                            {/* Tasa de Éxito de Intervenciones */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Tasa de Éxito de Intervenciones</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Card>
                                                        <CardContent className="p-6">
                                                            <ResponsiveContainer width="100%" height={250}>
                                                                <BarChart data={[
                                                                    { name: 'Resueltas', value: eficaciaData.intervencionesResueltas, color: '#22c55e' },
                                                                    { name: 'En Proceso', value: eficaciaData.intervencionesEnProceso, color: '#3b82f6' },
                                                                    { name: 'Ineficaces', value: eficaciaData.intervencionesIneficaces, color: '#f97316' }
                                                                ]}>
                                                                    <CartesianGrid strokeDasharray="3 3" />
                                                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                                    <YAxis tick={{ fontSize: 12 }} />
                                                                    <RechartsTooltip />
                                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                                        {[
                                                                            { name: 'Resueltas', value: eficaciaData.intervencionesResueltas, color: '#22c55e' },
                                                                            { name: 'En Proceso', value: eficaciaData.intervencionesEnProceso, color: '#3b82f6' },
                                                                            { name: 'Ineficaces', value: eficaciaData.intervencionesIneficaces, color: '#f97316' }
                                                                        ].map((entry, index) => (
                                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                                        ))}
                                                                    </Bar>
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-6">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">Resueltas</span>
                                                                        <span className="text-sm font-bold text-green-600">
                                                                            {eficaciaData.intervencionesResueltas} ({eficaciaData.totalIntervenciones > 0 ? ((eficaciaData.intervencionesResueltas / eficaciaData.totalIntervenciones) * 100).toFixed(1) : 0}%)
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-muted rounded-full h-2">
                                                                        <div 
                                                                            className="bg-green-500 h-2 rounded-full" 
                                                                            style={{ width: `${eficaciaData.totalIntervenciones > 0 ? (eficaciaData.intervencionesResueltas / eficaciaData.totalIntervenciones) * 100 : 0}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">En Proceso</span>
                                                                        <span className="text-sm font-bold text-blue-600">
                                                                            {eficaciaData.intervencionesEnProceso} ({eficaciaData.totalIntervenciones > 0 ? ((eficaciaData.intervencionesEnProceso / eficaciaData.totalIntervenciones) * 100).toFixed(1) : 0}%)
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-muted rounded-full h-2">
                                                                        <div 
                                                                            className="bg-blue-500 h-2 rounded-full" 
                                                                            style={{ width: `${eficaciaData.totalIntervenciones > 0 ? (eficaciaData.intervencionesEnProceso / eficaciaData.totalIntervenciones) * 100 : 0}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">Ineficaces</span>
                                                                        <span className="text-sm font-bold text-orange-600">
                                                                            {eficaciaData.intervencionesIneficaces} ({eficaciaData.totalIntervenciones > 0 ? ((eficaciaData.intervencionesIneficaces / eficaciaData.totalIntervenciones) * 100).toFixed(1) : 0}%)
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-muted rounded-full h-2">
                                                                        <div 
                                                                            className="bg-orange-500 h-2 rounded-full" 
                                                                            style={{ width: `${eficaciaData.totalIntervenciones > 0 ? (eficaciaData.intervencionesIneficaces / eficaciaData.totalIntervenciones) * 100 : 0}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </div>
                                            
                                            {/* Timeline de Acciones */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Timeline de Acciones Pedagógicas</h4>
                                                {eficaciaData.timelineAcciones.length > 0 ? (
                                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                                        {eficaciaData.timelineAcciones.map((accion: any, idx: number) => (
                                                            <Card key={idx} className="border-l-4 border-l-blue-500">
                                                                <CardContent className="p-4">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <p className="font-semibold text-sm">{accion.evaluacion} - {accion.materia}</p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {accion.fecha.toLocaleDateString('es-ES', { 
                                                                                    year: 'numeric', 
                                                                                    month: 'short', 
                                                                                    day: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </p>
                                                                        </div>
                                                                        <Badge variant="outline">{accion.totalEstudiantes} estudiantes</Badge>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <p className="text-sm font-medium mb-1">Acciones Sugeridas:</p>
                                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{accion.accionesSugeridas}</p>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Alert>
                                                        <AlertDescription>
                                                            No se encontraron acciones pedagógicas registradas para este período.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                            
                                            {/* ROI Pedagógico */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">ROI Pedagógico (Retorno de Inversión)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Inversión Total</p>
                                                            <p className="text-2xl font-bold">{eficaciaData.totalInversion}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Intervenciones realizadas</p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Retorno Total</p>
                                                            <p className="text-2xl font-bold text-green-600">+{eficaciaData.totalMejora}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Mejora promedio: {eficaciaData.promedioMejora} puntos
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Estudiantes con Mejora</p>
                                                            <p className="text-2xl font-bold text-blue-600">{eficaciaData.estudiantesConMejora}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                De {eficaciaData.intervencionesPorEstudiante.length} estudiantes
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                                
                                                {/* Tabla de Estudiantes con Intervenciones */}
                                                {eficaciaData.intervencionesPorEstudiante.length > 0 && (
                                                    <div className="mt-4">
                                                        <h5 className="text-md font-semibold mb-3">Impacto por Estudiante</h5>
                                                        <div className="overflow-x-auto border rounded-lg">
                                                            <table className="min-w-full divide-y divide-border">
                                                                <thead className="bg-muted">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estudiante</th>
                                                                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Intervenciones</th>
                                                                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Resueltas</th>
                                                                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">En Proceso</th>
                                                                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Ineficaces</th>
                                                                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Mejora</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-background divide-y divide-border">
                                                                    {eficaciaData.intervencionesPorEstudiante
                                                                        .sort((a, b) => b.mejoras - a.mejoras)
                                                                        .slice(0, 10)
                                                                        .map((est: any, idx: number) => (
                                                                        <tr key={idx} className="hover:bg-muted/50">
                                                                            <td className="px-4 py-2 text-sm font-medium">{est.estudiante}</td>
                                                                            <td className="px-4 py-2 text-center">{est.intervenciones}</td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <Badge variant="default" className="bg-green-500">{est.resueltas}</Badge>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <Badge variant="default" className="bg-blue-500">{est.enProceso}</Badge>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <Badge variant="destructive">{est.ineficaces}</Badge>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <Badge variant={est.mejoras > 0 ? 'default' : est.mejoras < 0 ? 'destructive' : 'secondary'}>
                                                                                    {est.mejoras > 0 ? '+' : ''}{est.mejoras.toFixed(2)}
                                                                                </Badge>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {eficaciaData.intervencionesPorEstudiante.length > 10 && (
                                                            <p className="text-sm text-muted-foreground mt-2 text-center">
                                                                Mostrando 10 de {eficaciaData.intervencionesPorEstudiante.length} estudiantes
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* COMPETENCIAS E INDICADORES */}
                        {competenciasData && progressFilters.grado && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>🎯 Competencias e Indicadores</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Análisis detallado del desempeño por competencias e indicadores de logro
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingCompetencias ? (
                                        <div className="flex items-center justify-center p-6">
                                            <Skeleton className="h-8 w-8 rounded-full mr-3" />
                                            <span>Cargando datos de competencias...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Resumen */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Total Competencias</p>
                                                        <p className="text-2xl font-bold">{competenciasData.totalCompetencias}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Total Indicadores</p>
                                                        <p className="text-2xl font-bold">{competenciasData.totalIndicadores}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground mb-1">Fortalezas Identificadas</p>
                                                        <p className="text-2xl font-bold text-green-600">{competenciasData.fortalezas.length}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            
                                            {/* Fortalezas y Debilidades */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Fortalezas y Debilidades</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Fortalezas */}
                                                    <Card className="border-green-500 border-2">
                                                        <CardHeader>
                                                            <CardTitle className="text-green-600">✅ Fortalezas</CardTitle>
                                                            <p className="text-sm text-muted-foreground">Competencias con promedio ≥ 4.0</p>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {competenciasData.fortalezas.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {competenciasData.fortalezas.slice(0, 5).map((fortaleza: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                                                            <div className="flex-1">
                                                                                <p className="font-medium text-sm">{fortaleza.competencia.descripcion}</p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {fortaleza.indicadores.length} indicadores
                                                                                </p>
                                                                            </div>
                                                                            <Badge variant="default" className="bg-green-500">
                                                                                {fortaleza.promedioGeneral.toFixed(2)}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                    {competenciasData.fortalezas.length > 5 && (
                                                                        <p className="text-xs text-muted-foreground text-center">
                                                                            Y {competenciasData.fortalezas.length - 5} más...
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Alert>
                                                                    <AlertDescription>
                                                                        No se identificaron fortalezas en este período.
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                    
                                                    {/* Debilidades */}
                                                    <Card className="border-red-500 border-2">
                                                        <CardHeader>
                                                            <CardTitle className="text-red-600">⚠️ Debilidades</CardTitle>
                                                            <p className="text-sm text-muted-foreground">Competencias con promedio &lt; 3.0</p>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {competenciasData.debilidades.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {competenciasData.debilidades.slice(0, 5).map((debilidad: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                                                                            <div className="flex-1">
                                                                                <p className="font-medium text-sm">{debilidad.competencia.descripcion}</p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {debilidad.indicadores.length} indicadores
                                                                                </p>
                                                                            </div>
                                                                            <Badge variant="destructive">
                                                                                {debilidad.promedioGeneral.toFixed(2)}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                    {competenciasData.debilidades.length > 5 && (
                                                                        <p className="text-xs text-muted-foreground text-center">
                                                                            Y {competenciasData.debilidades.length - 5} más...
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Alert>
                                                                    <AlertDescription>
                                                                        No se identificaron debilidades críticas en este período.
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </div>
                                            
                                            {/* Heatmap de Competencias */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Heatmap de Competencias</h4>
                                                {competenciasData.heatmapData.length > 0 ? (
                                                    <div className="overflow-x-auto border rounded-lg">
                                                        <table className="min-w-full">
                                                            <thead className="bg-muted">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase sticky left-0 bg-muted z-10">
                                                                        Competencia
                                                                    </th>
                                                                    {Array.from(new Set(competenciasData.heatmapData.map((h: any) => h.estudiante)))
                                                                        .slice(0, 10)
                                                                        .map((estudiante: string) => (
                                                                            <th key={estudiante} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase min-w-[100px]">
                                                                                {estudiante.split(',')[0]}
                                                                            </th>
                                                                        ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-background">
                                                                {Array.from(new Set(competenciasData.heatmapData.map((h: any) => h.competencia)))
                                                                    .map((competencia: string) => {
                                                                        const estudiantes = Array.from(new Set(competenciasData.heatmapData.map((h: any) => h.estudiante))).slice(0, 10);
                                                                        return (
                                                                            <tr key={competencia} className="border-t">
                                                                                <td className="px-4 py-2 text-sm font-medium sticky left-0 bg-background z-10">
                                                                                    {competencia.length > 40 ? competencia.substring(0, 40) + '...' : competencia}
                                                                                </td>
                                                                                {estudiantes.map((estudiante: string) => {
                                                                                    const data = competenciasData.heatmapData.find((h: any) => 
                                                                                        h.competencia === competencia && h.estudiante === estudiante
                                                                                    );
                                                                                    const nivel = data?.nivel || 0;
                                                                                    const getColor = (nivel: number) => {
                                                                                        if (nivel >= 4.5) return 'bg-green-600';
                                                                                        if (nivel >= 3.5) return 'bg-green-400';
                                                                                        if (nivel >= 2.5) return 'bg-yellow-400';
                                                                                        if (nivel >= 1.5) return 'bg-orange-400';
                                                                                        if (nivel > 0) return 'bg-red-400';
                                                                                        return 'bg-gray-200';
                                                                                    };
                                                                                    return (
                                                                                        <td key={estudiante} className="px-2 py-2 text-center">
                                                                                            <div 
                                                                                                className={`w-full h-8 rounded ${getColor(nivel)} flex items-center justify-center text-white text-xs font-bold`}
                                                                                                title={`${competencia} - ${estudiante}: ${nivel.toFixed(2)}`}
                                                                                            >
                                                                                                {nivel > 0 ? nivel.toFixed(1) : '-'}
                                                                                            </div>
                                                                                        </td>
                                                                                    );
                                                                                })}
                                                                            </tr>
                                                                        );
                                                                    })}
                                                            </tbody>
                                                        </table>
                                                        <div className="p-4 bg-muted">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-medium">Leyenda:</span>
                                                                <div className="flex gap-2">
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                                                                        <span>4.5-5.0</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-green-400 rounded"></div>
                                                                        <span>3.5-4.4</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                                                                        <span>2.5-3.4</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-orange-400 rounded"></div>
                                                                        <span>1.5-2.4</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-red-400 rounded"></div>
                                                                        <span>1.0-1.4</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                                                        <span>Sin datos</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Alert>
                                                        <AlertDescription>
                                                            No hay datos de competencias disponibles para generar el heatmap.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                            
                                            {/* Progreso por Competencia */}
                                            <div>
                                                <h4 className="text-lg font-semibold mb-4">Progreso por Competencia</h4>
                                                {competenciasData.progresoPorCompetencia.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {competenciasData.progresoPorCompetencia.slice(0, 5).map((comp: any, idx: number) => (
                                                            <Card key={idx}>
                                                                <CardHeader>
                                                                    <CardTitle className="text-sm">{comp.competencia}</CardTitle>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <ResponsiveContainer width="100%" height={200}>
                                                                        <LineChart data={comp.progreso}>
                                                                            <CartesianGrid strokeDasharray="3 3" />
                                                                            <XAxis 
                                                                                dataKey="evaluacion" 
                                                                                tick={{ fontSize: 10 }}
                                                                                angle={-45}
                                                                                textAnchor="end"
                                                                                height={60}
                                                                            />
                                                                            <YAxis 
                                                                                domain={[0, 5]}
                                                                                tick={{ fontSize: 10 }}
                                                                                label={{ value: 'Nivel de Logro', angle: -90, position: 'insideLeft' }}
                                                                            />
                                                                            <RechartsTooltip />
                                                                            <Line 
                                                                                type="monotone" 
                                                                                dataKey="promedio" 
                                                                                stroke="#3b82f6" 
                                                                                strokeWidth={2}
                                                                                dot={{ r: 4 }}
                                                                                name="Promedio"
                                                                            />
                                                                        </LineChart>
                                                                    </ResponsiveContainer>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                        {competenciasData.progresoPorCompetencia.length > 5 && (
                                                            <p className="text-sm text-muted-foreground text-center">
                                                                Mostrando 5 de {competenciasData.progresoPorCompetencia.length} competencias
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Alert>
                                                        <AlertDescription>
                                                            No hay datos suficientes para mostrar el progreso por competencia.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        );
        } catch (error) {
            console.error('❌ Error in renderProgressView:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
            return (
                <Card>
                    <CardContent className="p-6">
                        <Alert variant="destructive">
                            <AlertTitle>Error al cargar el dashboard de progreso</AlertTitle>
                            <AlertDescription>
                                Ocurrió un error al renderizar el dashboard. Por favor, recarga la página o contacta al administrador.
                                <br />
                                <span className="text-xs mt-2 block">Error: {error instanceof Error ? error.message : String(error)}</span>
                                <br />
                                <span className="text-xs mt-2 block">Abre la consola del navegador (F12) para ver más detalles.</span>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b mb-6">
                <Button
                    variant={viewMode === 'new' ? 'default' : 'ghost'}
                    onClick={() => { setViewMode('new'); setSelectedMinuta(null); }}
                    className={`rounded-none border-b-2 ${viewMode === 'new' ? 'border-primary' : 'border-transparent'}`}
                >
                    Nueva Reunión
                </Button>
                <Button
                    variant={viewMode === 'history' ? 'default' : 'ghost'}
                    onClick={() => { setViewMode('history'); setSelectedMinuta(null); }}
                    className={`rounded-none border-b-2 ${viewMode === 'history' ? 'border-primary' : 'border-transparent'}`}
                >
                    Historial de Reuniones
                </Button>
                <Button
                    variant={viewMode === 'progress' ? 'default' : 'ghost'}
                    onClick={() => { setViewMode('progress'); setSelectedMinuta(null); }}
                    className={`rounded-none border-b-2 ${viewMode === 'progress' ? 'border-primary' : 'border-transparent'}`}
                >
                    Progreso del Lapso
                </Button>
            </div>
            {viewMode === 'new' ? renderNewMeetingForm() : 
             viewMode === 'history' ? renderHistoryView() : 
             renderProgressView()}
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const { showToast } = useToast();
    
    // Usuario por defecto sin requerir login
    const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Helper function to convert HorarioDB to Horario
    const convertHorario = (db: any): Horario => {
        // HorarioDB has grado and semana, but Horario interface doesn't
        // These are handled separately in WeeklySchedules structure
        const { created_at, updated_at, grado, semana, ...horario } = db;
        return {
            ...horario,
            id_aula: horario.id_aula || null // Asegurar que id_aula se preserve
        } as Horario;
    };

    // Data states - loaded from Supabase
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [clases, setClases] = useState<Clase[]>([]);
    const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
    const [schedules, setSchedules] = useState<WeeklySchedules>({});
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [minutas, setMinutas] = useState<MinutaEvaluacion[]>([]);
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [classesTodayCount, setClassesTodayCount] = useState<number>(0);

    // Loading states
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // View-specific states
    const [selectedStudent, setSelectedStudent] = useState<Alumno | null>(null);
    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Alumno | null>(null);
    const [navParams, setNavParams] = useState<any>(null);
    
    // Estados para confirmaciones
    const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<{ open: boolean; studentId: string | null }>({ open: false, studentId: null });
    
    // Estado para ayuda de atajos de teclado
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    
    // Estado para paleta de comandos (Cmd+K)
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    
    // Estado para preferencias de usuario
    const [showPreferences, setShowPreferences] = useState(false);
    
    // Helper function to convert DB types to App types
    const convertAlumno = (db: AlumnoDB): Alumno => {
        const { created_at, updated_at, ...alumno } = db;
        return alumno as Alumno;
    };

    const convertClase = (db: ClaseDB): Clase => {
        const { created_at, updated_at, student_ids, ...clase } = db;
        return {
            ...clase,
            studentIds: student_ids || []
        };
    };

    // Helper to convert App types to DB types for saving
    const convertAlumnoToDB = (alumno: Alumno): Omit<AlumnoDB, 'created_at' | 'updated_at'> => {
        const { studentIds, ...db } = alumno;
        return db as any;
    };

    const convertClaseToDB = (clase: Clase): Omit<ClaseDB, 'created_at' | 'updated_at'> => {
        const { studentIds, ...db } = clase;
        return {
            ...db,
            student_ids: studentIds
        };
    };

    // Load all data from Supabase
    const loadAllData = async () => {
        // Removido: if (!currentUser) return; - Ahora la plataforma está abierta

        setIsLoadingData(true);
        setDataError(null);

        try {
            // Helper function to handle errors
            const handleError = (err: any, serviceName: string) => {
                // Rate limiting
                if (err?.message?.includes('429') || err?.code === 'PGRST301') {
                    console.warn(`Rate limit for ${serviceName}. Will retry later.`);
                    return [];
                }
                // RLS/permission errors
                if (err?.code === '42501' || err?.message?.includes('permission') || err?.message?.includes('row-level security')) {
                    console.error(`❌ RLS bloqueando acceso a ${serviceName}. Ejecuta DESHABILITAR_RLS_TODAS_TABLAS_COMPLETO.sql`, err);
                    setDataError(`Error de permisos al cargar ${serviceName}. Verifica las políticas RLS.`);
                    return [];
                }
                // Other errors
                console.error(`Error loading ${serviceName}:`, err);
                return [];
            };

            // Load all data in parallel with error handling
            const [alumnosData, docentesData, clasesData, planificacionesData, horariosData, minutasData, notificationsData, aulasData] = await Promise.all([
                alumnosService.getAll().catch((err) => handleError(err, 'alumnos')),
                docentesService.getAll().catch((err) => handleError(err, 'docentes')),
                clasesService.getAll().catch((err) => handleError(err, 'clases')),
                planificacionesService.getAll().catch((err) => handleError(err, 'planificaciones')),
                horariosService.getAll().catch((err) => handleError(err, 'horarios')),
                minutasService.getAll().catch((err) => handleError(err, 'minutas')),
                notificacionesService.getAll().catch((err) => handleError(err, 'notificaciones')),
                aulasService.getAll().catch((err) => handleError(err, 'aulas'))
            ]);

            setAlumnos(alumnosData.map(convertAlumno));
            setDocentes(docentesData);
            setClases(clasesData.map(convertClase));
            setPlanificaciones(planificacionesData);
            setMinutas(minutasData);
            setAulas(aulasData);
            setNotifications(notificationsData.map(n => {
                const linkTo = typeof n.link_to === 'string' ? JSON.parse(n.link_to) : n.link_to;
                return {
                    ...n,
                    recipientId: n.recipient_id,
                    linkTo: linkTo || { view: 'dashboard' }
                };
            }));

            // Build schedules from horarios
            // CORRECCIÓN: Corregir horarios que tienen id_docente null pero deberían tenerlo
            const correctedHorarios = horariosData.map(h => {
                if (!h.id_docente && h.id_clase) {
                    const clase = clasesData.find(c => c.id_clase === h.id_clase);
                    if (clase?.id_docente_asignado) {
                        return { ...h, id_docente: clase.id_docente_asignado };
                    }
                }
                return h;
            });

            const schedulesMap: WeeklySchedules = {};
            correctedHorarios.forEach(h => {
                if (!schedulesMap[h.grado]) {
                    schedulesMap[h.grado] = {};
                }
                if (!schedulesMap[h.grado][h.semana]) {
                    schedulesMap[h.grado][h.semana] = [];
                }
                schedulesMap[h.grado][h.semana].push(convertHorario(h));
            });
            setSchedules(schedulesMap);

        } catch (error: any) {
            console.error('Error loading data:', error);
            setDataError('Error al cargar los datos. Por favor, recarga la página.');
        } finally {
            setIsLoadingData(false);
        }
    };

    // Load data when user logs in
    useEffect(() => {
        if (currentUser) {
            loadAllData();
        }
    }, [currentUser]);

    // Calcular clases de hoy cuando cambien los horarios
    useEffect(() => {
        const calculateToday = async () => {
            if (Object.keys(schedules).length > 0) {
                const anoEscolar = '2025-2026'; // TODO: Obtener del contexto/configuración
                const count = await calculateClassesToday(schedules, anoEscolar);
                setClassesTodayCount(count);
            } else {
                setClassesTodayCount(0);
            }
        };

        calculateToday();
    }, [schedules]);

    // Sync schedules to Supabase when they change
    const syncSchedulesToSupabase = async (schedulesToSync: WeeklySchedules) => {
        if (!currentUser) return;

        try {
            // Get all current horarios from DB
            const allHorarios = await horariosService.getAll();

            // Create a map of existing horarios by grado-semana for efficient lookup
            const existingMap = new Map<string, HorarioDB>();
            allHorarios.forEach(h => {
                const key = `${h.grado}-${h.semana}-${h.dia_semana}-${h.hora_inicio}`;
                existingMap.set(key, h);
            });

            // Build map of new horarios
            const newHorariosMap = new Map<string, Omit<HorarioDB, 'id_horario' | 'created_at' | 'updated_at'>>();
            const horariosToCreate: Array<Omit<HorarioDB, 'id_horario' | 'created_at' | 'updated_at'>> = [];
            const horariosToDelete: string[] = [];

            for (const [grado, weeks] of Object.entries(schedulesToSync)) {
                for (const [semanaStr, horarios] of Object.entries(weeks)) {
                    const semana = parseInt(semanaStr);
                    for (const horario of horarios) {
                        const key = `${grado}-${semana}-${horario.dia_semana}-${horario.hora_inicio}`;
                        const newHorario = {
                            grado,
                            semana,
                            id_docente: horario.id_docente,
                            id_clase: horario.id_clase,
                            dia_semana: horario.dia_semana,
                            hora_inicio: horario.hora_inicio,
                            hora_fin: horario.hora_fin,
                            evento_descripcion: horario.evento_descripcion
                        };
                        newHorariosMap.set(key, newHorario);

                        // Check if this horario already exists
                        const existing = existingMap.get(key);
                        if (!existing) {
                            horariosToCreate.push(newHorario);
                        } else {
                            // Check if it needs updating
                            if (existing.id_docente !== newHorario.id_docente ||
                                existing.id_clase !== newHorario.id_clase ||
                                existing.hora_fin !== newHorario.hora_fin ||
                                existing.evento_descripcion !== newHorario.evento_descripcion) {
                                await horariosService.update(existing.id_horario, {
                                    id_docente: newHorario.id_docente,
                                    id_clase: newHorario.id_clase,
                                    hora_fin: newHorario.hora_fin,
                                    evento_descripcion: newHorario.evento_descripcion
                                }).catch(err => console.error('Error updating horario:', err));
                            }
                        }
                    }
                }
            }

            // Find horarios to delete (exist in DB but not in new schedules)
            existingMap.forEach((horario, key) => {
                if (!newHorariosMap.has(key)) {
                    horariosToDelete.push(horario.id_horario);
                }
            });

            // Delete removed horarios
            if (horariosToDelete.length > 0) {
                for (const id of horariosToDelete) {
                    await horariosService.delete(id).catch(err => console.error('Error deleting horario:', err));
                }
            }

            // Batch insert new horarios (Supabase supports up to 1000 rows per insert)
            if (horariosToCreate.length > 0) {
                const batchSize = 100;
                for (let i = 0; i < horariosToCreate.length; i += batchSize) {
                    const batch = horariosToCreate.slice(i, i + batchSize);
                    await supabase.from('horarios').insert(batch).catch(err => {
                        console.error('Error inserting horarios batch:', err);
                    });
                }
            }
        } catch (error: any) {
            console.error('Error syncing schedules to Supabase:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
    };

    // Debounced sync of schedules (wait 2 seconds after last change)
    useEffect(() => {
        if (!currentUser || Object.keys(schedules).length === 0) return;

        const timeoutId = setTimeout(() => {
            syncSchedulesToSupabase(schedules);
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [schedules, currentUser]);


    // AUTENTICACIÓN DESHABILITADA - Plataforma abierta
    // useEffect para verificación de sesión comentado
    /*
    useEffect(() => {
      // Check for existing session
      const checkSession = async () => {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            // No hacer signOut por errores temporales de sesión
            return;
          }
          
          if (session?.user?.email) {
            // Verify user is authorized and get their role
            const { data: authorizedUser, error: authError } = await supabase
              .from('authorized_users')
              .select('*')
              .eq('email', session.user.email.toLowerCase())
              .maybeSingle(); // Usar maybeSingle para evitar errores si hay problemas temporales
  
            // Si hay un error de RLS, red o rate limiting, no hacer signOut
            if (authError) {
              // Si es un error 429 (Too Many Requests), esperar y no hacer signOut
              if (authError.code === 'PGRST301' || 
                  authError.message?.includes('429') || 
                  authError.message?.includes('rate limit') ||
                  authError.message?.includes('Too Many Requests')) {
                console.warn('Rate limit alcanzado (429). Manteniendo sesión, se reintentará más tarde.');
                return; // No hacer signOut, solo esperar
              }
              
              // Si es un error 500 o de servidor, no hacer signOut
              if (authError.message?.includes('500') || authError.code === 'PGRST301') {
                console.warn('Error del servidor, no se hará signOut');
                return;
              }
              
              // Si es un error 406 (Not Acceptable) o error de RLS, no hacer signOut
              if (authError.code === '42501' ||
                  authError.message?.includes('406') ||
                  authError.message?.includes('permission') ||
                  authError.message?.includes('row-level security')) {
                console.warn('Error temporal verificando autorización, no se hará signOut');
                return;
              }
              
              // Para otros errores desconocidos, también no hacer signOut automáticamente
              // Solo registrar el error (sin console.error para evitar spam)
              if (!authError.message?.includes('JWT') && !authError.message?.includes('token')) {
                console.warn('Error verificando autorización:', authError.message || authError.code);
              }
              return;
            }
  
            if (authorizedUser) {
              const fullName = session.user.user_metadata?.full_name || 
                              session.user.user_metadata?.name ||
                              session.user.email.split('@')[0];
  
              // For docentes, try to link to existing docente record by email
              let docenteId: string | undefined = undefined;
              if (authorizedUser.role === 'docente') {
                try {
                  // Try to find existing docente by email
                  const { data: docente } = await supabase
                    .from('docentes')
                    .select('id_docente, id_usuario')
                    .eq('email', session.user.email.toLowerCase())
                    .maybeSingle(); // Usar maybeSingle también aquí
  
                  if (docente) {
                    docenteId = docente.id_docente;
                    // If docente exists but id_usuario is not set, update it
                    if (!docente.id_usuario) {
                      await supabase
                        .from('docentes')
                        .update({ id_usuario: session.user.id })
                        .eq('id_docente', docente.id_docente);
                    }
                  } else {
                    // If no docente exists, create one automatically
                    const { data: newDocente } = await supabase
                      .from('docentes')
                      .insert({
                        email: session.user.email.toLowerCase(),
                        nombres: fullName.split(' ')[0] || '',
                        apellidos: fullName.split(' ').slice(1).join(' ') || '',
                        id_usuario: session.user.id,
                        telefono: '',
                        especialidad: '',
                      })
                      .select('id_docente')
                      .single();
  
                    if (newDocente) {
                      docenteId = newDocente.id_docente;
                    }
                  }
                } catch (error) {
                  console.error('Error linking docente:', error);
                  // Continue even if linking fails
                }
              }
  
              setCurrentUser({
                id: session.user.id,
                email: session.user.email,
                role: authorizedUser.role as UserRole,
                fullName: fullName,
                docenteId: docenteId,
              });
            } else {
              // Solo hacer signOut si realmente el usuario NO está autorizado
              // (no si hay un error temporal)
              console.log('User not found in authorized_users, signing out');
              await supabase.auth.signOut();
            }
          }
        } catch (error) {
          console.error('Error in checkSession:', error);
          // No hacer signOut por errores inesperados - mantener la sesión
        }
      };
  
      checkSession();
  
      // Listen for auth state changes (con throttling para evitar loops)
      let lastAuthCheck = 0;
      const AUTH_CHECK_THROTTLE = 2000; // 2 segundos entre verificaciones
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          // Throttle: solo verificar si pasaron al menos 2 segundos desde la última verificación
          const now = Date.now();
          if (now - lastAuthCheck < AUTH_CHECK_THROTTLE) {
            return; // Saltar esta verificación
          }
          lastAuthCheck = now;
          
          // Verificar autorización solo si hay sesión
          if (session?.user?.email) {
            try {
              const { data: authorizedUser } = await supabase
                .from('authorized_users')
                .select('*')
                .eq('email', session.user.email.toLowerCase())
                .maybeSingle();
              
              if (authorizedUser) {
                const { data: userData } = await supabase.auth.getUser();
                const fullName = userData.user?.user_metadata?.full_name || 
                               userData.user?.user_metadata?.name || 
                               session.user.email?.split('@')[0] || '';
                
                setCurrentUser({
                  id: session.user.id,
                  email: session.user.email,
                  role: authorizedUser.role as UserRole,
                  fullName: fullName,
                });
              }
            } catch (error) {
              console.error('Error en onAuthStateChange:', error);
              // No hacer signOut por errores
            }
          }
        }
      });
  
      return () => {
        subscription.unsubscribe();
      };
    }, []);
    */

    const handleLoginSuccess = async (user: { id: string; email: string; username: string; role: string; fullName?: string }) => {
        // For docentes, try to link to existing docente record by email
        let docenteId: string | undefined = undefined;
        if (user.role === 'docente') {
            try {
                // Try to find existing docente by email
                const { data: docente } = await supabase
                    .from('docentes')
                    .select('id_docente, id_usuario')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle(); // Use maybeSingle to avoid errors

                if (docente) {
                    docenteId = docente.id_docente;
                    // If docente exists but id_usuario is not set, update it
                    if (!docente.id_usuario) {
                        await supabase
                            .from('docentes')
                            .update({ id_usuario: user.id })
                            .eq('id_docente', docente.id_docente);
                    }
                } else {
                    // If no docente exists, create one automatically
                    const { data: newDocente } = await supabase
                        .from('docentes')
                        .insert({
                            email: user.email.toLowerCase(),
                            nombres: user.fullName?.split(' ')[0] || '',
                            apellidos: user.fullName?.split(' ').slice(1).join(' ') || '',
                            id_usuario: user.id,
                            telefono: '',
                            especialidad: '',
                        })
                        .select('id_docente')
                        .maybeSingle(); // Use maybeSingle to avoid errors

                    if (newDocente) {
                        docenteId = newDocente.id_docente;
                    }
                }
            } catch (error: any) {
                // Only log non-rate-limit errors
                if (!error?.message?.includes('429') && !error?.code?.includes('429')) {
                    console.error('Error linking docente:', error);
                }
                // Continue even if linking fails
            }
        }

        setCurrentUser({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role as UserRole,
            fullName: user.fullName || user.username,
            docenteId: docenteId,
        });
        setShowLogin(false);
        setActiveView('dashboard');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setShowLogin(true);
    };

    const handleNavigate = (view: string, params: any = null) => {
        if (view === 'students' && selectedStudent) {
            setSelectedStudent(null); // Reset detail view when navigating away
        }
        setActiveView(view);
        setNavParams(params);
    };
    
    // Atajos de teclado globales
    useGlobalShortcuts(handleNavigate);
    
    // Atajo para mostrar ayuda (Shift + ?)
    useKeyboardShortcuts(
        [
            {
                key: '?',
                shift: true,
                action: () => setShowShortcutsHelp(true),
                description: 'Mostrar ayuda de atajos',
            },
            {
                key: 'k',
                ctrl: true,
                action: () => setShowCommandPalette(true),
                description: 'Abrir búsqueda global',
            },
        ],
        true
    );

    const handleNotificationClick = async (notification: Notification) => {
        try {
            await notificacionesService.markAsRead(notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            handleNavigate(notification.linkTo.view, notification.linkTo.params);
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            // Still navigate even if marking as read fails
            handleNavigate(notification.linkTo.view, notification.linkTo.params);
        }
    };

    // Student CRUD handlers
    const handleOpenStudentModal = (student: Alumno | null = null) => {
        setEditingStudent(student);
        setStudentModalOpen(true);
    };

    const handleCloseStudentModal = () => {
        setEditingStudent(null);
        setStudentModalOpen(false);
    };

    const handleSaveStudent = async (studentData: Alumno) => {
        try {
            if (editingStudent) {
                // Update existing student
                const dbData = convertAlumnoToDB(studentData);
                const updated = await alumnosService.update(studentData.id_alumno, dbData);
                setAlumnos(prev => prev.map(s => s.id_alumno === updated.id_alumno ? convertAlumno(updated) : s));
                showToast({
                    type: 'success',
                    title: 'Alumno actualizado',
                    message: `${studentData.nombres} ${studentData.apellidos} ha sido actualizado correctamente`,
                });
            } else {
                // Create new student
                const { id_alumno, ...newStudent } = studentData;
                const dbData = convertAlumnoToDB(newStudent as Alumno);
                const created = await alumnosService.create(dbData);
                setAlumnos(prev => [...prev, convertAlumno(created)]);
                showToast({
                    type: 'success',
                    title: 'Alumno creado',
                    message: `${studentData.nombres} ${studentData.apellidos} ha sido agregado correctamente`,
                });
            }
            handleCloseStudentModal();
        } catch (error: any) {
            console.error('Error saving student:', error);
            showToast({
                type: 'error',
                title: 'Error al guardar',
                message: error.message || 'No se pudo guardar el alumno. Por favor, inténtalo de nuevo.',
            });
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        setConfirmDeleteStudent({ open: true, studentId });
    };

    const confirmDeleteStudentAction = async () => {
        if (!confirmDeleteStudent.studentId) return;
        
        const student = alumnos.find(s => s.id_alumno === confirmDeleteStudent.studentId);
        const studentName = student ? `${student.nombres} ${student.apellidos}` : 'este alumno';
        
        try {
            await alumnosService.delete(confirmDeleteStudent.studentId);
            setAlumnos(prev => prev.filter(s => s.id_alumno !== confirmDeleteStudent.studentId));
            setConfirmDeleteStudent({ open: false, studentId: null });
            showToast({
                type: 'success',
                title: 'Alumno eliminado',
                message: `${studentName} ha sido eliminado correctamente`,
            });
        } catch (error: any) {
            console.error('Error deleting student:', error);
            showToast({
                type: 'error',
                title: 'Error al eliminar',
                message: error.message || 'No se pudo eliminar el alumno. Por favor, inténtalo de nuevo.',
            });
        }
    };


    const renderView = () => {
        if (activeView === 'students' && selectedStudent) {
            return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />
        }
        switch (activeView) {
            case 'dashboard':
                return <DashboardView
                    stats={{ totalStudents: alumnos.length, totalTeachers: docentes.length, classesToday: classesTodayCount }}
                    currentUser={currentUser!}
                    schedules={schedules}
                    clases={clases}
                    docentes={docentes}
                    alumnos={alumnos}
                    planificaciones={planificaciones}
                    aulas={aulas}
                />;
            case 'students':
                return <StudentListView
                    students={alumnos}
                    onSelectStudent={setSelectedStudent}
                    onAddStudent={() => handleOpenStudentModal(null)}
                    onEditStudent={handleOpenStudentModal}
                    onDeleteStudent={handleDeleteStudent}
                    onOpenBulkImport={() => {
                        console.log('🟢 onOpenBulkImport called, setting isBulkImportOpen to true');
                        setIsBulkImportOpen(true);
                    }}
                />;
            case 'teachers':
                return <TeachersView docentes={docentes} clases={clases} alumnos={alumnos} aulas={aulas} setDocentes={setDocentes} setClases={setClases} currentUser={currentUser!} />;
            case 'planning':
                return <PlanningView planificaciones={planificaciones} setPlanificaciones={setPlanificaciones} clases={clases} docentes={docentes} currentUser={currentUser!} navParams={navParams} />;
            case 'calendar':
                return <CalendarView currentUser={currentUser!} />;
            case 'schedules':
                return <ScheduleView schedules={schedules} setSchedules={setSchedules} clases={clases} docentes={docentes} currentUser={currentUser!} alumnos={alumnos} aulas={aulas} convertHorario={convertHorario} />;
            case 'team-schedules':
                return <TeamScheduleView docentes={docentes} schedules={schedules} setSchedules={setSchedules} clases={clases} alumnos={alumnos} aulas={aulas} />;
            case 'schedule-generator':
                return <ScheduleGeneratorView currentUser={currentUser!} />;
            case 'evaluation':
                return <EvaluationView alumnos={alumnos} clases={clases} minutas={minutas} setMinutas={setMinutas} currentUser={currentUser!} />;
            case 'indicadores':
                return <GestionIndicadores clases={clases} />;
            case 'authorized-users':
                return (
                    <Suspense fallback={
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    }>
                        <AuthorizedUsersView currentUser={currentUser!} />
                    </Suspense>
                );
            case 'lapsos-admin':
                return <LapsosAdminView currentUser={currentUser!} />;
            default:
                return <div className="bg-white p-6 rounded-lg shadow-md"><h2>Vista no implementada</h2><p>La funcionalidad para "{activeView}" estará disponible próximamente.</p></div>;
        }
    };

    const viewTitles: { [key: string]: string } = {
        dashboard: 'Dashboard',
        students: selectedStudent ? `Detalle de ${selectedStudent.nombres}` : 'Gestión de Alumnos',
        teachers: 'Gestión de Docentes',
        schedules: 'Gestión de Horarios',
        'schedule-generator': 'Generador de Horarios',
        'team-schedules': 'Horarios de Equipo',
        calendar: 'Calendario',
        planning: 'Planificaciones',
        evaluation: 'Seguimiento Pedagógico',
        'authorized-users': 'Gestión de Usuarios',
        'lapsos-admin': 'Gestión de Lapsos',
    };

    const getBreadcrumbs = () => {
        const items = [
            { label: 'Inicio', onClick: () => handleNavigate('dashboard'), icon: Home },
        ];

        if (activeView !== 'dashboard') {
            if (activeView === 'students' && selectedStudent) {
                items.push(
                    { label: 'Alumnos', onClick: () => { handleNavigate('students'); setSelectedStudent(null); } },
                    { label: selectedStudent.nombres }
                );
            } else {
                items.push({ label: viewTitles[activeView] || activeView });
            }
        }

        return items;
    };

    // Show login screen if no user is logged in
    if (!currentUser || showLogin) {
        return (
            <Suspense fallback={
                <div className="flex h-screen bg-gradient-to-br from-manglar-orange-light via-background to-manglar-green-light items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-manglar-orange to-manglar-green flex items-center justify-center shadow-lg animate-pulse">
                                <span className="text-white font-bold text-2xl">M</span>
                            </div>
                        </div>
                        <LoadingSpinner size="md" />
                    </div>
                </div>
            }>
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </Suspense>
        );
    }

    if (isLoadingData) {
        return (
            <div className="flex h-screen bg-gradient-to-br from-manglar-orange-light via-background to-manglar-green-light items-center justify-center">
                <div className="text-center space-y-6 w-full max-w-md px-4">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-manglar-orange to-manglar-green flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-3xl">M</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-manglar-orange border-t-transparent"></div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48 mx-auto" />
                            <Skeleton className="h-4 w-64 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (dataError) {
        return (
            <div className="flex h-screen bg-background items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6">
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Error al cargar datos</AlertTitle>
                            <AlertDescription>{dataError}</AlertDescription>
                        </Alert>
                        <Button onClick={() => loadAllData()} className="w-full">
                            Reintentar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background-light overflow-hidden">
            <Sidebar
                activeView={activeView}
                onNavigate={handleNavigate}
                userRole={currentUser.role}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header
                    title={viewTitles[activeView] || 'ManglarNet'}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />
                <div className="p-3 sm:p-4 lg:p-6 flex-1 overflow-y-auto">
                    {/* Breadcrumbs */}
                    {(activeView !== 'dashboard' || selectedStudent) && (
                        <div className="mb-4 animate-slide-up">
                            <Breadcrumbs items={getBreadcrumbs()} />
                        </div>
                    )}
                    {renderView()}
                </div>
            </main>
            
            {/* Confirmación de eliminación de estudiante */}
            <ConfirmDialog
                open={confirmDeleteStudent.open}
                onOpenChange={(open) => setConfirmDeleteStudent({ open, studentId: open ? confirmDeleteStudent.studentId : null })}
                onConfirm={confirmDeleteStudentAction}
                title="Eliminar Alumno"
                description={
                    confirmDeleteStudent.studentId
                        ? `¿Está seguro de que desea eliminar a ${alumnos.find(s => s.id_alumno === confirmDeleteStudent.studentId)?.nombres} ${alumnos.find(s => s.id_alumno === confirmDeleteStudent.studentId)?.apellidos}? Esta acción no se puede deshacer.`
                        : ''
                }
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
            
            {isStudentModalOpen && (
                <StudentFormModal
                    student={editingStudent}
                    onClose={handleCloseStudentModal}
                    onSave={handleSaveStudent}
                />
            )}
            {isBulkImportOpen && (
                <>
                    {console.log('🟡 Rendering BulkImportModal, isBulkImportOpen:', isBulkImportOpen)}
                    <BulkImportModal
                        isOpen={isBulkImportOpen}
                        onClose={() => {
                            console.log('🔴 Closing BulkImportModal');
                            setIsBulkImportOpen(false);
                        }}
                        onSuccess={() => {
                            console.log('✅ Import successful, reloading students');
                            loadAlumnos(); // Reload students after successful import
                        }}
                    />
                </>
            )}
            
            {/* Onboarding Tour */}
            {currentUser && (
                <OnboardingTour
                    steps={[
                        {
                            id: 'welcome',
                            title: '¡Bienvenido a ManglarNet!',
                            description: 'Te guiaremos por las características principales de la plataforma para que puedas aprovecharla al máximo.',
                        },
                        {
                            id: 'navigation',
                            title: 'Navegación Rápida',
                            description: (
                                <div className="space-y-2">
                                    <p>Usa el menú lateral para navegar entre las diferentes secciones.</p>
                                    <p className="text-xs text-muted-foreground">
                                        💡 <strong>Tip:</strong> Presiona <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl/Cmd + K</kbd> para búsqueda rápida
                                    </p>
                                </div>
                            ),
                        },
                        {
                            id: 'search',
                            title: 'Búsqueda Global',
                            description: 'Presiona Ctrl/Cmd + K para buscar estudiantes, docentes o navegar rápidamente a cualquier sección.',
                        },
                        {
                            id: 'theme',
                            title: 'Personalización',
                            description: 'Puedes cambiar entre modo claro y oscuro usando el botón en el header. Tus preferencias se guardan automáticamente.',
                        },
                        {
                            id: 'shortcuts',
                            title: 'Atajos de Teclado',
                            description: (
                                <div className="space-y-2">
                                    <p>Usa atajos de teclado para ser más productivo:</p>
                                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                        <li><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl/Cmd + K</kbd> - Búsqueda global</li>
                                        <li><kbd className="px-1 py-0.5 bg-muted rounded">Shift + ?</kbd> - Ver todos los atajos</li>
                                        <li><kbd className="px-1 py-0.5 bg-muted rounded">/</kbd> - Buscar en vista actual</li>
                                    </ul>
                                </div>
                            ),
                        },
                    ]}
                    onComplete={() => {
                        if (currentUser) {
                            localStorage.setItem(`manglar-onboarding-${currentUser.id}`, 'true');
                        }
                    }}
                    onSkip={() => {
                        if (currentUser) {
                            localStorage.setItem(`manglar-onboarding-${currentUser.id}`, 'true');
                        }
                    }}
                    storageKey={`manglar-onboarding-${currentUser?.id || 'guest'}`}
                />
            )}
            
            {/* Diálogo de preferencias de usuario */}
            {currentUser && (
                <UserPreferencesDialog
                    open={showPreferences}
                    onOpenChange={setShowPreferences}
                    userId={currentUser.id}
                />
            )}
            
            {/* Paleta de comandos (Cmd/Ctrl + K) */}
            <CommandPalette
                open={showCommandPalette}
                onOpenChange={setShowCommandPalette}
                onNavigate={handleNavigate}
                students={alumnos.map(a => ({
                    id_alumno: a.id_alumno,
                    nombres: a.nombres,
                    apellidos: a.apellidos,
                    salon: a.salon,
                }))}
                teachers={docentes.map(d => ({
                    id_docente: d.id_docente,
                    nombres: d.nombres,
                    apellidos: d.apellidos,
                }))}
                currentView={activeView}
            />
            
            {/* Diálogo de ayuda de atajos de teclado */}
            <KeyboardShortcutsHelp
                open={showShortcutsHelp}
                onOpenChange={setShowShortcutsHelp}
                shortcuts={[
                    { keys: ['Ctrl', 'K'], description: 'Abrir búsqueda global', category: 'Navegación' },
                    { keys: ['Ctrl', 'N'], description: 'Ir al Dashboard', category: 'Navegación' },
                    { keys: ['/'], description: 'Buscar en vista actual', category: 'Navegación' },
                    { keys: ['Shift', '?'], description: 'Mostrar esta ayuda', category: 'General' },
                    { keys: ['Esc'], description: 'Cerrar diálogos', category: 'General' },
                ]}
            />
        </div>
    );
};




export default App;

