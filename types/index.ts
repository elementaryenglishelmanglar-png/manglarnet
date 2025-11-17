// Shared types for the application

export type UserRole = 'docente' | 'coordinador' | 'directivo' | 'administrativo';

export interface Usuario {
  id: string; // UUID
  email: string;
  role: UserRole;
  docenteId?: string; // UUID
  fullName?: string;
}

export interface Alumno {
  id_alumno: string;
  nombres: string;
  apellidos: string;
  email_alumno: string;
  lugar_nacimiento: string;
  estado: string;
  fecha_nacimiento: string;
  cedula_escolar: string;
  condicion: string;
  hermanos: string[];
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

export interface Docente {
  id_docente: string;
  id_usuario?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  especialidad: string;
}

export interface Clase {
  id_clase: string;
  nombre_materia: string;
  grado_asignado: string;
  id_docente_asignado: string;
  id_aula?: string | null;
  studentIds: string[];
  nivel_ingles?: string | null;
  skill_rutina?: string | null;
  es_ingles_primaria?: boolean;
  es_proyecto?: boolean;
}

export interface Aula {
  id_aula: string;
  nombre: string;
  nombre_aula?: string;
  capacidad?: number;
  tipo?: string;
  activa?: boolean;
}

export interface Assignment {
  subject: string;
  grade: string;
  nivel_ingles?: string;
  id_aula?: string;
}

export interface Planificacion {
  id_planificacion: string;
  id_docente: string | null;
  id_clase: string;
  semana: number;
  lapso: 'I Lapso' | 'II Lapso' | 'III Lapso';
  ano_escolar: string;
  fecha_creacion: string;
  competencia_indicadores: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  recursos_links?: string;
  status: 'Borrador' | 'Enviado' | 'Revisado' | 'Aprobado';
  observaciones?: string;
  nombres_docente?: string;
  apellidos_docente?: string;
}

export interface Horario {
  id_horario: string;
  id_docente: string | null;
  id_clase: string | null;
  id_aula?: string | null;
  lapso?: string | null;
  ano_escolar?: string | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  evento_descripcion?: string;
}

export interface EventoCalendario {
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
}

export interface Lapso {
  id_lapso: string;
  ano_escolar: string;
  lapso: 'I Lapso' | 'II Lapso' | 'III Lapso';
  fecha_inicio: string;
  fecha_fin: string;
  semanas_totales: number;
  activo: boolean;
}

export interface Notification {
  id: string;
  recipient_id: string;
  recipientId: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link_to?: string;
  linkTo?: {
    view: string;
    params?: any;
  };
}

