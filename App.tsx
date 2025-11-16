
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DashboardIcon, StudentsIcon, TeachersIcon, ClassesIcon, PlusIcon, CloseIcon, EditIcon, DeleteIcon, ChevronDownIcon, LogoutIcon, PlanningIcon, GradesIcon, FilterIcon, CalendarIcon, SearchIcon, SpecialSubjectIcon, SparklesIcon, ArrowLeftIcon, UserCircleIcon, AcademicCapIcon, UsersIcon, IdentificationIcon, CakeIcon, LocationMarkerIcon, MailIcon, PhoneIcon, ClipboardCheckIcon, SendIcon, BellIcon, TagIcon, DownloadIcon, EvaluationIcon, SaveIcon, MenuIcon, MagicWandIcon } from './components/Icons';
import { getAIPlanSuggestions, getAIEvaluationAnalysis } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { LoginScreen } from './components/LoginScreen';
import { AuthorizedUsersView } from './components/AuthorizedUsersView';
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  alumnosService,
  docentesService,
  clasesService,
  planificacionesService,
  horariosService,
  minutasService,
  notificacionesService,
  eventosCalendarioService,
  aulasService,
  configuracionHorariosService,
  generacionesHorariosService,
  type Alumno as AlumnoDB,
  type Docente as DocenteDB,
  type Clase as ClaseDB,
  type Planificacion as PlanificacionDB,
  type Horario as HorarioDB,
  type MinutaEvaluacion as MinutaEvaluacionDB,
  type Notification as NotificationDB,
  type EventoCalendario as EventoCalendarioDB,
  type ConfiguracionHorario,
  type GeneracionHorario
} from './services/supabaseDataService';


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


// Función helper para obtener el color de una materia
const getSubjectColor = (subjectName: string): string => {
  const normalizedName = subjectName?.trim() || '';
  
  // Matemáticas - #01b0f3
  if (normalizedName.includes('Matemáticas')) {
    return '#01b0f3';
  }
  
  // Lenguaje - #e7b6b7
  if (normalizedName.includes('Lenguaje')) {
    return '#e7b6b7';
  }
  
  // Ciencias - #99ff32
  if (normalizedName === 'Ciencias' || normalizedName.includes('Ciencias')) {
    return '#99ff32';
  }
  
  // Sociales - #fe9900
  if (normalizedName === 'Sociales') {
    return '#fe9900';
  }
  
  // Proyecto - #feff99
  if (normalizedName === 'Proyecto') {
    return '#feff99';
  }
  
  // Inglés - #9b99fd
  if (normalizedName.includes('Inglés') || normalizedName.includes('English')) {
    return '#9b99fd';
  }
  
  // Francés - #c17ba0
  if (normalizedName === 'Francés' || normalizedName === 'FRANCES') {
    return '#c17ba0';
  }
  
  // Literatura - #a64d79
  if (normalizedName === 'Literatura') {
    return '#a64d79';
  }
  
  // Música - #00ff99
  if (normalizedName === 'Música' || normalizedName === 'MUSICA' || normalizedName.includes('Música')) {
    return '#00ff99';
  }
  
  // Arte - #ff99ff
  if (normalizedName === 'Arte' || normalizedName.includes('Arte')) {
    return '#ff99ff';
  }
  
  // Tecnología - #c17ba0
  if (normalizedName.includes('Tecnología') || normalizedName.includes('Tecnologia') || normalizedName.includes('Computación') || normalizedName.includes('Robótica') || normalizedName.includes('Robotica')) {
    return '#c17ba0';
  }
  
  // Ajedrez - #cccccc
  if (normalizedName === 'Ajedrez') {
    return '#cccccc';
  }
  
  // Ed, Física y Deporte - #ffc000 (debe verificarse antes que Ciencias para evitar conflictos)
  if (normalizedName.includes('Deporte') || normalizedName.includes('EDUCACIÓN FÍSICA') || normalizedName.includes('Ed, Física') || normalizedName === 'FÍSICA (Inglés)') {
    return '#ffc000';
  }
  
  // Física (como materia de ciencias) - #99ff32
  if (normalizedName === 'Física') {
    return '#99ff32';
  }
  
  // Valores - #ffff00
  if (normalizedName === 'Valores') {
    return '#ffff00';
  }
  
  // ADP - #ffff00
  if (normalizedName === 'ADP') {
    return '#ffff00';
  }
  
  // Taller Mañanero - #feff97
  if (normalizedName === 'Taller Mañanero') {
    return '#feff97';
  }
  
  // Metacognición - #feff99
  if (normalizedName === 'Metacognición' || normalizedName === 'Metacogción') {
    return '#feff99';
  }
  
  // Psicomotricidad - #feff99
  if (normalizedName === 'Psicomotricidad') {
    return '#feff99';
  }
  
  // Conciencia Fonológica - #feff99
  if (normalizedName === 'Conciencia fonológica' || normalizedName === 'Conciencia Fonológica') {
    return '#feff99';
  }
  
  // Clubes - #feff99
  if (normalizedName.includes('Club')) {
    return '#feff99';
  }
  
  // Color por defecto
  return '#F3F4F6';
};

