
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DashboardIcon, StudentsIcon, TeachersIcon, ClassesIcon, PlusIcon, CloseIcon, EditIcon, DeleteIcon, ChevronDownIcon, LogoutIcon, PlanningIcon, GradesIcon, FilterIcon, CalendarIcon, SearchIcon, SpecialSubjectIcon, SparklesIcon, ArrowLeftIcon, UserCircleIcon, AcademicCapIcon, UsersIcon, IdentificationIcon, CakeIcon, LocationMarkerIcon, MailIcon, PhoneIcon, ClipboardCheckIcon, SendIcon, BellIcon, TagIcon, DownloadIcon, EvaluationIcon } from './components/Icons';
import { getAIPlanSuggestions, getAIEvaluationAnalysis } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { LoginScreen } from './components/LoginScreen';
import { AuthorizedUsersView } from './components/AuthorizedUsersView';
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


// --- DATABASE SCHEMA TYPES ---
// Based on the provided PostgreSQL schema

type UserRole = 'docente' | 'coordinador' | 'directivo' | 'administrativo';

interface Usuario {
  id: string; // UUID
  email: string;
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
  // Not in schema, but useful for frontend logic
  studentIds: string[];
}

interface Planificacion {
  id_planificacion: string; // UUID
  id_docente: string; // UUID
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
}

interface Horario {
  id_horario: string;
  id_docente: string | null; // Can be null for events
  id_clase: string | null; // Can be null for events
  dia_semana: number; // 1: Lunes, 2: Martes, ..., 5: Viernes
  hora_inicio: string; // e.g., "08:00"
  hora_fin: string; // e.g., "09:00"
  evento_descripcion?: string; // For non-class events
}

// --- NEW TYPES FOR EVALUATION MODULE ---
type Nota = 'A' | 'B' | 'C' | 'D' | 'E' | 'SE' | '';
type Adaptacion = 'Reg' | 'AC+' | 'AC-' | '';

interface EvaluacionAlumno {
  id_alumno: string;
  nota: Nota;
  adaptacion: Adaptacion;
  observaciones: string;
}

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
}


type WeeklySchedules = {
  [grade: string]: {
    [week: number]: Horario[];
  };
};

interface Assignment {
    subject: string;
    grade: string;
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

const mockUsuarios: Usuario[] = [
  { id: 'user-director-01', email: 'director@school.edu', role: 'directivo', fullName: 'Directivo General' },
  { id: 'user-coord-01', email: 'coord@school.edu', role: 'coordinador', fullName: 'Coordinador Académico' },
  { id: 'user-teacher-01', email: 'j.perez@school.edu', role: 'docente', docenteId: 'docente-01', fullName: 'Juan Pérez (Docente)' },
  { id: 'user-teacher-02', email: 'm.gomez@school.edu', role: 'docente', docenteId: 'docente-02', fullName: 'Maria Gómez (Docente)' },
  { id: 'user-admin-01', email: 'admin@school.edu', role: 'administrativo', fullName: 'Personal Administrativo' },
];

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
        ano_escolar: '2024-2025',
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
        ano_escolar: '2024-2025',
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
        ano_escolar: '2024-2025',
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
    "1er Año", "2do Año", "3er Año", "4to Año", "5to Año"
];