// Objeto de colores para compatibilidad con código existente
const subjectColors: { [key: string]: string } = {
  // Matemáticas
  'Matemáticas': '#01b0f3',
  'Matemáticas (EAC)': '#01b0f3',
  'Matemáticas (AC)': '#01b0f3',
  'Matemáticas (OB)': '#01b0f3',
  'Matemáticas (Prob)': '#01b0f3',
  'Matemáticas (Geometría)': '#01b0f3',
  'Matemáticas (EV)': '#01b0f3',
  'MATEMATICA': '#01b0f3',
  
  // Lenguaje
  'Lenguaje': '#e7b6b7',
  'Lenguaje (AC)': '#e7b6b7',
  'Lenguaje (EAC)': '#e7b6b7',
  'Lenguaje (CL)': '#e7b6b7',
  'Lenguaje (LO)': '#e7b6b7',
  'Lenguaje (PT)': '#e7b6b7',
  'Lenguaje (Gram)': '#e7b6b7',
  'CASTELLANO': '#e7b6b7',
  
  // Ciencias
  'Ciencias': '#99ff32',
  'Física': '#99ff32',
  'QUÍMICA': '#99ff32',
  'BIOLOGÍA': '#99ff32',
  'CIENCIAS DE LA TIERRA': '#99ff32',
  'SISTEMAS AMBIENTALES': '#99ff32',
  
  // Sociales
  'Sociales': '#fe9900',
  'GHC (Geografía, Historia y Ciudadanía)': '#fe9900',
  
  // Proyecto
  'Proyecto': '#feff99',
  
  // Inglés
  'Inglés': '#9b99fd',
  'Inglés (reading)': '#9b99fd',
  'Inglés (Use of English)': '#9b99fd',
  'Inglés (Writing)': '#9b99fd',
  'Inglés (Writting)': '#9b99fd',
  'Inglés (Speaking)': '#9b99fd',
  'Inglés (Project)': '#9b99fd',
  'Inglés (Basic)': '#9b99fd',
  'Inglés (Lower)': '#9b99fd',
  'Inglés (Upper)': '#9b99fd',
  'INGLES': '#9b99fd',
  'English Club (Board Games Club)': '#9b99fd',
  'English Club (Reading Club)': '#9b99fd',
  'English Club (Entertainment Club)': '#9b99fd',
  'English Club (Drawing and Animation Club)': '#9b99fd',
  
  // Francés
  'Francés': '#c17ba0',
  'FRANCES': '#c17ba0',
  
  // Literatura
  'Literatura': '#a64d79',
  
  // Música
  'Música': '#00ff99',
  'MUSICA': '#00ff99',
  'Club (Música)': '#feff99',
  'HUB (Música)': '#00ff99',
  
  // Arte
  'Arte': '#ff99ff',
  'ARTE Y PATRIMONIO': '#ff99ff',
  'HUB (Arte)': '#ff99ff',
  
  // Tecnología
  'Tecnología (Robótica)': '#c17ba0',
  'Tecnología (Computación)': '#c17ba0',
  'Tecnología (financiera)': '#c17ba0',
  'Tecnología (Financiera)': '#c17ba0',
  'Robótica': '#c17ba0',
  'Computación': '#c17ba0',
  'COMPUTACION': '#c17ba0',
  'HUB (Robótica/Programación)': '#c17ba0',
  
  // Ajedrez
  'Ajedrez': '#cccccc',
  'Club (Ajedrez)': '#cccccc',
  
  // Educación Física y Deporte
  'Ed, Física y Deporte': '#ffc000',
  'EDUCACIÓN FÍSICA Y DEPORTE': '#ffc000',
  'FÍSICA (Inglés)': '#ffc000',
  
  // Valores
  'Valores': '#ffff00',
  
  // ADP
  'ADP': '#ffff00',
  
  // Taller Mañanero
  'Taller Mañanero': '#feff97',
  
  // Metacognición
  'Metacognición': '#feff99',
  'Metacogción': '#feff99',
  
  // Psicomotricidad
  'Psicomotricidad': '#feff99',
  
  // Conciencia Fonológica
  'Conciencia fonológica': '#feff99',
  'Conciencia Fonológica': '#feff99',
  
  // Clubes
  'Club (Teatro)': '#feff99',
  'Club (Estudiantina)': '#feff99',
  'Club (Música)': '#feff99',
  
  // Otras materias
  'Evaluación': '#F3F4F6',
  'Personal y Social': '#F3F4F6',
  'Relación con el ambiente': '#F3F4F6',
  'Comunicación y Representación': '#F3F4F6',
  'HUB (Gastronomia)': '#F3F4F6',
  'HUB (MUN)': '#F3F4F6',
  'ELECTIVA (Oratoria)': '#F3F4F6',
  'ELECTIVA (Inteligencia Artificial)': '#F3F4F6',
  'ELECTIVA (Seguridad y Prevención de Emergencias)': '#F3F4F6',
  'ELECTIVA (Edición videos)': '#F3F4F6',
  'ELECTIVA (Lab de Soluciones Verdes)': '#F3F4F6',
  'TDC (Teoría del Conocimiento)': '#F3F4F6',
  'CAS (Creatividad, Actividad y Servicio)': '#F3F4F6',
  'MONOGRAFIA': '#F3F4F6',
  'GESTION EMPRESARIAL': '#F3F4F6',
  
  // Default
  'default': '#F3F4F6',
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
    onMenuToggle?: () => void;
}> = ({ title, currentUser, onLogout, notifications, onNotificationClick, onMenuToggle }) => {
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
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-30">
            <div className="flex items-center gap-3">
                {onMenuToggle && (
                    <button
                        onClick={onMenuToggle}
                        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label="Toggle menu"
                    >
                        <MenuIcon className="h-6 w-6" />
                    </button>
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-text-main truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
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
                        <div className="hidden sm:block">
                            <p className="font-semibold text-text-main text-sm sm:text-base">{currentUser.fullName}</p>
                            <p className="text-xs sm:text-sm text-text-secondary capitalize">{currentUser.role}</p>
                        </div>
                        <div className="sm:hidden">
                            <UserCircleIcon className="h-8 w-8 text-gray-600" />
                        </div>
                        <ChevronDownIcon className="hidden sm:block" />
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
    isOpen: boolean;
    onClose: () => void;
}> = ({ activeView, onNavigate, userRole, isOpen, onClose }) => {
    const navLinks = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['directivo', 'coordinador', 'docente', 'administrativo'] },
        { id: 'students', label: 'Alumnos', icon: StudentsIcon, roles: ['directivo', 'coordinador', 'administrativo'] },
        { id: 'teachers', label: 'Docentes', icon: TeachersIcon, roles: ['directivo', 'coordinador'] },
        { id: 'schedules', label: 'Horarios', icon: CalendarIcon, roles: ['coordinador', 'directivo', 'docente'] },
        { id: 'schedule-generator', label: 'Generador de Horarios', icon: MagicWandIcon, roles: ['coordinador', 'directivo'] },
        { id: 'team-schedules', label: 'Horarios Equipo', icon: UsersIcon, roles: ['coordinador', 'directivo'] },
        { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['directivo', 'coordinador', 'docente'] },
        { id: 'planning', label: 'Planificaciones', icon: PlanningIcon, roles: ['directivo', 'coordinador', 'docente'] },
        { id: 'evaluation', label: 'Evaluación', icon: EvaluationIcon, roles: ['directivo', 'coordinador'] },
        { id: 'authorized-users', label: 'Usuarios Autorizados', icon: UsersIcon, roles: ['directivo'] },
    ].filter(link => link.roles.includes(userRole));

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
                w-64 bg-background-dark text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 lg:p-6 flex justify-between items-center lg:block">
                    <div className="text-center flex-1 lg:block">
                        <h2 className="text-xl lg:text-2xl font-bold text-brand-secondary">ManglarNet</h2>
                        <p className="text-xs lg:text-sm text-gray-400">Conexión Pedagógica</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                        aria-label="Close menu"
                    >
                        <CloseIcon />
                    </button>
                </div>
                <nav className="flex-1 px-2 lg:px-4 overflow-y-auto">
                    {navLinks.map(({ id, label, icon: Icon }) => (
                        <a
                            key={id}
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleNavigate(id); }}
                            className={`flex items-center gap-3 px-3 lg:px-4 py-3 my-1 rounded-md text-sm font-medium transition-colors ${
                                activeView === id
                                    ? 'bg-brand-primary text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span>{label}</span>
                        </a>
                    ))}
                </nav>
            </aside>
        </>
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
                    <select
                        value={currentWeek || ''}
                        onChange={(e) => setCurrentWeek(e.target.value ? parseInt(e.target.value) : null)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm min-w-[150px]"
                    >
                        <option value="">Elegir Semana</option>
                        {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
                            <option key={week} value={week}>Semana {week}</option>
                        ))}
                    </select>
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
            {!currentWeek ? (
                <div className="text-center py-12 text-gray-500 mt-4">
                    <p className="text-lg font-medium">Seleccione una semana para ver el horario</p>
                    <p className="text-sm mt-2">Use el menú desplegable arriba para elegir una semana (1-18)</p>
                </div>
            ) : (
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
                                                ? (subjectColors[clase?.nombre_materia || 'default'] || getSubjectColor(clase?.nombre_materia || ''))
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
            )}
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
                <button onClick={onAddStudent} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-md hover:bg-opacity-90 text-sm sm:text-base font-medium min-h-[44px]">
                    <PlusIcon />
                    <span className="hidden sm:inline">Añadir Alumno</span>
                    <span className="sm:hidden">Añadir</span>
                </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 p-2.5 border border-gray-300 rounded-md w-full text-base"
                    />
                </div>
                <select
                    value={filterGrade}
                    onChange={e => setFilterGrade(e.target.value)}
                    className="p-2.5 border border-gray-300 rounded-md text-base w-full sm:w-auto"
                >
                    {grades.map(grade => <option key={grade} value={grade}>{grade === 'all' ? 'Todos los Salones' : grade}</option>)}
                </select>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredStudents.map(student => (
                    <div key={student.id_alumno} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{student.nombres} {student.apellidos}</h3>
                                <p className="text-sm text-gray-500 mt-1">{student.email_alumno}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${student.condicion === 'Regular' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {student.condicion}
                            </span>
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm">
                                <span className="text-gray-600 font-medium w-24">Salón:</span>
                                <span className="text-gray-900">{student.salon}</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="text-gray-600 font-medium w-24">Cédula:</span>
                                <span className="text-gray-900">{student.cedula_escolar}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-200">
                            <button 
                                onClick={() => onSelectStudent(student)} 
                                className="flex-1 px-3 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium transition-colors"
                            >
                                Ver
                            </button>
                            <button 
                                onClick={() => onEditStudent(student)} 
                                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm font-medium transition-colors"
                            >
                                <EditIcon />
                            </button>
                            <button 
                                onClick={() => onDeleteStudent(student.id_alumno)} 
                                className="px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm font-medium transition-colors"
                            >
                                <DeleteIcon />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron alumnos
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-none sm:rounded-lg shadow-xl p-4 sm:p-6 lg:p-8 w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-bold">{student ? 'Editar Alumno' : 'Añadir Alumno'}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><CloseIcon /></button>
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
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t flex-shrink-0">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 rounded-md text-base font-medium">Cancelar</button>
                        <button type="submit" className="w-full sm:w-auto px-4 py-2.5 bg-brand-primary text-white rounded-md text-base font-medium">Guardar Alumno</button>
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
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        const gradeError = !currentGrade.trim() ? 'Seleccione un grado' : '';
        
        if (subjectError || gradeError) {
            setErrors(prev => ({
                ...prev,
                assignment: subjectError || gradeError
            }));
            return;
        }

        // Verificar si ya existe esta combinación
        if (assignments.some(a => a.subject === currentSubject && a.grade === currentGrade)) {
            setErrors(prev => ({
                ...prev,
                assignment: 'Esta asignatura y grado ya están agregados'
            }));
            return;
        }

        // Agregar la asignatura
        setAssignments(prev => [...prev, { 
            subject: currentSubject.trim(), 
            grade: currentGrade.trim() 
        }]);
        setCurrentSubject('');
        setCurrentGrade('');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-0 sm:p-4" onClick={onClose}>
            <div className="bg-white rounded-none sm:rounded-lg shadow-xl p-4 sm:p-6 lg:p-8 w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{teacher ? 'Editar Docente' : 'Añadir Docente'}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        disabled={isSubmitting}
                    >
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                    {/* Información Personal */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Información Personal</h3>
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
                                    <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>
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
                                    <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
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
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
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
                                    label="Especialidad (General)" 
                                    name="especialidad" 
                                    value={formData.especialidad} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Asignaturas y Grados */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Asignaturas y Grados</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex flex-wrap items-end gap-4 mb-4">
                                <div className="flex-grow min-w-[200px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Asignatura <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        value={currentSubject} 
                                        onChange={e => {
                                            setCurrentSubject(e.target.value);
                                            if (errors.assignment) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.assignment;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        className={`mt-1 block w-full p-2 border rounded-md ${
                                            errors.assignment ? 'border-red-500' : 'border-gray-300'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Seleccione una asignatura</option>
                                        {Object.entries(ASIGNATURAS_POR_NIVEL).map(([nivel, materias]) => (
                                            <optgroup label={nivel} key={nivel}>
                                                {materias.map(materia => <option key={materia} value={materia}>{materia}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-grow min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Grado <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        value={currentGrade} 
                                        onChange={e => {
                                            setCurrentGrade(e.target.value);
                                            if (errors.assignment) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.assignment;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        className={`mt-1 block w-full p-2 border rounded-md ${
                                            errors.assignment ? 'border-red-500' : 'border-gray-300'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Seleccione un grado</option>
                                        {GRADOS.map(grado => <option key={grado} value={grado}>{grado}</option>)}
                                    </select>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleAddAssignment} 
                                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    Añadir
                                </button>
                            </div>
                            {errors.assignment && (
                                <p className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{errors.assignment}</p>
                            )}
                            {assignments.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {assignments.map((a, index) => (
                                        <span 
                                            key={index} 
                                            className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-200"
                                        >
                                            <span className="font-semibold">{a.subject}</span>
                                            <span className="text-blue-600">({a.grade})</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveAssignment(index)} 
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                                disabled={isSubmitting}
                                                title="Eliminar"
                                            >
                                                <CloseIcon />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No hay asignaturas agregadas. Agregue al menos una asignatura y grado.</p>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t flex-shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed text-base font-medium"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-white rounded-md hover:bg-opacity-90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-medium"
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
                        </button>
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
    currentUser: Usuario;
}> = ({ docentes, clases, alumnos, setDocentes, setClases, currentUser }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Docente | null>(null);
    const [unlinkedUsers, setUnlinkedUsers] = useState<Array<{id: string, email: string, role: string}>>([]);
    const [showUnlinkedSection, setShowUnlinkedSection] = useState(false);

    const handleOpenModal = (teacher: Docente | null = null) => {
        setSelectedTeacher(teacher);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTeacher(null);
    };

    const handleSaveTeacher = async (teacherData: Docente, newAssignments: Assignment[]) => {
        try {
            // Update teacher details in Supabase
            const teacherExists = docentes.some(d => d.id_docente === teacherData.id_docente);
            let savedTeacher: Docente;
            
            if (teacherExists) {
                // Update existing teacher
                const { id_docente, created_at, updated_at, ...updateData } = teacherData;
                savedTeacher = await docentesService.update(id_docente, updateData);
                setDocentes(prev => prev.map(d => d.id_docente === savedTeacher.id_docente ? savedTeacher : d));
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
            
            // Create new classes based on assignments
            if (newAssignments.length > 0) {
                const createdClasses = [];
                const errors: string[] = [];
                
                for (const a of newAssignments) {
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
                
                // Mostrar errores si los hay
                if (errors.length > 0) {
                    alert('Algunas clases no se pudieron crear:\n\n' + errors.join('\n'));
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
                if (createdClasses.length === newAssignments.length) {
                    alert(`✅ Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente con ${createdClasses.length} asignatura(s).`);
                } else if (createdClasses.length > 0) {
                    alert(`⚠️ Docente ${teacherExists ? 'actualizado' : 'creado'} pero solo ${createdClasses.length} de ${newAssignments.length} asignaturas se guardaron correctamente.`);
                }
            } else {
                // Si no hay asignaturas, solo actualizar el estado local
                setClases(otherTeachersClasses);
                alert(`✅ Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente. Nota: No se agregaron asignaturas.`);
            }
            
            handleCloseModal();
        } catch (error: any) {
            console.error('Error saving teacher:', error);
            alert('Error al guardar el docente: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleDeleteTeacher = async (id_docente: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar a este docente? Esta acción también eliminará sus asignaturas.')) {
            try {
                // Get classes to delete
                const classesToDelete = clases.filter(c => c.id_docente_asignado === id_docente);
                
                // Delete classes from Supabase
                for (const clase of classesToDelete) {
                    try {
                        await clasesService.delete(clase.id_clase);
                    } catch (error) {
                        console.error('Error deleting class:', error);
                    }
                }
                
                // Delete teacher from Supabase
                await docentesService.delete(id_docente);
                
                // Update local state
                setDocentes(prev => prev.filter(d => d.id_docente !== id_docente));
                setClases(prev => prev.filter(c => c.id_docente_asignado !== id_docente));
            } catch (error: any) {
                console.error('Error deleting teacher:', error);
                alert('Error al eliminar el docente: ' + (error.message || 'Error desconocido'));
            }
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

            {/* Unlinked Authorized Users Section - Only for coordinadores and directivos */}
            {(currentUser.role === 'coordinador' || currentUser.role === 'directivo') && unlinkedUsers.length > 0 && (
                <div className="mt-8 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Usuarios Autorizados Sin Vincular</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Estos usuarios están en la lista blanca pero no tienen un registro de docente. 
                                Vincúlalos con un docente existente o crea un nuevo docente.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUnlinkedSection(!showUnlinkedSection)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
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
                                            <div className="font-medium text-gray-900">{user.email}</div>
                                            <div className="text-sm text-gray-500">Rol: {user.role}</div>
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
                                                className="px-4 py-1.5 bg-brand-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
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
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Planificacion | null>(null);
    const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    const [boardFilters, setBoardFilters] = useState({
        ano_escolar: 'all',
        lapso: 'all',
        id_clase: 'all',
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
            alert('Error al guardar la planificación: ' + (error.message || 'Error desconocido'));
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
        if (!currentUser || currentUser.role !== 'docente' || !currentUser.docenteId) return [];
        return clases
            .filter(c => c.id_docente_asignado === currentUser.docenteId)
            .map(c => ({ id_clase: c.id_clase, nombre_materia: c.nombre_materia, grado_asignado: c.grado_asignado}));
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
            const { ano_escolar, lapso, id_clase, id_docente } = boardFilters;
            
            if (ano_escolar && ano_escolar !== 'all') {
                filtered = filtered.filter(p => p.ano_escolar === ano_escolar);
            }
            
            if (lapso && lapso !== 'all') {
                filtered = filtered.filter(p => p.lapso === lapso);
            }
            
            if (id_clase && id_clase !== 'all') {
                filtered = filtered.filter(p => p.id_clase === id_clase);
            }
            
            if (id_docente && id_docente !== 'all') {
                filtered = filtered.filter(p => p.id_docente === id_docente);
            }
            
            return filtered;
        }, [planificaciones, boardFilters]);

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
                
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                    <InputField as="select" label="Año Escolar" name="ano_escolar" value={boardFilters.ano_escolar} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                    </InputField>
                    <InputField as="select" label="Lapso" name="lapso" value={boardFilters.lapso} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        <option value="I Lapso">I Lapso</option>
                        <option value="II Lapso">II Lapso</option>
                        <option value="III Lapso">III Lapso</option>
                    </InputField>
                    <InputField as="select" label="Materia" name="id_clase" value={boardFilters.id_clase} onChange={handleFilterChange}>
                        <option value="all">Todas</option>
                        {clases && clases.length > 0 ? clases.map(c => (
                            <option key={c.id_clase} value={c.id_clase}>{c.nombre_materia} ({c.grado_asignado})</option>
                        )) : null}
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
                                    {plan.competencia_indicadores && (
                                        <div className="mt-4 space-y-1 text-sm">
                                            <p><span className="font-semibold">Competencia:</span> {plan.competencia_indicadores.length > 50 ? plan.competencia_indicadores.substring(0, 50) + '...' : plan.competencia_indicadores}</p>
                                        </div>
                                    )}
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

    // Early return if currentUser is not available (after hooks)
    if (!currentUser) {
        return <div className="bg-white p-6 rounded-lg shadow-md">Cargando...</div>;
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
                />
            )}
            {isAiModalOpen && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-purple-500" />Sugerencias del Asistente IA</h2>
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
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cerrar</button>
                                    <button onClick={async () => {
                                        if (selectedPlan && aiSuggestions) {
                                            const updatedPlan = { ...selectedPlan, competencia_indicadores: aiSuggestions };
                                            await handleSavePlan(updatedPlan);
                                            setAiModalOpen(false);
                                        }
                                    }} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90">Aplicar Sugerencias</button>
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
}> = ({ schedules, setSchedules, clases, docentes, currentUser, alumnos }) => {
    const allGrades = useMemo(() => Array.from(new Set(alumnos.map(a => a.salon))).sort(), [alumnos]);
    const [selectedGrade, setSelectedGrade] = useState(allGrades[0] || '');
    const [currentWeek, setCurrentWeek] = useState<number | null>(null);
    const [draggedItem, setDraggedItem] = useState<any>(null);
    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [eventData, setEventData] = useState<{dia: number, hora: string, desc: string, id: string | null}>({dia: 0, hora: '', desc: '', id: null});
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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
    }, [weeklySchedule, selectedGrade, currentWeek, schedules, setSchedules]);


    const handleDrop = (day: number, slot: string) => {
        if (currentUser.role === 'docente') return; // Docentes no pueden editar
        if (!draggedItem || !currentWeek) return;

        const [hora_inicio, hora_fin] = slot.split(' - ');
        
        // Remove the item from its current position
        const updatedSchedule = weeklySchedule.filter(item => 
            !(draggedItem.type === 'class' && item.id_clase === draggedItem.id) &&
            !(draggedItem.type === 'event' && item.id_horario === draggedItem.id)
        );

        // Create new item with updated position
        const newItem: Horario = draggedItem.type === 'class'
            ? {
                id_horario: `h-${selectedGrade.replace(/\s+/g, '-')}-${currentWeek}-${day}-${hora_inicio.replace(':', '')}-${draggedItem.id}`,
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

    const handleSaveSchedule = async () => {
        if (!currentWeek || !selectedGrade) {
            setSaveMessage({ type: 'error', text: 'Por favor seleccione un grado y una semana' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Get current horarios for this grade and week from DB
            const existingHorarios = await horariosService.getByGradeAndWeek(selectedGrade, currentWeek);
            
            // Create a map of existing horarios by key (dia_semana-hora_inicio)
            const existingMap = new Map<string, HorarioDB>();
            existingHorarios.forEach(h => {
                const key = `${h.dia_semana}-${h.hora_inicio}`;
                existingMap.set(key, h);
            });

            // Get current schedule for this week
            const currentSchedule = schedules[selectedGrade]?.[currentWeek] || [];
            
            // Create a map of new horarios
            const newHorariosMap = new Map<string, Omit<HorarioDB, 'id_horario' | 'created_at' | 'updated_at'>>();
            const horariosToCreate: Array<Omit<HorarioDB, 'id_horario' | 'created_at' | 'updated_at'>> = [];
            const horariosToDelete: string[] = [];

            // Process each item in the current schedule
            for (const horario of currentSchedule) {
                const key = `${horario.dia_semana}-${horario.hora_inicio}`;
                const newHorario = {
                    grado: selectedGrade,
                    semana: currentWeek,
                    id_docente: horario.id_docente,
                    id_clase: horario.id_clase,
                    dia_semana: horario.dia_semana,
                    hora_inicio: horario.hora_inicio,
                    hora_fin: horario.hora_fin,
                    evento_descripcion: horario.evento_descripcion
                };
                newHorariosMap.set(key, newHorario);

                const existing = existingMap.get(key);
                if (!existing) {
                    // New horario to create
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
                        });
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
                    await supabase.from('horarios').insert(batch);
                }
            }

            setSaveMessage({ type: 'success', text: `Horarios de la Semana ${currentWeek} guardados exitosamente` });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error: any) {
            console.error('Error saving schedule:', error);
            setSaveMessage({ type: 'error', text: `Error al guardar: ${error.message || 'Error desconocido'}` });
            setTimeout(() => setSaveMessage(null), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex gap-6">
            <div className="flex-grow bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                     <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="p-2 border rounded-md">
                        {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Semana:</label>
                            <select
                                value={currentWeek || ''}
                                onChange={(e) => setCurrentWeek(e.target.value ? parseInt(e.target.value) : null)}
                                className="p-2 border border-gray-300 rounded-md shadow-sm min-w-[150px]"
                            >
                                <option value="">Elegir Semana</option>
                                {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
                                    <option key={week} value={week}>Semana {week}</option>
                                ))}
                            </select>
                        </div>
                        {currentWeek && (currentUser.role === 'coordinador' || currentUser.role === 'directivo') && (
                            <button
                                onClick={handleSaveSchedule}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors ${
                                    isSaving 
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
                    <div className={`mb-4 p-3 rounded-md ${
                        saveMessage.type === 'success' 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                        {saveMessage.text}
                    </div>
                )}
                {!currentWeek ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg font-medium">Seleccione una semana para ver el horario</p>
                        <p className="text-sm mt-2">Use el menú desplegable arriba para elegir una semana (1-18)</p>
                    </div>
                ) : (
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
                                                            className={`bg-gray-200 p-2 rounded-md h-full ${currentUser.role !== 'docente' ? 'cursor-pointer' : 'cursor-default'}`}
                                                        >
                                                             <div className="font-semibold text-gray-700 flex items-center gap-1">
                                                                <TagIcon className="h-4 w-4 text-gray-500" />
                                                                {item.evento_descripcion}
                                                            </div>
                                                        </div>
                                                    ) : item.id_clase && (
                                                        <div 
                                                            draggable={currentUser.role !== 'docente'} 
                                                            onDragStart={(e) => handleDragStart(e, item, 'event')} 
                                                            className={`h-full ${currentUser.role !== 'docente' ? 'cursor-grab' : 'cursor-default'}`}
                                                        >
                                                        {(clase => (
                                                            <div className="p-2 rounded-md h-full" style={{backgroundColor: subjectColors[clase?.nombre_materia || 'default'] || getSubjectColor(clase?.nombre_materia || '')}}>
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
                            {unassignedClasses.map(clase => (
                                 <div key={clase.id_clase}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, clase, 'class')}
                                    className="p-2 rounded-md cursor-grab hover:shadow-md transition-shadow"
                                    style={{backgroundColor: subjectColors[clase.nombre_materia] || getSubjectColor(clase.nombre_materia)}}
                                 >
                                    <div className="font-bold">{clase.nombre_materia}</div>
                                    <div className="text-sm text-gray-600">{docentes.find(d => d.id_docente === clase.id_docente_asignado)?.nombres}</div>
                                </div>
                            ))}
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
                                                        <div className="p-2 rounded-md h-full" style={{backgroundColor: subjectColors[clase.nombre_materia] || getSubjectColor(clase.nombre_materia)}}>
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

// ============================================
// SCHEDULE GENERATOR VIEW COMPONENT
// ============================================

const ScheduleGeneratorView: React.FC<{
    currentUser: Usuario;
}> = ({ currentUser }) => {
    const [anoEscolar, setAnoEscolar] = useState('2024-2025');
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
            } catch (err: any) {
                console.error('Error loading configuration:', err);
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <MagicWandIcon className="h-8 w-8 text-purple-600" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Generador de Horarios</h2>
                        <p className="text-gray-600">Genera horarios automáticamente usando optimización matemática</p>
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
                            <option value="2024-2025">2024-2025</option>
                            <option value="2025-2026">2025-2026</option>
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

                {configuracion && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">Configuración Actual</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Bloques:</strong> {configuracion.bloques_horarios.length} bloques configurados</p>
                            <p><strong>Días:</strong> {configuracion.dias_semana.join(', ')}</p>
                            <p><strong>Semanas totales:</strong> {configuracion.semanas_totales}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !configuracion}
                    className={`w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-medium min-h-[44px]`}
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
                        <div className={`p-4 border rounded-lg ${
                            generacionActual.estado === 'completado' 
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

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Información</h3>
                <div className="space-y-3 text-sm text-gray-600">
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
                            className={`min-h-[100px] border-r border-b p-2 ${
                                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                            } ${isToday(date) ? 'bg-blue-50' : ''} ${currentUser.role !== 'docente' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                            onClick={() => {
                                if (currentUser.role !== 'docente' && date) {
                                    handleOpenModal(date);
                                }
                            }}
                        >
                            {date && (
                                <>
                                    <div className={`text-sm font-medium mb-1 ${
                                        isToday(date) 
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
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Header con navegación */}
            <div className="flex justify-between items-center mb-6">
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
                        className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                    >
                        Hoy
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {/* Selector de vista */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                        <button
                            onClick={() => setViewType('month')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${
                                viewType === 'month' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setViewType('week')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${
                                viewType === 'week' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setViewType('day')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${
                                viewType === 'day' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Día
                        </button>
                        <button
                            onClick={() => setViewType('list')}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${
                                viewType === 'list' 
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
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                {/* Filtros por tipo de evento */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Ver Calendarios:</h3>
                    <div className="space-y-2">
                        {Object.keys(filtrosTipo).map(tipo => (
                            <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filtrosTipo[tipo]}
                                    onChange={(e) => setFiltrosTipo(prev => ({ ...prev, [tipo]: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: coloresEventos[tipo] }}
                                    />
                                    {tipo}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Filtros por nivel educativo */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Ver Niveles:</h3>
                    <div className="space-y-2">
                        {Object.keys(filtrosNivel).map(nivel => (
                            <label key={nivel} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filtrosNivel[nivel]}
                                    onChange={(e) => setFiltrosNivel(prev => ({ ...prev, [nivel]: e.target.checked }))}
                                    className="rounded"
                                />
                                <span>Mostrar solo {nivel}</span>
                            </label>
                        ))}
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
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
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

    const handleSaveMinuta = async () => {
        try {
            const newMinuta: MinutaEvaluacion = {
                id_minuta: `minuta-${Date.now()}`, // Temporal, será omitido
                ...filters,
                fecha_creacion: new Date().toISOString(),
                datos_alumnos: Array.from(studentEvals.values()),
                analisis_ia: aiAnalysis,
            };
            
            // Save to Supabase - omitir id_minuta para que Supabase lo genere
            const { id_minuta, fecha_creacion, updated_at, ...minutaData } = newMinuta;
            
            // Asegurar que los arrays estén en el formato correcto
            const minutaToSave = {
                ...minutaData,
                datos_alumnos: minutaData.datos_alumnos || [],
                analisis_ia: minutaData.analisis_ia || []
            };
            
            const created = await minutasService.create(minutaToSave);
            
            // Recargar todas las minutas desde Supabase para asegurar sincronización
            const allMinutas = await minutasService.getAll();
            setMinutas(allMinutas);
            
            alert('Minuta de la reunión guardada con éxito.');
            setFilters({ ano_escolar: '2024-2025', lapso: 'I Lapso', evaluacion: 'I Mensual', grado: '', materia: '' });
            setStudentEvals(new Map());
            setAiAnalysis([]);
        } catch (error: any) {
            console.error('Error saving minuta:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            alert('Error al guardar la minuta: ' + (error.message || 'Error desconocido') + '\n\nRevisa la consola para más detalles.');
        }
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data states - loaded from Supabase
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedules>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [minutas, setMinutas] = useState<MinutaEvaluacion[]>([]);

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // View-specific states
  const [selectedStudent, setSelectedStudent] = useState<Alumno | null>(null);
  const [isStudentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Alumno | null>(null);
  const [navParams, setNavParams] = useState<any>(null);

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

  const convertHorario = (db: HorarioDB): Horario => {
    // HorarioDB has grado and semana, but Horario interface doesn't
    // These are handled separately in WeeklySchedules structure
    const { created_at, updated_at, grado, semana, ...horario } = db;
    return horario as Horario;
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
    if (!currentUser) return;
    
    setIsLoadingData(true);
    setDataError(null);
    
    try {
      // Load all data in parallel
      const [alumnosData, docentesData, clasesData, planificacionesData, horariosData, minutasData, notificationsData] = await Promise.all([
        alumnosService.getAll().catch((err) => { console.error('Error loading alumnos:', err); return []; }),
        docentesService.getAll().catch((err) => { console.error('Error loading docentes:', err); return []; }),
        clasesService.getAll().catch((err) => { console.error('Error loading clases:', err); return []; }),
        planificacionesService.getAll().catch((err) => { console.error('Error loading planificaciones:', err); return []; }),
        horariosService.getAll().catch((err) => { console.error('Error loading horarios:', err); return []; }),
        minutasService.getAll().catch((err) => { 
          console.error('Error loading minutas:', err); 
          console.error('Minutas error details:', JSON.stringify(err, null, 2));
          return []; 
        }),
        notificacionesService.getAll().catch((err) => { console.error('Error loading notifications:', err); return []; })
      ]);

      setAlumnos(alumnosData.map(convertAlumno));
      setDocentes(docentesData);
      setClases(clasesData.map(convertClase));
      setPlanificaciones(planificacionesData);
      setMinutas(minutasData);
      setNotifications(notificationsData.map(n => {
        const linkTo = typeof n.link_to === 'string' ? JSON.parse(n.link_to) : n.link_to;
        return {
          ...n,
          recipientId: n.recipient_id,
          linkTo: linkTo || { view: 'dashboard' }
        };
      }));

      // Build schedules from horarios
      const schedulesMap: WeeklySchedules = {};
      horariosData.forEach(h => {
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

          // For docentes, try to link to existing docente record by email
          let docenteId: string | undefined = undefined;
          if (authorizedUser.role === 'docente') {
            try {
              // Try to find existing docente by email
              const { data: docente } = await supabase
                .from('docentes')
                .select('id_docente, id_usuario')
                .eq('email', session.user.email.toLowerCase())
                .single();

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
  
  const handleLoginSuccess = async (user: { id: string; email: string; role: string; fullName?: string }) => {
    // For docentes, try to link to existing docente record by email
    let docenteId: string | undefined = undefined;
    if (user.role === 'docente') {
      try {
        // Try to find existing docente by email
        const { data: docente } = await supabase
          .from('docentes')
          .select('id_docente, id_usuario')
          .eq('email', user.email.toLowerCase())
          .single();

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
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      fullName: user.fullName,
      docenteId: docenteId,
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
  
  const handleNotificationClick = async (notification: Notification) => {
    try {
      await notificacionesService.markAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, isRead: true} : n));
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
      } else {
        // Create new student
        const { id_alumno, ...newStudent } = studentData;
        const dbData = convertAlumnoToDB(newStudent as Alumno);
        const created = await alumnosService.create(dbData);
        setAlumnos(prev => [...prev, convertAlumno(created)]);
      }
      handleCloseStudentModal();
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert('Error al guardar el alumno: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar a este alumno?')) {
      try {
        await alumnosService.delete(studentId);
        setAlumnos(prev => prev.filter(s => s.id_alumno !== studentId));
      } catch (error: any) {
        console.error('Error deleting student:', error);
        alert('Error al eliminar el alumno: ' + (error.message || 'Error desconocido'));
      }
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
        return <TeachersView docentes={docentes} clases={clases} alumnos={alumnos} setDocentes={setDocentes} setClases={setClases} currentUser={currentUser!} />;
      case 'planning':
        return <PlanningView planificaciones={planificaciones} setPlanificaciones={setPlanificaciones} clases={clases} docentes={docentes} currentUser={currentUser!} navParams={navParams}/>;
      case 'calendar':
        return <CalendarView currentUser={currentUser!} />;
      case 'schedules':
        return <ScheduleView schedules={schedules} setSchedules={setSchedules} clases={clases} docentes={docentes} currentUser={currentUser!} alumnos={alumnos} />;
      case 'team-schedules':
        return <TeamScheduleView docentes={docentes} schedules={schedules} setSchedules={setSchedules} clases={clases} alumnos={alumnos}/>;
      case 'schedule-generator':
        return <ScheduleGeneratorView currentUser={currentUser!} />;
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
      'schedule-generator': 'Generador de Horarios',
      'team-schedules': 'Horarios de Equipo',
      calendar: 'Calendario',
      planning: 'Planificaciones',
      evaluation: 'Seguimiento Pedagógico',
      'authorized-users': 'Usuarios Autorizados',
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (isLoadingData) {
    return (
      <div className="flex h-screen bg-background-light items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex h-screen bg-background-light items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <button
            onClick={() => loadAllData()}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-green-600"
          >
            Reintentar
          </button>
        </div>
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