const subjectColors: { [key: string]: string } = {
  'Matemáticas': '#FEE2E2', // Red
  'Ciencias': '#D1FAE5',         // Green
  'Sociales': '#FEF3C7',      // Amber
  'Ed, Física y Deporte': '#DBEAFE',// Blue
  'Inglés': '#E0E7FF',// Indigo
  'Lenguaje': '#F3E8FF', // Purple
  'default': '#F3F4F6',          // Gray
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


// --- UI COMPONENTS ---

const Header: React.FC<{
    title: string;
    currentUser: Usuario;
    onLogout: () => void;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
}> = ({ title, currentUser, onLogout, notifications, onNotificationClick }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead && n.recipientId === currentUser.docenteId).length;

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

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-text-main">{title}</h1>
            <div className="flex items-center gap-4">
                 {currentUser.role === 'docente' && (
                    <div className="relative">
                        <button onClick={() => setNotificationsOpen(!isNotificationsOpen)} className="relative text-gray-500 hover:text-gray-700">
                            <BellIcon className="h-6 w-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                            )}
                        </button>
                        {isNotificationsOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                <div className="p-2 border-b">
                                    <h3 className="font-semibold text-gray-800">Notificaciones</h3>
                                </div>
                                <div className="py-1 max-h-96 overflow-y-auto">
                                    {notifications.filter(n => n.recipientId === currentUser.docenteId).length > 0 ? (
                                        notifications.filter(n => n.recipientId === currentUser.docenteId)
                                            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                            .map(n => (
                                                <a
                                                    key={n.id}
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); onNotificationClick(n); setNotificationsOpen(false); }}
                                                    className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 ${!n.isRead ? 'bg-blue-50' : ''}`}
                                                >
                                                    <p className="font-bold">{n.title}</p>
                                                    <p className="text-gray-600 text-xs">{n.message}</p>
                                                    <p className="text-right text-xs text-gray-400 mt-1">{timeSince(n.timestamp)} ago</p>
                                                </a>
                                            ))
                                    ) : (
                                        <p className="text-center text-gray-500 py-4">No hay notificaciones.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div className="relative">
                    <button onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center gap-2 text-left">
                        <div>
                            <p className="font-semibold text-text-main">{currentUser.fullName}</p>
                            <p className="text-sm text-text-secondary capitalize">{currentUser.role}</p>
                        </div>
                        <ChevronDownIcon />
                    </button>
                    {isMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <a href="#" onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                    <LogoutIcon />
                                    Cerrar Sesión
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const Sidebar: React.FC<{
    activeView: string;
    onNavigate: (view: string) => void;
    userRole: UserRole;
}> = ({ activeView, onNavigate, userRole }) => {
    const navLinks = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['directivo', 'coordinador', 'docente', 'administrativo'] },
        { id: 'students', label: 'Alumnos', icon: StudentsIcon, roles: ['directivo', 'coordinador', 'administrativo'] },
        { id: 'teachers', label: 'Docentes', icon: TeachersIcon, roles: ['directivo', 'coordinador'] },
        { id: 'schedules', label: 'Horarios', icon: CalendarIcon, roles: ['coordinador', 'directivo'] },
        { id: 'team-schedules', label: 'Horarios Equipo', icon: UsersIcon, roles: ['coordinador', 'directivo'] },
        { id: 'planning', label: 'Planificaciones', icon: PlanningIcon, roles: ['directivo', 'coordinador', 'docente'] },
        { id: 'evaluation', label: 'Evaluación', icon: EvaluationIcon, roles: ['directivo', 'coordinador'] },
        { id: 'authorized-users', label: 'Usuarios Autorizados', icon: UsersIcon, roles: ['directivo'] },
    ].filter(link => link.roles.includes(userRole));

    return (
        <aside className="w-64 bg-background-dark text-white flex flex-col">
            <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-brand-secondary">ManglarNet</h2>
                <p className="text-sm text-gray-400">Conexión Pedagógica</p>
            </div>
            <nav className="flex-1 px-4">
                {navLinks.map(({ id, label, icon: Icon }) => (
                    <a
                        key={id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); onNavigate(id); }}
                        className={`flex items-center gap-3 px-4 py-3 my-1 rounded-md text-sm font-medium transition-colors ${
                            activeView === id
                                ? 'bg-brand-primary text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        <Icon className="h-5 w-5" />
                        {label}
                    </a>
                ))}
            </nav>
        </aside>
    );
};

const DashboardView: React.FC<{ 
    stats: { totalStudents: number, totalTeachers: number, classesToday: number };
    currentUser: Usuario;
    schedules: WeeklySchedules;
    clases: Clase[];
    docentes: Docente[];
    alumnos: Alumno[];
}> = ({ stats, currentUser, schedules, clases, docentes, alumnos }) => {
    
    if (currentUser.role === 'docente') {
        return <TeacherScheduleDashboard 
            schedules={schedules} 
            clases={clases}
            docentes={docentes}
            currentUser={currentUser}
            alumnos={alumnos}
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

    const cardColors = [
        'bg-blue-500', 'bg-green-500', 'bg-indigo-500', 
        'bg-pink-500', 'bg-purple-500', 'bg-yellow-600',
        'bg-red-500', 'bg-cyan-500', 'bg-teal-500',
        'bg-orange-500', 'bg-lime-500', 'bg-emerald-500'
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-text-main mb-6">Resumen de Alumnos por Grado</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedGrades.map((grade, index) => (
                    <div key={grade} className={`p-6 rounded-lg shadow-lg text-white ${cardColors[index % cardColors.length]}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-4xl font-bold">{studentsByGrade[grade]}</p>
                                <p className="text-lg font-semibold">{grade}</p>
                            </div>
                            <UsersIcon className="h-10 w-10 opacity-75" />
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gray-50 p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div>
                        <p className="text-4xl font-bold text-gray-800">{stats.totalTeachers}</p>
                        <p className="text-lg text-gray-600">Docentes Activos</p>
                    </div>
                    <AcademicCapIcon className="h-12 w-12 text-brand-primary" />
                </div>
                 <div className="bg-gray-50 p-6 rounded-lg shadow-md flex justify-between items-center">
                     <div>
                        <p className="text-4xl font-bold text-gray-800">{stats.classesToday}</p>
                        <p className="text-lg text-gray-600">Clases Hoy</p>
                    </div>
                    <CalendarIcon className="h-12 w-12 text-brand-primary" />
                </div>
            </div>
        </div>
    );
};

const TeacherScheduleDashboard: React.FC<{
    schedules: WeeklySchedules;
    clases: Clase[];
    docentes: Docente[];
    currentUser: Usuario;
    alumnos: Alumno[];
}> = ({ schedules, clases, docentes, currentUser, alumnos }) => {
    const scheduleTableRef = useRef<HTMLTableElement>(null);
    const [isDownloadMenuOpen, setDownloadMenuOpen] = useState(false);
    
    const allGrades = useMemo(() => {
        const gradeSet = new Set(alumnos.map(a => a.salon));
        Object.keys(schedules).forEach(grade => gradeSet.add(grade));
        return Array.from(gradeSet).sort();
    }, [schedules, alumnos]);

    const [selectedGrade, setSelectedGrade] = useState(allGrades.length > 0 ? allGrades[0] : '');
    const [currentWeek, setCurrentWeek] = useState(() => getWeekNumber(new Date('2024-09-01')));
    
    const weeklySchedule = useMemo(() => {
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

        const fileName = `horario-${selectedGrade.replace(/\s+/g, '-')}-semana-${currentWeek}`;

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

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-text-main">Mi Horario de Clases</h3>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm"
                    >
                        {allGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentWeek(w => Math.max(1, w - 1))} className="p-2 bg-gray-200 rounded-md">&lt;</button>
                        <span className="font-semibold w-24 text-center">Semana {currentWeek}</span>
                        <button onClick={() => setCurrentWeek(w => Math.min(18, w + 1))} className="p-2 bg-gray-200 rounded-md disabled:opacity-50" disabled={currentWeek >= 18}>&gt;</button>
                    </div>
                     <div className="relative">
                        <button
                            onClick={() => setDownloadMenuOpen(!isDownloadMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            <DownloadIcon />
                            Descargar Horario
                        </button>
                        {isDownloadMenuOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDownload('jpeg'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                        Exportar a JPEG
                                    </a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDownload('pdf'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                        Exportar a PDF
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-4" >
                <table ref={scheduleTableRef} className="min-w-full divide-y divide-gray-200 border bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Hora</th>
                            {WEEK_DAYS.map(day => <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {timeSlots.map(slot => (
                            <tr key={slot}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">{slot}</td>
                                {WEEK_DAYS.map((_, dayIndex) => {
                                    const day = dayIndex + 1;
                                    const item = weeklySchedule.find(s => s.dia_semana === day && s.hora_inicio.startsWith(slot.split(' - ')[0]));
                                    if (item) {
                                        if (item.evento_descripcion) {
                                            return (
                                                <td key={`${day}-${slot}`} className="border p-2 align-top text-xs relative h-24 bg-gray-200">
                                                    <div className="font-semibold text-gray-700 flex items-center gap-1">
                                                        <TagIcon className="h-4 w-4 text-gray-500" />
                                                        {item.evento_descripcion}
                                                    </div>
                                                </td>
                                            );
                                        } else if (item.id_clase) {
                                            const clase = clases.find(c => c.id_clase === item.id_clase);
                                            const docente = docentes.find(d => d.id_docente === item.id_docente);
                                            const isCurrentUserClass = item.id_docente === currentUser.docenteId;
                                    
                                            const bgColor = isCurrentUserClass 
                                                ? subjectColors[clase?.nombre_materia || 'default'] || subjectColors.default
                                                : '#F3F4F6'; 
                                            
                                            const textColor = isCurrentUserClass ? 'text-black' : 'text-gray-600';
                                    
                                            return (
                                                <td key={`${day}-${slot}`} className={`border p-2 align-top text-xs relative h-24 ${textColor}`} style={{ backgroundColor: bgColor }}>
                                                    <div className="font-bold">{clase?.nombre_materia}</div>
                                                    {!isCurrentUserClass && docente && (
                                                        <div className="text-gray-500 text-[10px]">{`${docente.nombres} ${docente.apellidos}`}</div>
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
        </div>
    );
}

const StudentListView: React.FC<{
    students: Alumno[];
    onSelectStudent: (student: Alumno) => void;
    onAddStudent: () => void;
    onEditStudent: (student: Alumno) => void;
    onDeleteStudent: (studentId: string) => void;
}> = ({ students, onSelectStudent, onAddStudent, onEditStudent, onDeleteStudent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('all');

    const grades = useMemo(() => ['all', ...Array.from(new Set(students.map(s => s.salon)))], [students]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const nameMatch = `${student.nombres} ${student.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());
            const gradeMatch = filterGrade === 'all' || student.salon === filterGrade;
            return nameMatch && gradeMatch;
        });
    }, [students, searchTerm, filterGrade]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-main">Lista de Alumnos</h2>
                <button onClick={onAddStudent} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                    <PlusIcon />
                    Añadir Alumno
                </button>
            </div>
            <div className="flex gap-4 mb-4">
                <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 p-2 border border-gray-300 rounded-md w-full"
                    />
                </div>
                <select
                    value={filterGrade}
                    onChange={e => setFilterGrade(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md"
                >
                    {grades.map(grade => <option key={grade} value={grade}>{grade === 'all' ? 'Todos los Salones' : grade}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salón</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula Escolar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condición</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map(student => (
                            <tr key={student.id_alumno} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{student.nombres} {student.apellidos}</div>
                                    <div className="text-sm text-gray-500">{student.email_alumno}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.salon}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.cedula_escolar}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.condicion === 'Regular' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {student.condicion}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                                    <button onClick={() => onSelectStudent(student)} className="text-brand-primary hover:underline">Ver Detalles</button>
                                    <button onClick={() => onEditStudent(student)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                    <button onClick={() => onDeleteStudent(student.id_alumno)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StudentDetailView: React.FC<{
    student: Alumno;
    onBack: () => void;
}> = ({ student, onBack }) => {
    const InfoItem: React.FC<{icon: React.ElementType, label: string, value?: string | string[]}> = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-gray-400 mt-1" />
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-medium text-gray-800">{Array.isArray(value) ? value.join(', ') : (value || 'N/A')}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeftIcon />
                Volver a la Lista
            </button>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 text-center">
                     <UserCircleIcon className="h-32 w-32 text-gray-300 mx-auto" />
                     <h2 className="text-2xl font-bold mt-4">{student.nombres} {student.apellidos}</h2>
                     <p className="text-gray-500">{student.salon}</p>
                </div>
                <div className="flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoItem icon={IdentificationIcon} label="Cédula Escolar" value={student.cedula_escolar} />
                        <InfoItem icon={CakeIcon} label="Fecha de Nacimiento" value={new Date(student.fecha_nacimiento).toLocaleDateString()} />
                        <InfoItem icon={LocationMarkerIcon} label="Lugar de Nacimiento" value={`${student.lugar_nacimiento}, ${student.estado}`} />
                        <InfoItem icon={AcademicCapIcon} label="Condición" value={student.condicion} />
                        <InfoItem icon={UsersIcon} label="Hermanos en el Colegio" value={student.hermanos.length > 0 ? student.hermanos : 'No tiene'} />
                        <InfoItem icon={SparklesIcon} label="Nivel de Inglés" value={student.nivel_ingles} />
                    </div>
                     <hr className="my-6" />
                     <h3 className="text-lg font-semibold mb-4 text-text-main">Información de Contacto de Representantes</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-gray-50 p-4 rounded-lg">
                             <h4 className="font-bold text-gray-800 mb-2">Madre: {student.info_madre.nombre}</h4>
                             <div className="space-y-3">
                                <InfoItem icon={MailIcon} label="Email" value={student.info_madre.email} />
                                <InfoItem icon={PhoneIcon} label="Teléfono" value={student.info_madre.telefono} />
                             </div>
                         </div>
                         <div className="bg-gray-50 p-4 rounded-lg">
                             <h4 className="font-bold text-gray-800 mb-2">Padre: {student.info_padre.nombre}</h4>
                             <div className="space-y-3">
                                <InfoItem icon={MailIcon} label="Email" value={student.info_padre.email} />
                                <InfoItem icon={PhoneIcon} label="Teléfono" value={student.info_padre.telefono} />
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{student ? 'Editar Alumno' : 'Añadir Alumno'}</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4 text-text-main">Datos Personales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} required />
                            <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                            <InputField label="Email Alumno" name="email_alumno" type="email" value={formData.email_alumno} onChange={handleChange} required />
                            <InputField label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} required />
                            <InputField as="select" label="Género" name="genero" value={formData.genero} onChange={handleChange}>
                                <option>Niño</option>
                                <option>Niña</option>
                            </InputField>
                             <InputField label="Lugar de Nacimiento" name="lugar_nacimiento" value={formData.lugar_nacimiento} onChange={handleChange} />
                             <InputField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
                        </div>
                    </div>
                    {/* Academic Info */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4 text-text-main">Datos Académicos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             <InputField label="Cédula Escolar" name="cedula_escolar" value={formData.cedula_escolar} onChange={handleChange} />
                            <InputField as="select" label="Salón/Grado" name="salon" value={formData.salon} onChange={handleChange}>
                                {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                            </InputField>
                             <InputField as="select" label="Grupo" name="grupo" value={formData.grupo} onChange={handleChange}>
                                <option>Grupo 1</option>
                                <option>Grupo 2</option>
                            </InputField>
                            <InputField as="select" label="Condición" name="condicion" value={formData.condicion} onChange={handleChange}>
                                <option>Regular</option>
                                <option>Nuevo Ingreso</option>
                            </InputField>
                             <InputField as="select" label="Nivel de Inglés" name="nivel_ingles" value={formData.nivel_ingles} onChange={handleChange}>
                                <option>Basic</option>
                                <option>Lower</option>
                                <option>Upper</option>
                                <option>Advanced</option>
                                <option>IB</option>
                            </InputField>
                            <InputField label="Hermanos (separados por coma)" name="hermanos" value={hermanosStr} onChange={(e) => setHermanosStr(e.target.value)} />
                        </div>
                    </div>
                    {/* Parent Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-text-main">Datos de Representantes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <h4 className="font-bold">Madre</h4>
                                <InputField label="Nombre Completo" name="info_madre.nombre" value={formData.info_madre.nombre} onChange={handleChange} required />
                                <InputField label="Email" name="info_madre.email" type="email" value={formData.info_madre.email} onChange={handleChange} required />
                                <InputField label="Teléfono" name="info_madre.telefono" value={formData.info_madre.telefono} onChange={handleChange} required />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <h4 className="font-bold">Padre</h4>
                                <InputField label="Nombre Completo" name="info_padre.nombre" value={formData.info_padre.nombre} onChange={handleChange} />
                                <InputField label="Email" name="info_padre.email" type="email" value={formData.info_padre.email} onChange={handleChange} />
                                <InputField label="Teléfono" name="info_padre.telefono" value={formData.info_padre.telefono} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md">Guardar Alumno</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const TeacherFormModal: React.FC<{
    teacher: Docente | null;
    clases: Clase[];
    onClose: () => void;
    onSave: (teacher: Docente, assignments: Assignment[]) => void;
}> = ({ teacher, clases, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Docente, 'id_docente' | 'id_usuario'>>({
        nombres: teacher?.nombres || '',
        apellidos: teacher?.apellidos || '',
        email: teacher?.email || '',
        telefono: teacher?.telefono || '',
        especialidad: teacher?.especialidad || '',
    });
    
    const initialAssignments = useMemo(() => {
        if (!teacher) return [];
        return clases
            .filter(c => c.id_docente_asignado === teacher.id_docente)
            .map(c => ({ subject: c.nombre_materia, grade: c.grado_asignado }));
    }, [teacher, clases]);

    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
    const [currentSubject, setCurrentSubject] = useState('');
    const [currentGrade, setCurrentGrade] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAssignment = () => {
        if (currentSubject && currentGrade && !assignments.some(a => a.subject === currentSubject && a.grade === currentGrade)) {
            setAssignments(prev => [...prev, { subject: currentSubject, grade: currentGrade }]);
            setCurrentSubject('');
            setCurrentGrade('');
        }
    };
    
    const handleRemoveAssignment = (index: number) => {
        setAssignments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTeacherData: Docente = {
            ...formData,
            id_docente: teacher?.id_docente || `docente-${Date.now()}`,
            id_usuario: teacher?.id_usuario || `user-${Date.now()}`
        };
        onSave(finalTeacherData, assignments);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{teacher ? 'Editar Docente' : 'Añadir Docente'}</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} required />
                        <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        <InputField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
                        <InputField label="Especialidad (General)" name="especialidad" value={formData.especialidad} onChange={handleChange} />
                    </div>
                    
                    <div className="border-t pt-6">
                         <h3 className="text-lg font-semibold mb-4 text-text-main">Asignaturas y Grados</h3>
                         <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex flex-wrap items-end gap-4 mb-4">
                                <div className="flex-grow">
                                    <label className="block text-sm font-medium text-gray-700">Asignatura</label>
                                    <select value={currentSubject} onChange={e => setCurrentSubject(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                        <option value="">Seleccione una asignatura</option>
                                        {Object.entries(ASIGNATURAS_POR_NIVEL).map(([nivel, materias]) => (
                                            <optgroup label={nivel} key={nivel}>
                                                {materias.map(materia => <option key={materia} value={materia}>{materia}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-grow">
                                     <label className="block text-sm font-medium text-gray-700">Grado</label>
                                    <select value={currentGrade} onChange={e => setCurrentGrade(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                        <option value="">Seleccione un grado</option>
                                        {GRADOS.map(grado => <option key={grado} value={grado}>{grado}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={handleAddAssignment} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Añadir</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {assignments.map((a, index) => (
                                    <span key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {a.subject} ({a.grade})
                                        <button type="button" onClick={() => handleRemoveAssignment(index)} className="text-blue-600 hover:text-blue-800">
                                            <CloseIcon />
                                        </button>
                                    </span>
                                ))}
                            </div>
                         </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TeachersView: React.FC<{
    docentes: Docente[];
    clases: Clase[];
    alumnos: Alumno[];
    setDocentes: React.Dispatch<React.SetStateAction<Docente[]>>;
    setClases: React.Dispatch<React.SetStateAction<Clase[]>>;
}> = ({ docentes, clases, alumnos, setDocentes, setClases }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Docente | null>(null);

    const handleOpenModal = (teacher: Docente | null = null) => {
        setSelectedTeacher(teacher);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTeacher(null);
    };

    const handleSaveTeacher = (teacherData: Docente, newAssignments: Assignment[]) => {
        // Update teacher details
        const teacherExists = docentes.some(d => d.id_docente === teacherData.id_docente);
        if (teacherExists) {
            setDocentes(prev => prev.map(d => d.id_docente === teacherData.id_docente ? teacherData : d));
        } else {
            setDocentes(prev => [...prev, teacherData]);
        }

        // Update classes based on assignments
        // Remove all old classes for this teacher
        const otherTeachersClasses = clases.filter(c => c.id_docente_asignado !== teacherData.id_docente);
        // Create new classes based on assignments
        const newTeacherClasses = newAssignments.map(a => ({
            id_clase: `clase-${teacherData.id_docente}-${a.subject.replace(/\s/g, '')}-${a.grade.replace(/\s/g, '')}`,
            nombre_materia: a.subject,
            grado_asignado: a.grade,
            id_docente_asignado: teacherData.id_docente,
            studentIds: alumnos.filter(s => s.salon === a.grade).map(s => s.id_alumno),
        }));
        
        setClases([...otherTeachersClasses, ...newTeacherClasses]);

        handleCloseModal();
    };

    const handleDeleteTeacher = (id_docente: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar a este docente? Esta acción también eliminará sus asignaturas.')) {
            setDocentes(prev => prev.filter(d => d.id_docente !== id_docente));
            setClases(prev => prev.filter(c => c.id_docente_asignado !== id_docente));
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-main">Gestión de Docentes</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                    <PlusIcon />
                    Añadir Docente
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignaturas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grados</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {docentes.map(docente => {
                            const teacherClasses = clases.filter(c => c.id_docente_asignado === docente.id_docente);
                            const subjects = [...new Set(teacherClasses.map(c => c.nombre_materia))];
                            const grades = [...new Set(teacherClasses.map(c => c.grado_asignado))];

                            return (
                                <tr key={docente.id_docente} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{docente.nombres} {docente.apellidos}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {subjects.length > 0 ? subjects.join(', ') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {grades.length > 0 ? grades.join(', ') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{docente.email}</div>
                                        <div>{docente.telefono}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                                        <button onClick={() => handleOpenModal(docente)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                        <button onClick={() => handleDeleteTeacher(docente.id_docente)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <TeacherFormModal teacher={selectedTeacher} clases={clases} onClose={handleCloseModal} onSave={handleSaveTeacher} />}
        </div>
    );
};

const InputField: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    type?: string;
    required?: boolean;
    as?: 'textarea' | 'select';
    rows?: number;
    disabled?: boolean;
    children?: React.ReactNode;
}> = ({ label, name, value, onChange, type = 'text', required = false, as, rows, disabled, children }) => {
    const commonProps = {
        id: name,
        name: name,
        value: value,
        onChange: onChange,
        required: required,
        disabled: disabled,
        className: "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100",
    };
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            {as === 'textarea'
                ? <textarea {...commonProps} rows={rows}></textarea>
                : as === 'select'
                ? <select {...commonProps}>{children}</select>
                : <input type={type} {...commonProps} />
            }
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
}> = ({ plan, userRole, userId, assignedClasses, onClose, onSave, isReadOnly = false }) => {
    const [formData, setFormData] = useState<Omit<Planificacion, 'id_planificacion' | 'fecha_creacion'>>({
        id_docente: plan?.id_docente || userId,
        id_clase: plan?.id_clase || (assignedClasses.length > 0 ? assignedClasses[0].id_clase : ''),
        semana: plan?.semana || getWeekNumber(new Date('2024-09-01')),
        lapso: plan?.lapso || 'I Lapso',
        ano_escolar: plan?.ano_escolar || '2024-2025',
        competencia_indicadores: plan?.competencia_indicadores || '',
        inicio: plan?.inicio || '',
        desarrollo: plan?.desarrollo || '',
        cierre: plan?.cierre || '',
        recursos_links: plan?.recursos_links || '',
        status: plan?.status || 'Borrador',
        observaciones: plan?.observaciones || '',
    });

    const isReviewMode = userRole !== 'docente' && plan !== null;
    
    const canEditTeacherFields = !isReadOnly && (plan === null || (userRole === 'docente' && (plan.status === 'Borrador' || plan.status === 'Revisado')));
    const canEditCoordinatorFields = !isReadOnly && isReviewMode;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
    };
    
    const handleSubmit = (newStatus: Planificacion['status']) => {
        const finalPlan: Planificacion = {
            ...formData,
            id_planificacion: plan?.id_planificacion || `plan-${Date.now()}`,
            fecha_creacion: plan?.fecha_creacion || new Date().toISOString(),
            status: newStatus,
        };
        onSave(finalPlan);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                        {isReadOnly ? 'Detalle de Planificación' : 
                         plan === null ? 'Nueva Planificación' :
                         userRole === 'docente' ? 'Editar Planificación' : 'Revisar Planificación'}
                    </h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Asignatura</label>
                            <select name="id_clase" value={formData.id_clase} onChange={handleChange} disabled={!canEditTeacherFields} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-50 disabled:bg-gray-200">
                                {assignedClasses.map(c => <option key={c.id_clase} value={c.id_clase}>{c.nombre_materia} ({c.grado_asignado})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Lapso</label>
                             <select name="lapso" value={formData.lapso} onChange={handleChange} disabled={!canEditTeacherFields} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-50 disabled:bg-gray-200">
                                <option>I Lapso</option>
                                <option>II Lapso</option>
                                <option>III Lapso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Año Escolar</label>
                            <select name="ano_escolar" value={formData.ano_escolar} onChange={handleChange} disabled={!canEditTeacherFields} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-50 disabled:bg-gray-200">
                                <option>2024-2025</option>
                                <option>2025-2026</option>
                                <option>2026-2027</option>
                            </select>
                        </div>
                    </div>
                    <InputField as="textarea" rows={3} label="Competencia / Indicadores" name="competencia_indicadores" value={formData.competencia_indicadores} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={4} label="Inicio" name="inicio" value={formData.inicio} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={6} label="Desarrollo" name="desarrollo" value={formData.desarrollo} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={4} label="Cierre" name="cierre" value={formData.cierre} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={2} label="Recursos / Links" name="recursos_links" value={formData.recursos_links || ''} onChange={handleChange} disabled={!canEditTeacherFields} />
                     
                     { (isReviewMode || (isReadOnly && formData.observaciones)) && (
                        <div className="border-t pt-4">
                            <InputField as="textarea" rows={4} label="Observaciones del Coordinador" name="observaciones" value={formData.observaciones || ''} onChange={handleChange} disabled={!canEditCoordinatorFields} />
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">
                           {isReadOnly ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!isReadOnly && canEditTeacherFields && (
                            <>
                                <button type="button" onClick={() => handleSubmit('Borrador')} className="px-4 py-2 bg-gray-500 text-white rounded-md">Guardar Borrador</button>
                                <button type="button" onClick={() => handleSubmit('Enviado')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md">
                                    <SendIcon className="h-4 w-4" />
                                    Enviar Planificación
                                </button>
                            </>
                        )}
                        {!isReadOnly && canEditCoordinatorFields && (
                            <>
                                <button type="button" onClick={() => handleSubmit('Revisado')} className="px-4 py-2 bg-yellow-500 text-white rounded-md">Marcar como Corregido</button>
                                <button type="button" onClick={() => handleSubmit('Aprobado')} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md">
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
    const [activeTab, setActiveTab] = useState<'board' | 'history'>('board');
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Planificacion | null>(null);
    const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    const [historyFilters, setHistoryFilters] = useState({
        ano_escolar: '2024-2025',
        lapso: 'all',
        status: 'all',
        grado: 'all',
        id_docente: 'all',
    });

    const highlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'board' && navParams?.planId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [navParams, planificaciones, activeTab]);

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

    const handleSavePlan = (planData: Planificacion) => {
        const planExists = planificaciones.some(p => p.id_planificacion === planData.id_planificacion);
        if (planExists) {
            setPlanificaciones(prev => prev.map(p => p.id_planificacion === planData.id_planificacion ? planData : p));
        } else {
            setPlanificaciones(prev => [...prev, planData]);
        }
        handleCloseModal();
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
        if (currentUser.role !== 'docente') return [];
        return clases
            .filter(c => c.id_docente_asignado === currentUser.docenteId)
            .map(c => ({ id_clase: c.id_clase, nombre_materia: c.nombre_materia, grado_asignado: c.grado_asignado}));
    }, [clases, currentUser]);

    const renderBoardView = () => {
        const statusStyles: { [key in Planificacion['status']]: string } = {
            Borrador: 'bg-gray-100 text-gray-800',
            Enviado: 'bg-blue-100 text-blue-800',
            Revisado: 'bg-yellow-100 text-yellow-800',
            Aprobado: 'bg-green-100 text-green-800',
        };
        
        const filteredPlanificaciones = useMemo(() => {
            if (currentUser.role === 'docente') {
                return planificaciones.filter(p => p.id_docente === currentUser.docenteId);
            }
            return planificaciones;
        }, [planificaciones, currentUser]);

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-main">Tablero de Planificaciones</h2>
                    {currentUser.role === 'docente' && (
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                            <PlusIcon />
                            Añadir Planificación
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlanificaciones
                        .sort((a,b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
                        .map(plan => {
                        const clase = clases.find(c => c.id_clase === plan.id_clase);
                        const docente = docentes.find(d => d.id_docente === plan.id_docente);
                        const isHighlighted = navParams?.planId === plan.id_planificacion;
                        return (
                            <div key={plan.id_planificacion} ref={isHighlighted ? highlightRef : null} className={`border rounded-lg p-4 flex flex-col justify-between ${isHighlighted ? 'ring-2 ring-brand-primary shadow-lg' : 'shadow-sm'}`}>
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{clase?.nombre_materia} - {clase?.grado_asignado}</h3>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[plan.status]}`}>
                                            {plan.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">Docente: {docente?.nombres} {docente?.apellidos}</p>
                                    <p className="text-sm text-gray-500">Semana {plan.semana} | {plan.lapso} | {plan.ano_escolar}</p>
                                    <p className="text-xs text-gray-400 mt-1">Creado: {new Date(plan.fecha_creacion).toLocaleDateString()}</p>
                                    <div className="mt-4 space-y-1 text-sm">
                                        <p><span className="font-semibold">Competencia:</span> {plan.competencia_indicadores.substring(0, 50)}...</p>
                                    </div>
                                    {plan.observaciones && (
                                        <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-2">
                                            <p className="text-sm text-yellow-800"><span className="font-bold">Observaciones:</span> {plan.observaciones}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                    <button onClick={() => handleGetAiSuggestions(plan)} className="flex items-center gap-1 text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200">
                                        <SparklesIcon className="h-4 w-4" /> Asistente IA
                                    </button>
                                    <button onClick={() => handleOpenModal(plan, true)} className="text-xs px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Ver</button>
                                    { (currentUser.role === 'coordinador' || currentUser.role === 'directivo') &&
                                        <button onClick={() => handleOpenModal(plan)} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">Revisar</button>
                                    }
                                    { currentUser.role === 'docente' && (plan.status === 'Borrador' || plan.status === 'Revisado') &&
                                        <button onClick={() => handleOpenModal(plan)} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200">Editar</button>
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    };

    const renderHistoryView = () => {
        const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const { name, value } = e.target;
            setHistoryFilters(prev => ({ ...prev, [name]: value }));
        };

        const filteredHistory = useMemo(() => {
            let plans = [...planificaciones];

            if (currentUser.role === 'docente') {
                plans = plans.filter(p => p.id_docente === currentUser.docenteId);
            }

            return plans.filter(p => {
                const { ano_escolar, lapso, status, grado, id_docente } = historyFilters;
                if (ano_escolar !== 'all' && p.ano_escolar !== ano_escolar) return false;
                if (lapso !== 'all' && p.lapso !== lapso) return false;
                if (status !== 'all' && p.status !== status) return false;
                if (id_docente !== 'all' && p.id_docente !== id_docente) return false;
                
                const clase = clases.find(c => c.id_clase === p.id_clase);
                if (grado !== 'all' && clase?.grado_asignado !== grado) return false;

                return true;
            }).sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
        }, [planificaciones, historyFilters, currentUser, clases]);

        const uniqueGrades = useMemo(() => [...new Set(clases.map(c => c.grado_asignado))].sort(), [clases]);
        const statusStyles: { [key in Planificacion['status']]: string } = {
            Borrador: 'bg-gray-100 text-gray-800', Enviado: 'bg-blue-100 text-blue-800',
            Revisado: 'bg-yellow-100 text-yellow-800', Aprobado: 'bg-green-100 text-green-800',
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-text-main mb-4">Historial de Planificaciones</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
                    <InputField as="select" label="Año Escolar" name="ano_escolar" value={historyFilters.ano_escolar} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        <option value="2024-2025">2024-2025</option><option value="2025-2026">2025-2026</option>
                    </InputField>
                    <InputField as="select" label="Lapso" name="lapso" value={historyFilters.lapso} onChange={handleFilterChange}>
                        <option value="all">Todos</option><option value="I Lapso">I Lapso</option><option value="II Lapso">II Lapso</option><option value="III Lapso">III Lapso</option>
                    </InputField>
                    <InputField as="select" label="Estado" name="status" value={historyFilters.status} onChange={handleFilterChange}>
                        <option value="all">Todos</option><option value="Borrador">Borrador</option><option value="Enviado">Enviado</option><option value="Revisado">Revisado</option><option value="Aprobado">Aprobado</option>
                    </InputField>
                    <InputField as="select" label="Grado" name="grado" value={historyFilters.grado} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </InputField>
                    {(currentUser.role === 'coordinador' || currentUser.role === 'directivo') && (
                        <InputField as="select" label="Docente" name="id_docente" value={historyFilters.id_docente} onChange={handleFilterChange}>
                            <option value="all">Todos</option>
                            {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
                        </InputField>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                {currentUser.role !== 'docente' && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia/Grado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semana</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lapso</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredHistory.map(plan => {
                                const clase = clases.find(c => c.id_clase === plan.id_clase);
                                const docente = docentes.find(d => d.id_docente === plan.id_docente);
                                return (
                                    <tr key={plan.id_planificacion}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(plan.fecha_creacion).toLocaleDateString()}</td>
                                        {currentUser.role !== 'docente' && <td className="px-4 py-2 whitespace-nowrap text-sm">{docente ? `${docente.nombres} ${docente.apellidos}` : 'N/A'}</td>}
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{clase ? `${clase.nombre_materia} (${clase.grado_asignado})` : 'N/A'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{plan.semana}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{plan.lapso}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[plan.status]}`}>{plan.status}</span></td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            <button onClick={() => handleOpenModal(plan, true)} className="text-brand-primary hover:underline">Ver Detalles</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('board')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'board' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Tablero de Planificaciones
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Historial de Planificaciones
                </button>
            </div>
            
            {activeTab === 'board' ? renderBoardView() : renderHistoryView()}
            
            {isModalOpen && <PlanningFormModal plan={selectedPlan} userRole={currentUser.role} userId={currentUser.docenteId!} assignedClasses={teacherClasses} onClose={handleCloseModal} onSave={handleSavePlan} isReadOnly={isReadOnlyModal} />}
            {isAiModalOpen && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-purple-500" />Sugerencias del Asistente IA</h2>
                            <button onClick={() => setAiModalOpen(false)}><CloseIcon /></button>
                        </div>
                        {isLoadingAi ? (
                            <div className="text-center py-8">
                                <p>Analizando planificación, por favor espere...</p>
                            </div>
                        ) : (
                            <div className="prose max-w-none max-h-[60vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: marked(aiSuggestions) }}></div>
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
}> = ({ schedules, setSchedules, clases, docentes, currentUser, alumnos }) => {
    const allGrades = useMemo(() => Array.from(new Set(alumnos.map(a => a.salon))).sort(), [alumnos]);
    const [selectedGrade, setSelectedGrade] = useState(allGrades[0] || '');
    const [currentWeek, setCurrentWeek] = useState(() => getWeekNumber(new Date('2024-09-01')));
    const [draggedItem, setDraggedItem] = useState<any>(null);
    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [eventData, setEventData] = useState<{dia: number, hora: string, desc: string, id: string | null}>({dia: 0, hora: '', desc: '', id: null});

    const isPrimaryGrade = useMemo(() => {
        const gradeNum = parseInt(selectedGrade.match(/\d+/)?.[0] || '0');
        return gradeNum >= 1 && gradeNum <= 6;
    }, [selectedGrade]);

    const timeSlots = isPrimaryGrade ? TIME_SLOTS_PRIMARIA : TIME_SLOTS_STANDARD;

    const weeklySchedule = useMemo(() => {
        if (!schedules[selectedGrade] || !schedules[selectedGrade][currentWeek]) {
            const previousWeekSchedule = schedules[selectedGrade]?.[currentWeek - 1] || [];
            // Create a deep copy for the new week
            return JSON.parse(JSON.stringify(previousWeekSchedule));
        }
        return schedules[selectedGrade][currentWeek];
    }, [schedules, selectedGrade, currentWeek]);

    useEffect(() => {
        // This effect ensures that when a schedule for a new week is generated from the previous one, it gets saved to the state.
        if (!schedules[selectedGrade] || !schedules[selectedGrade][currentWeek]) {
            setSchedules(prev => ({
                ...prev,
                [selectedGrade]: {
                    ...prev[selectedGrade],
                    [currentWeek]: weeklySchedule
                }
            }));
        }
    }, [weeklySchedule, selectedGrade, currentWeek, schedules, setSchedules]);


    const handleDrop = (day: number, slot: string) => {
        if (!draggedItem) return;

        const [hora_inicio, hora_fin] = slot.split(' - ');
        
        const updatedSchedule = weeklySchedule.filter(item => 
            !(draggedItem.type === 'class' && item.id_clase === draggedItem.id) &&
            !(draggedItem.type === 'event' && item.id_horario === draggedItem.id)
        );

        const newItem: Horario = draggedItem.type === 'class'
            ? {
                id_horario: `h-${draggedItem.id}-${day}-${hora_inicio}`,
                id_docente: draggedItem.docenteId,
                id_clase: draggedItem.id,
                dia_semana: day,
                hora_inicio: hora_inicio,
                hora_fin: hora_fin,
            }
            : {
                ...draggedItem.data,
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

    const handleDragStart = (e: React.DragEvent, item: any, type: 'class' | 'event', data?: any) => {
        const payload = type === 'class'
            ? { id: item.id_clase, docenteId: item.id_docente_asignado, type }
            : { id: item.id_horario, type, data: item };
        e.dataTransfer.setData("application/json", JSON.stringify(payload));
        setDraggedItem(payload);
    };
    
    const unassignedClasses = useMemo(() => {
        const assignedClassIds = new Set(weeklySchedule.filter(s => s.id_clase).map(s => s.id_clase));
        return clases.filter(c => c.grado_asignado === selectedGrade && !assignedClassIds.has(c.id_clase));
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
        if(eventData.id) { // Editing existing event
            updatedSchedule = updatedSchedule.map(h => h.id_horario === eventData.id ? {...h, evento_descripcion: eventData.desc} : h);
        } else { // Creating new event
            const newEvent: Horario = {
                id_horario: `evt-${Date.now()}`,
                id_docente: null,
                id_clase: null,
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

    return (
        <div className="flex gap-6">
            <div className="flex-grow bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                     <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="p-2 border rounded-md">
                        {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentWeek(w => Math.max(1, w - 1))} className="p-2 bg-gray-200 rounded-md">&lt;</button>
                        <span className="font-semibold w-24 text-center">Semana {currentWeek}</span>
                        <button onClick={() => setCurrentWeek(w => Math.min(18, w + 1))} className="p-2 bg-gray-200 rounded-md disabled:opacity-50" disabled={currentWeek >= 18}>&gt;</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Hora</th>
                                {WEEK_DAYS.map(d => <th key={d} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {timeSlots.map(slot => (
                                <tr key={slot}>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">{slot.replace('-', ' - ')}</td>
                                    {WEEK_DAYS.map((_, dayIndex) => {
                                        const day = dayIndex + 1;
                                        const item = weeklySchedule.find(s => s.dia_semana === day && s.hora_inicio.startsWith(slot.split(' - ')[0]));
                                        return (
                                            <td key={`${day}-${slot}`}
                                                className="border p-1 align-top text-xs relative h-24"
                                                onDrop={() => handleDrop(day, slot)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDoubleClick={() => !item && handleOpenEventModal(day, slot)}
                                            >
                                                {item && (
                                                    item.evento_descripcion ? (
                                                        <div onClick={() => handleOpenEventModal(day, slot, item)} className="bg-gray-200 p-2 rounded-md h-full cursor-pointer">
                                                             <div className="font-semibold text-gray-700 flex items-center gap-1">
                                                                <TagIcon className="h-4 w-4 text-gray-500" />
                                                                {item.evento_descripcion}
                                                            </div>
                                                        </div>
                                                    ) : item.id_clase && (
                                                        <div draggable onDragStart={(e) => handleDragStart(e, item, 'event')} className="h-full cursor-grab">
                                                        {(clase => (
                                                            <div className="p-2 rounded-md h-full" style={{backgroundColor: subjectColors[clase?.nombre_materia || 'default']}}>
                                                                <div className="font-bold">{clase?.nombre_materia}</div>
                                                                <div className="text-gray-600">
                                                                    {(docente => docente ? `${docente.nombres} ${docente.apellidos}` : 'N/A')(docentes.find(d => d.id_docente === item.id_docente))}
                                                                </div>
                                                            </div>
                                                        ))(clases.find(c => c.id_clase === item.id_clase))}
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
            </div>
            <div className="w-64 flex-shrink-0">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">Asignaturas sin Horario</h3>
                    <div className="space-y-2">
                        {unassignedClasses.map(clase => (
                             <div key={clase.id_clase}
                                draggable
                                onDragStart={(e) => handleDragStart(e, clase, 'class')}
                                className="p-2 rounded-md cursor-grab"
                                style={{backgroundColor: subjectColors[clase.nombre_materia] || subjectColors.default}}
                             >
                                <div className="font-bold">{clase.nombre_materia}</div>
                                <div className="text-sm text-gray-600">{docentes.find(d => d.id_docente === clase.id_docente_asignado)?.nombres}</div>
                            </div>
                        ))}
                        {unassignedClasses.length === 0 && <p className="text-sm text-gray-500">Todas las asignaturas han sido añadidas al horario.</p>}
                    </div>
                </div>
            </div>
            {isEventModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                     <div className="bg-white rounded-lg p-6 w-96">
                         <h2 className="text-xl font-bold mb-4">{eventData.id ? 'Editar Evento' : 'Añadir Evento'}</h2>
                         <InputField as="textarea" label="Descripción del Evento" name="event_desc" value={eventData.desc} onChange={e => setEventData(d => ({...d, desc: e.target.value}))} required />
                         <div className="flex justify-between items-center mt-4">
                            <div>
                                {eventData.id && <button onClick={handleDeleteEvent} className="px-4 py-2 bg-red-500 text-white rounded-md">Eliminar</button>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEventModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                                <button onClick={handleSaveEvent} className="px-4 py-2 bg-brand-primary text-white rounded-md">Guardar</button>
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
}> = ({ docentes, schedules, setSchedules, clases, alumnos }) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [isGuardiaModalOpen, setGuardiaModalOpen] = useState(false);
    
    type GuardiaData = { dia: number, hora: string, desc: string, grade: string, id: string | null };
    const [guardiaData, setGuardiaData] = useState<GuardiaData | null>(null);

    const allGrades = useMemo(() => Array.from(new Set(alumnos.map(a => a.salon))).sort(), [alumnos]);

    const teacherPrimaryGrade = useMemo(() => {
        if (!selectedTeacherId) return allGrades[0] || '';
        const teacherClassesForGrade = clases.filter(c => c.id_docente_asignado === selectedTeacherId);
        return teacherClassesForGrade.length > 0 ? teacherClassesForGrade[0].grado_asignado : (allGrades[0] || '');
    }, [selectedTeacherId, clases, allGrades]);

    const teacherSchedule = useMemo(() => {
        if (!selectedTeacherId) return [];
        const MASTER_WEEK = 1; // using week 1 as the master schedule for all teachers
        const scheduleWithGrade: (Horario & { grade: string })[] = [];
        for (const grade in schedules) {
            const weekSchedule = schedules[grade]?.[MASTER_WEEK] || [];
            for (const item of weekSchedule) {
                // A single check for any item (class or event) assigned to the selected teacher
                if (item.id_docente === selectedTeacherId) {
                    const clase = clases.find(c => c.id_clase === item.id_clase);
                    // For classes, use the class's grade. For events (guardias), use the grade of the schedule it's in.
                    scheduleWithGrade.push({ ...item, grade: clase?.grado_asignado || grade });
                }
            }
        }
        return scheduleWithGrade;
    }, [selectedTeacherId, schedules, clases]);

    const timeSlots = useMemo(() => {
        if (!selectedTeacherId) {
            return TIME_SLOTS_STANDARD;
        }

        const teacherClasses = clases.filter(c => c.id_docente_asignado === selectedTeacherId);
        if (teacherClasses.length === 0) {
            return TIME_SLOTS_STANDARD;
        }

        const primaryClassCount = teacherClasses.filter(c => {
            const gradeNum = parseInt(c.grado_asignado.match(/\d+/)?.[0] || '0');
            return gradeNum >= 1 && gradeNum <= 6;
        }).length;

        const nonPrimaryClassCount = teacherClasses.length - primaryClassCount;
        
        return primaryClassCount > nonPrimaryClassCount ? TIME_SLOTS_PRIMARIA : TIME_SLOTS_STANDARD;
    }, [selectedTeacherId, clases]);

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
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-main">Horario por Docente</h2>
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
                                        const item = teacherSchedule.find(s => s.dia_semana === day && s.hora_inicio.startsWith(slot.split(' - ')[0]));
                                        return (
                                            <td key={`${day}-${slot}`} className="border p-1 align-top text-xs relative h-24"
                                                onDoubleClick={() => !item && handleOpenGuardiaModal(day, slot)}>
                                                {item && (item.evento_descripcion ? (
                                                    <div onClick={() => handleOpenGuardiaModal(day, slot, item)} className="bg-gray-200 p-2 rounded-md h-full cursor-pointer hover:bg-gray-300">
                                                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                                                          <TagIcon className="h-4 w-4 text-gray-500" />
                                                          {item.evento_descripcion}
                                                        </div>
                                                        <div className="text-gray-500 text-[10px] mt-1">({item.grade})</div>
                                                    </div>
                                                ) : item.id_clase && (
                                                    (clase => clase ? (
                                                        <div className="p-2 rounded-md h-full" style={{backgroundColor: subjectColors[clase.nombre_materia] || subjectColors.default}}>
                                                            <div className="font-bold">{clase.nombre_materia}</div>
                                                            <div className="text-gray-600">{clase.grado_asignado}</div>
                                                        </div>
                                                    ) : null)(clases.find(c => c.id_clase === item.id_clase))
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
                            <InputField as="textarea" label="Descripción" name="desc" value={guardiaData.desc} onChange={e => setGuardiaData({...guardiaData, desc: e.target.value})} required />
                        </div>
                         <div className="flex justify-between items-center mt-6">
                            <div>
                                {guardiaData.id && <button onClick={handleDeleteGuardia} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Eliminar</button>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setGuardiaModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                                <button onClick={handleSaveGuardia} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90">Guardar</button>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- NEW EVALUATION VIEW COMPONENT ---

const GradeChart: React.FC<{ data: { [key in Nota]?: number } }> = ({ data }) => {
    const grades: Nota[] = ['A', 'B', 'C', 'D', 'E', 'SE'];
    const maxCount = Math.max(...Object.values(data).filter(v => typeof v === 'number'), 1);
    const colors: { [key in Nota]: string } = {
        'A': 'bg-green-500',
        'B': 'bg-blue-500',
        'C': 'bg-yellow-500',
        'D': 'bg-orange-500',
        'E': 'bg-red-500',
        'SE': 'bg-gray-500',
        '': ''
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <h4 className="font-bold text-center mb-4 text-gray-700">Distribución de Notas</h4>
            <div className="flex justify-around items-end h-40 gap-3 px-2">
                {grades.filter(g => g !== '').map(grade => (
                    <div key={grade} className="flex flex-col items-center flex-1 h-full">
                        <div className="text-sm font-bold text-gray-800">{data[grade] || 0}</div>
                        <div
                            className={`w-full rounded-t-md transition-all duration-300 ease-out ${colors[grade]}`}
                            style={{ height: `${((data[grade] || 0) / maxCount) * 90}%` }}
                            title={`${data[grade] || 0} alumnos con nota ${grade}`}
                        ></div>
                        <div className="font-semibold text-gray-700 mt-1">{grade}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PieChart: React.FC<{
    data: { [key: string]: number };
    title: string;
    colors: { [key: string]: string };
}> = ({ data, title, colors }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col items-center justify-center">
                <h5 className="font-bold text-center text-gray-700 mb-2">{title}</h5>
                <p className="text-gray-500">No hay datos para mostrar.</p>
            </div>
        )
    }

    let cumulativePercent = 0;
    const slices = Object.entries(data).map(([key, value]) => {
        const percent = (value / total) * 100;
        const item = { key, value, percent, color: colors[key] || '#cccccc' };
        cumulativePercent += percent;
        return item;
    });

    const gradients = slices.map((slice, index) => {
        const startAngle = index === 0 ? 0 : slices.slice(0, index).reduce((acc, s) => acc + s.percent, 0);
        const endAngle = startAngle + slice.percent;
        return `${slice.color} ${startAngle}% ${endAngle}%`;
    }).join(', ');

    return (
        <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
            <h5 className="font-bold text-center text-gray-700 mb-4">{title}</h5>
            <div className="flex-grow flex items-center justify-center">
                <div className="w-32 h-32 rounded-full" style={{ background: `conic-gradient(${gradients})` }}></div>
            </div>
            <div className="mt-4">
                <ul className="text-sm space-y-1">
                    {slices.map(slice => (
                        <li key={slice.key} className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></span>
                                {slice.key}
                            </span>
                            <span className="font-semibold">{slice.percent.toFixed(1)}% ({slice.value})</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const gradeColors: { [key in Nota]: string } = {
    'A': '#22C55E', 'B': '#3B82F6', 'C': '#EAB308', 'D': '#F97316', 'E': '#EF4444', 'SE': '#6B7280', '': '#D1D5DB'
};
const adaptationColors: { [key in Adaptacion]: string } = {
    'Reg': '#3B82F6', 'AC+': '#22C55E', 'AC-': '#EAB308', '': '#D1D5DB'
};

const AdaptationGradeDistributionCharts: React.FC<{
    data: { [key in Adaptacion]?: { [key in Nota]?: number } };
}> = ({ data }) => {
    return (
        <div className="mt-6">
             <h4 className="font-semibold text-center text-gray-800 mb-4">Distribución de Notas por Tipo de Adaptación</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PieChart data={data['Reg'] || {}} title="Regular" colors={gradeColors} />
                <PieChart data={data['AC+'] || {}} title="AC+" colors={gradeColors} />
                <PieChart data={data['AC-'] || {}} title="AC-" colors={gradeColors} />
            </div>
        </div>
    )
}

const EvaluationView: React.FC<{
    alumnos: Alumno[];
    clases: Clase[];
    minutas: MinutaEvaluacion[];
    setMinutas: React.Dispatch<React.SetStateAction<MinutaEvaluacion[]>>;
}> = ({ alumnos, clases, minutas, setMinutas }) => {
    const [viewMode, setViewMode] = useState<'new' | 'history'>('new');
    const [selectedMinuta, setSelectedMinuta] = useState<MinutaEvaluacion | null>(null);

    const [filters, setFilters] = useState({
        ano_escolar: '2024-2025',
        lapso: 'I Lapso',
        evaluacion: 'I Mensual',
        grado: '',
        materia: ''
    });
    const [studentEvals, setStudentEvals] = useState<Map<string, EvaluacionAlumno>>(new Map());
    const [aiAnalysis, setAiAnalysis] = useState<AnalisisDificultad[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const availableSubjects = useMemo(() => {
        if (!filters.grado) return [];
        return clases.filter(c => c.grado_asignado === filters.grado);
    }, [filters.grado, clases]);

    const studentsInGrade = useMemo(() => {
        if (!filters.grado) return [];
        return alumnos.filter(a => a.salon === filters.grado);
    }, [filters.grado, alumnos]);

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
    
    const handleStudentEvalChange = (studentId: string, field: keyof Omit<EvaluacionAlumno, 'id_alumno'>, value: string) => {
        setStudentEvals(prevMap => {
            const newMap = new Map(prevMap);
            const currentData = newMap.get(studentId) || { id_alumno: studentId, nota: '', adaptacion: '', observaciones: '' };
            newMap.set(studentId, { ...currentData, [field]: value as any });
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
                accionesSugeridas: "La respuesta del asistente de IA no pudo ser procesada. Inténtelo de nuevo."
            }]);
        }
        setIsLoading(false);
    };

    const handleAiActionChange = (index: number, value: string) => {
        setAiAnalysis(prev => prev.map((item, i) => i === index ? { ...item, accionesSugeridas: value } : item));
    }

    const handleSaveMinuta = () => {
        const newMinuta: MinutaEvaluacion = {
            id_minuta: `minuta-${Date.now()}`,
            ...filters,
            fecha_creacion: new Date().toISOString(),
            datos_alumnos: Array.from(studentEvals.values()),
            analisis_ia: aiAnalysis,
        };
        setMinutas(prev => [...prev, newMinuta]);
        alert('Minuta de la reunión guardada con éxito.');
        setFilters({ ano_escolar: '2024-2025', lapso: 'I Lapso', evaluacion: 'I Mensual', grado: '', materia: '' });
        setStudentEvals(new Map());
        setAiAnalysis([]);
    }

    const isFormReady = filters.grado && filters.materia;
    
    const renderNewMeetingForm = () => {
        const advancedAnalytics = calculateAdvancedAnalytics(Array.from(studentEvals.values()));

        return (
             <div className="space-y-8">
                {/* Section 1: Filters */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-text-main mb-4">1. Contexto de la Reunión</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <InputField as="select" label="Año Escolar" name="ano_escolar" value={filters.ano_escolar} onChange={handleFilterChange}>
                            <option>2024-2025</option><option>2025-2026</option>
                        </InputField>
                         <InputField as="select" label="Lapso" name="lapso" value={filters.lapso} onChange={handleFilterChange}>
                            <option>I Lapso</option><option>II Lapso</option><option>III Lapso</option>
                        </InputField>
                        <InputField as="select" label="Evaluación" name="evaluacion" value={filters.evaluacion} onChange={handleFilterChange}>
                            <option>I Mensual</option><option>II Mensual</option><option>Examen de Lapso</option>
                        </InputField>
                        <InputField as="select" label="Grado" name="grado" value={filters.grado} onChange={handleFilterChange}>
                            <option value="">Seleccione un grado</option>
                            {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                        </InputField>
                        <InputField as="select" label="Materia" name="materia" value={filters.materia} onChange={handleFilterChange} disabled={!filters.grado}>
                            <option value="">Seleccione una materia</option>
                            {availableSubjects.map(s => <option key={s.id_clase} value={s.nombre_materia}>{s.nombre_materia}</option>)}
                        </InputField>
                    </div>
                </div>

                {isFormReady && studentsInGrade && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-text-main mb-4">2. Carga de Datos de Evaluación</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                 <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Alumno</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adaptación</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {studentsInGrade.map(student => {
                                        const evalData = studentEvals.get(student.id_alumno) || { nota: '', adaptacion: '', observaciones: '' };
                                        return (
                                            <tr key={student.id_alumno}>
                                                <td className="px-4 py-2 whitespace-nowrap font-medium">{student.apellidos}, {student.nombres}</td>
                                                <td className="px-4 py-2">
                                                    <select value={evalData.nota} onChange={e => handleStudentEvalChange(student.id_alumno, 'nota', e.target.value)} className="p-1 border rounded-md w-full">
                                                        <option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="SE">SE</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select value={evalData.adaptacion} onChange={e => handleStudentEvalChange(student.id_alumno, 'adaptacion', e.target.value)} className="p-1 border rounded-md w-full">
                                                        <option value=""></option><option value="Reg">Reg</option><option value="AC+">AC+</option><option value="AC-">AC-</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input type="text" value={evalData.observaciones} onChange={e => handleStudentEvalChange(student.id_alumno, 'observaciones', e.target.value)} className="p-1 border rounded-md w-full" />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <GradeChart data={liveGradeDistribution} />
                        
                        <div className="mt-8 border-t pt-6">
                             <h3 className="text-xl font-bold text-text-main mb-4">Análisis Gráfico Avanzado</h3>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <PieChart title="Estudiantes por Adaptación" data={advancedAnalytics.adaptationCounts} colors={adaptationColors} />
                                <PieChart title="Porcentaje Global de Notas" data={advancedAnalytics.overallGradeCounts} colors={gradeColors} />
                             </div>
                             <AdaptationGradeDistributionCharts data={advancedAnalytics.gradeDistributionByAdaptation as any} />
                        </div>

                    </div>
                )}
                
                {isFormReady && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-xl font-bold text-text-main mb-4">3. Análisis Pedagógico Asistido por IA</h2>
                         <button onClick={handleGenerateAnalysis} disabled={isLoading || studentEvals.size === 0} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-300 w-full justify-center">
                             <SparklesIcon className="h-6 w-6"/>
                             {isLoading ? 'Analizando datos...' : 'Generar Análisis Pedagógico con IA'}
                         </button>
                         {isLoading && <div className="text-center mt-4">La IA está procesando la información, esto puede tardar unos segundos...</div>}

                         {aiAnalysis.length > 0 && (
                            <div className="mt-6">
                                 <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dificultad Detectada</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frec.</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiantes</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Acciones Sugeridas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {aiAnalysis.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 align-top font-medium">{item.dificultad}</td>
                                                    <td className="px-4 py-2 align-top"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.categoria === 'Académico' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.categoria}</span></td>
                                                    <td className="px-4 py-2 align-top text-center">{item.frecuencia}</td>
                                                    <td className="px-4 py-2 align-top text-sm">{item.estudiantes}</td>
                                                    <td className="px-4 py-2 align-top">
                                                        <textarea value={item.accionesSugeridas} onChange={(e) => handleAiActionChange(index, e.target.value)} rows={4} className="w-full p-1 border rounded-md text-sm bg-yellow-50"></textarea>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                 </div>
                                 <div className="mt-6 flex justify-end">
                                     <button onClick={handleSaveMinuta} className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-opacity-90">
                                         Guardar Minuta de Reunión
                                     </button>
                                 </div>
                            </div>
                         )}
                    </div>
                )}
            </div>
        );
    }


    const renderHistoryView = () => {
        if (selectedMinuta) {
             const advancedAnalytics = calculateAdvancedAnalytics(selectedMinuta.datos_alumnos);
            return (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
                     <button onClick={() => setSelectedMinuta(null)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeftIcon />
                        Volver al Historial
                    </button>

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
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Alumno</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Adaptación</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedMinuta.datos_alumnos.map(evalData => {
                                        const student = alumnos.find(a => a.id_alumno === evalData.id_alumno);
                                        return (
                                            <tr key={evalData.id_alumno}>
                                                <td className="px-4 py-2 whitespace-nowrap font-medium">{student ? `${student.apellidos}, ${student.nombres}` : 'Alumno no encontrado'}</td>
                                                <td className="px-4 py-2 text-center">{evalData.nota || '-'}</td>
                                                <td className="px-4 py-2 text-center">{evalData.adaptacion || '-'}</td>
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
                                <PieChart title="Estudiantes por Adaptación" data={advancedAnalytics.adaptationCounts} colors={adaptationColors} />
                                <PieChart title="Porcentaje Global de Notas" data={advancedAnalytics.overallGradeCounts} colors={gradeColors} />
                             </div>
                             <AdaptationGradeDistributionCharts data={advancedAnalytics.gradeDistributionByAdaptation as any} />
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div>
                        <h3 className="text-xl font-bold text-text-main mb-4">Análisis Pedagógico de IA</h3>
                         <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dificultad Detectada</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Frec.</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiantes</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Acciones Sugeridas</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedMinuta.analisis_ia.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 align-top font-medium">{item.dificultad}</td>
                                            <td className="px-4 py-2 align-top"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.categoria === 'Académico' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.categoria}</span></td>
                                            <td className="px-4 py-2 align-top text-center">{item.frecuencia}</td>
                                            <td className="px-4 py-2 align-top text-sm">{item.estudiantes}</td>
                                            <td className="px-4 py-2 align-top text-sm whitespace-pre-wrap">{item.accionesSugeridas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-text-main mb-4">Historial de Minutas de Reunión</h2>
                <div className="space-y-4">
                    {minutas.length > 0 ? (
                        minutas
                            .sort((a,b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
                            .map(minuta => (
                                <div key={minuta.id_minuta} className="border rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{minuta.grado} - {minuta.materia}</p>
                                        <p className="text-sm text-gray-600">{minuta.evaluacion} ({minuta.lapso})</p>
                                        <p className="text-xs text-gray-400">Fecha: {new Date(minuta.fecha_creacion).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={() => setSelectedMinuta(minuta)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                        Ver Detalles
                                    </button>
                                </div>
                            ))
                    ) : (
                        <p className="text-center text-gray-500 py-8">No hay minutas guardadas todavía.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
             <div className="flex border-b mb-6">
                <button
                    onClick={() => { setViewMode('new'); setSelectedMinuta(null); }}
                    className={`px-4 py-2 text-sm font-medium ${viewMode === 'new' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Nueva Reunión
                </button>
                <button
                    onClick={() => { setViewMode('history'); setSelectedMinuta(null); }}
                    className={`px-4 py-2 text-sm font-medium ${viewMode === 'history' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Historial de Reuniones
                </button>
            </div>
            {viewMode === 'new' ? renderNewMeetingForm() : renderHistoryView()}
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Data states
  const [alumnos, setAlumnos] = useState<Alumno[]>(mockAlumnosData);
  const [docentes, setDocentes] = useState<Docente[]>(mockDocentes);
  const [clases, setClases] = useState<Clase[]>(mockClases);
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>(mockPlanificaciones);
  const [schedules, setSchedules] = useState<WeeklySchedules>(() => {
        const initialSchedules: WeeklySchedules = {};
        const grades = Array.from(new Set(mockAlumnosData.map(a => a.salon)));
        grades.forEach(grade => {
            initialSchedules[grade] = {
                1: mockHorarios.filter(h => {
                    const clase = mockClases.find(c => c.id_clase === h.id_clase);
                    return clase?.grado_asignado === grade;
                })
            };
        });
        return initialSchedules;
  });
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [minutas, setMinutas] = useState<MinutaEvaluacion[]>([]);

  // View-specific states
  const [selectedStudent, setSelectedStudent] = useState<Alumno | null>(null);
  const [isStudentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Alumno | null>(null);
  const [navParams, setNavParams] = useState<any>(null);


  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        // Verify user is authorized and get their role
        const { data: authorizedUser } = await supabase
          .from('authorized_users')
          .select('*')
          .eq('email', session.user.email.toLowerCase())
          .single();

        if (authorizedUser) {
          const fullName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name ||
                          session.user.email.split('@')[0];

          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            role: authorizedUser.role as UserRole,
            fullName: fullName,
          });
        } else {
          // User not authorized, sign them out
          await supabase.auth.signOut();
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleLoginSuccess = (user: { id: string; email: string; role: string; fullName?: string }) => {
    setCurrentUser({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      fullName: user.fullName,
    });
    setActiveView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleNavigate = (view: string, params: any = null) => {
    if (view === 'students' && selectedStudent) {
        setSelectedStudent(null); // Reset detail view when navigating away
    }
    setActiveView(view);
    setNavParams(params);
  };
  
  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, isRead: true} : n));
    handleNavigate(notification.linkTo.view, notification.linkTo.params);
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

  const handleSaveStudent = (studentData: Alumno) => {
    if (editingStudent) {
        setAlumnos(prev => prev.map(s => s.id_alumno === studentData.id_alumno ? studentData : s));
    } else {
        setAlumnos(prev => [...prev, { ...studentData, id_alumno: `alumno-${Date.now()}` }]);
    }
    handleCloseStudentModal();
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar a este alumno?')) {
        setAlumnos(prev => prev.filter(s => s.id_alumno !== studentId));
    }
  };

  
  const renderView = () => {
    if (activeView === 'students' && selectedStudent) {
        return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />
    }
    switch (activeView) {
      case 'dashboard':
        return <DashboardView 
                    stats={{ totalStudents: alumnos.length, totalTeachers: docentes.length, classesToday: 5 }} 
                    currentUser={currentUser!}
                    schedules={schedules}
                    clases={clases}
                    docentes={docentes}
                    alumnos={alumnos}
                />;
      case 'students':
        return <StudentListView 
                    students={alumnos} 
                    onSelectStudent={setSelectedStudent}
                    onAddStudent={() => handleOpenStudentModal(null)}
                    onEditStudent={handleOpenStudentModal}
                    onDeleteStudent={handleDeleteStudent}
                />;
      case 'teachers':
        return <TeachersView docentes={docentes} clases={clases} alumnos={alumnos} setDocentes={setDocentes} setClases={setClases} />;
      case 'planning':
        return <PlanningView planificaciones={planificaciones} setPlanificaciones={setPlanificaciones} clases={clases} docentes={docentes} currentUser={currentUser!} navParams={navParams}/>;
      case 'schedules':
        return <ScheduleView schedules={schedules} setSchedules={setSchedules} clases={clases} docentes={docentes} currentUser={currentUser!} alumnos={alumnos} />;
      case 'team-schedules':
        return <TeamScheduleView docentes={docentes} schedules={schedules} setSchedules={setSchedules} clases={clases} alumnos={alumnos}/>;
      case 'evaluation':
        return <EvaluationView alumnos={alumnos} clases={clases} minutas={minutas} setMinutas={setMinutas} />;
      case 'authorized-users':
        return <AuthorizedUsersView currentUser={currentUser!} />;
      default:
        return <div className="bg-white p-6 rounded-lg shadow-md"><h2>Vista no implementada</h2><p>La funcionalidad para "{activeView}" estará disponible próximamente.</p></div>;
    }
  };
  
  const viewTitles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      students: selectedStudent ? `Detalle de ${selectedStudent.nombres}` : 'Gestión de Alumnos',
      teachers: 'Gestión de Docentes',
      schedules: 'Gestión de Horarios',
      'team-schedules': 'Horarios de Equipo',
      planning: 'Planificaciones',
      evaluation: 'Seguimiento Pedagógico',
      'authorized-users': 'Usuarios Autorizados',
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-background-light">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} userRole={currentUser.role} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
            title={viewTitles[activeView] || 'ManglarNet'} 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
        />
        <div className="p-6 flex-1 overflow-y-auto">
          {renderView()}
        </div>
      </main>
      {isStudentModalOpen && (
        <StudentFormModal 
            student={editingStudent}
            onClose={handleCloseStudentModal}
            onSave={handleSaveStudent}
        />
      )}
    </div>
  );
};




export default App;
