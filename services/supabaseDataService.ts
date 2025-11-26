// Supabase Data Service
// This service handles all database operations for the ManglarNet application

import { supabase } from './supabaseClient';

// Types (matching App.tsx interfaces)
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
  created_at?: string;
  updated_at?: string;
}

export interface Docente {
  id_docente: string;
  id_usuario?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  especialidad: string;
  created_at?: string;
  updated_at?: string;
}

export interface Clase {
  id_clase: string;
  nombre_materia: string;
  grado_asignado: string;
  id_docente_asignado: string;
  id_aula?: string | null; // UUID - Aula/salón asignado
  student_ids: string[];
  nivel_ingles?: string | null; // 'Basic', 'Lower', 'Upper', null
  skill_rutina?: string | null; // 'Reading', 'Writing', 'Speaking', 'Listening', 'Use of English', 'Phonics', 'Project', null
  es_ingles_primaria?: boolean;
  es_proyecto?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Planificacion {
  id_planificacion: string;
  id_docente: string | null; // Can be null if docente is deleted
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
  updated_at?: string;
  nombres_docente?: string; // Preserved docente name
  apellidos_docente?: string; // Preserved docente last name
}

export interface Lapso {
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

export interface SemanaLapso {
  id_semana_lapso: string;
  id_lapso: string;
  numero_semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  created_at?: string;
  updated_at?: string;
}

export interface Horario {
  id_horario: string;
  id_docente: string | null;
  id_clase: string | null;
  id_aula?: string | null; // Nueva columna para aula
  grado: string;
  semana: number;
  lapso?: string | null; // NUEVO: Lapso académico
  ano_escolar?: string | null; // NUEVO: Año escolar
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  evento_descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MinutaEvaluacion {
  id_minuta: string;
  ano_escolar: string;
  lapso: string;
  evaluacion: string;
  grado: string;
  materia: string;
  fecha_creacion: string;
  datos_alumnos: any[];
  analisis_ia: any[];
  created_by?: string;
  updated_at?: string;
  // Clinical-Pedagogical Diagnostic System: "Soft data" fields
  nivel_independencia?: 'Autónomo' | 'Apoyo Parcial' | 'Apoyo Total';
  estado_emocional?: 'Enfocado' | 'Ansioso' | 'Distraído' | 'Participativo';
  eficacia_accion_anterior?: 'Resuelto' | 'En Proceso' | 'Ineficaz';
}

export interface MaestraIndicador {
  id_indicador: string;
  id_clase: string;
  categoria: 'Competencia' | 'Indicador';
  descripcion: string;
  orden: number;
  activo: boolean;
  rutina?: string;
  id_padre?: string;
  codigo_unico?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleEvaluacionAlumno {
  id_detalle: string;
  id_minuta: string;
  id_alumno: string;
  id_indicador: string;
  nivel_logro: string; // A-E scale
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResumenEvaluacionAlumno {
  id_resumen: string;
  id_minuta: string;
  id_alumno: string;
  nota?: string;
  inasistencias?: number; // Count of absences
  nivel_independencia?: 'Autónomo' | 'Apoyo Parcial' | 'Apoyo Constante' | 'No Logrado';
  estado_emocional?: 'Enfocado' | 'Ansioso/Nervioso' | 'Distraído' | 'Apatía/Desinterés' | 'Cansado' | 'Participativo';
  eficacia_accion_anterior?: 'Resuelto' | 'En Proceso' | 'Ineficaz' | 'No Aplica';
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// --- NEW TYPES FOR EVALUATION MODULE ---
export type Nota = 'A' | 'B' | 'C' | 'D' | 'E' | 'SE' | '';
export type Adaptacion = 'Reg' | 'AC+' | 'AC-' | '';

export interface EvaluacionAlumno {
  id_alumno: string;
  nota: Nota;
  adaptacion: Adaptacion;
  observaciones: string;
  // Pedagogical Intelligence Fields
  inasistencias?: number;
  nivel_independencia?: 'Autónomo' | 'Apoyo Parcial' | 'Apoyo Constante' | 'No Logrado';
  estado_emocional?: 'Enfocado' | 'Ansioso/Nervioso' | 'Distraído' | 'Apatía/Desinterés' | 'Cansado' | 'Participativo';
  eficacia_accion_anterior?: 'Resuelto' | 'En Proceso' | 'Ineficaz' | 'No Aplica';
}

export interface EventoCalendario {
  id_evento: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string; // TIMESTAMPTZ
  fecha_fin: string; // TIMESTAMPTZ
  tipo_evento: 'Actividades Generales' | 'Actos Cívicos' | 'Entregas Administrativas' | 'Reuniones de Etapa';
  nivel_educativo: string[]; // ['Preescolar', 'Primaria', 'Bachillerato']
  color?: string; // Color hexadecimal
  todo_dia: boolean;
  creado_por?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  link_to: {
    view: string;
    params?: any;
  } | string; // Can be JSON string or object
  created_at?: string;
}

export interface Guardia {
  id_guardia: string;
  id_usuario?: string | null;
  id_docente?: string | null;
  fecha: string; // DATE
  hora_inicio: string; // TIME
  hora_fin?: string | null; // TIME
  descripcion: string;
  ubicacion?: string | null;
  tipo_guardia?: 'Entrada' | 'Recreo' | 'Salida' | 'Especial' | null;
  created_at?: string;
  updated_at?: string;
}

export interface LogReunionCoordinacion {
  id_log: string;
  id_minuta?: string | null;
  fecha_reunion: string; // DATE
  grado: string;
  materia?: string | null;
  tipo_alerta?: 'Académica' | 'Conductual' | 'Asistencia' | 'Otro' | null;
  categoria: string;
  descripcion?: string | null;
  frecuencia: number;
  estudiantes_afectados?: string[] | null;
  acciones_sugeridas?: string | null;
  estado?: 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Archivado';
  creado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TareaCoordinador {
  id_tarea: string;
  id_usuario?: string | null;
  descripcion: string;
  completada: boolean;
  fecha_creacion?: string;
  fecha_completada?: string | null;
  prioridad?: 'Baja' | 'Normal' | 'Alta' | 'Urgente';
  created_at?: string;
  updated_at?: string;
}

// ============================================
// SCHEDULE OPTIMIZER TYPES
// ============================================

export interface Aula {
  id_aula: string;
  nombre: string;
  tipo_aula: 'Aula Regular' | 'Laboratorio' | 'Sala de Computación' | 'Gimnasio' | 'Biblioteca' | 'Auditorio' | 'Taller';
  capacidad: number;
  equipamiento: Record<string, any>;
  activa: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DocenteMateria {
  id: string;
  id_docente: string;
  nombre_materia: string;
  nivel_prioridad: 1 | 2 | 3; // 1 = puede dar, 2 = prefiere, 3 = especialidad
  created_at?: string;
}

export interface ClaseRequisito {
  id: string;
  id_clase: string;
  tipo_aula_requerida?: string;
  id_aula_especifica?: string;
  equipamiento_requerido: Record<string, any>;
  max_alumnos?: number;
  created_at?: string;
}

export interface ConfiguracionHorario {
  id: string;
  ano_escolar: string;
  bloques_horarios: Array<{
    inicio: string;
    fin: string;
    nombre: string;
  }>;
  dias_semana: string[];
  semanas_totales: number;
  activa: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RestriccionDura {
  id: string;
  tipo: 'docente_no_disponible' | 'aula_no_disponible' | 'clase_fija' |
  'docente_max_horas_dia' | 'docente_min_horas_dia' | 'grado_no_disponible' |
  'docente_max_horas_semana' | 'docente_min_horas_semana';
  id_docente?: string;
  id_clase?: string;
  id_aula?: string;
  grado?: string;
  dia_semana?: number; // 1-5
  hora_inicio?: string;
  hora_fin?: string;
  valor?: number; // Para max/min horas
  activa: boolean;
  ano_escolar: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RestriccionSuave {
  id: string;
  tipo: 'docente_preferencia_horario' | 'docente_preferencia_dia' |
  'materia_preferencia_orden' | 'docente_agrupar_horas' |
  'materia_preferencia_horario' | 'docente_evitar_huecos';
  id_docente?: string;
  id_clase?: string;
  nombre_materia?: string;
  dia_semana?: number; // 1-5
  hora_inicio?: string;
  hora_fin?: string;
  preferencia?: 'prefiere' | 'evita';
  peso: number; // 1-10
  relacion_materia?: string;
  activa: boolean;
  ano_escolar: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneracionHorario {
  id: string;
  ano_escolar: string;
  semana: number;
  estado: 'generando' | 'completado' | 'fallido' | 'aplicado' | 'cancelado';
  configuracion: Record<string, any>;
  resultado?: Record<string, any>;
  errores?: string[];
  advertencias?: string[];
  tiempo_ejecucion_ms?: number;
  estadisticas?: Record<string, any>;
  creado_por?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// ALUMNOS (Students)
// ============================================

export const alumnosService = {
  async getAll(): Promise<Alumno[]> {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .order('apellidos', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Alumno | null> {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('id_alumno', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(alumno: Omit<Alumno, 'id_alumno' | 'created_at' | 'updated_at'>): Promise<Alumno> {
    const { data, error } = await supabase
      .from('alumnos')
      .insert([alumno])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Alumno>): Promise<Alumno> {
    const { data, error } = await supabase
      .from('alumnos')
      .update(updates)
      .eq('id_alumno', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('alumnos')
      .delete()
      .eq('id_alumno', id);

    if (error) throw error;
  }
};

// ============================================
// DOCENTES (Teachers)
// ============================================

export const docentesService = {
  async getAll(): Promise<Docente[]> {
    const { data, error } = await supabase
      .from('docentes')
      .select('*')
      .order('apellidos', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Docente | null> {
    const { data, error } = await supabase
      .from('docentes')
      .select('*')
      .eq('id_docente', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(docente: Omit<Docente, 'id_docente' | 'created_at' | 'updated_at'>): Promise<Docente> {
    const { data, error } = await supabase
      .from('docentes')
      .insert([docente])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Docente>): Promise<Docente> {
    const { data, error } = await supabase
      .from('docentes')
      .update(updates)
      .eq('id_docente', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('docentes')
      .delete()
      .eq('id_docente', id);

    if (error) throw error;
  }
};

// ============================================
// CLASES (Classes)
// ============================================

export const clasesService = {
  async getAll(): Promise<Clase[]> {
    const { data, error } = await supabase
      .from('clases')
      .select('*')
      .order('grado_asignado', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Clase | null> {
    const { data, error } = await supabase
      .from('clases')
      .select('*')
      .eq('id_clase', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(clase: Omit<Clase, 'id_clase' | 'created_at' | 'updated_at'>): Promise<Clase> {
    const { data, error } = await supabase
      .from('clases')
      .insert([clase])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Clase>): Promise<Clase> {
    const { data, error } = await supabase
      .from('clases')
      .update(updates)
      .eq('id_clase', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clases')
      .delete()
      .eq('id_clase', id);

    if (error) throw error;
  }
};

// ============================================
// PLANIFICACIONES (Lesson Plans)
// ============================================

export const planificacionesService = {
  async getAll(): Promise<Planificacion[]> {
    const { data, error } = await supabase
      .from('planificaciones')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Planificacion | null> {
    const { data, error } = await supabase
      .from('planificaciones')
      .select('*')
      .eq('id_planificacion', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(planificacion: Omit<Planificacion, 'id_planificacion' | 'fecha_creacion' | 'updated_at'>): Promise<Planificacion> {
    const { data, error } = await supabase
      .from('planificaciones')
      .insert([planificacion])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Planificacion>): Promise<Planificacion> {
    const { data, error } = await supabase
      .from('planificaciones')
      .update(updates)
      .eq('id_planificacion', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('planificaciones')
      .delete()
      .eq('id_planificacion', id);

    if (error) throw error;
  }
};

// ============================================
// HORARIOS (Schedules)
// ============================================

export const horariosService = {
  async getByGradeAndWeek(grado: string, semana: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('horarios')
      .select(`
        *,
        clases (
          id_clase,
          nombre_materia,
          grado_asignado,
          id_docente_asignado,
          es_ingles_primaria,
          nivel_ingles,
          skill_rutina,
          id_aula
        ),
        docentes (
          id_docente,
          nombres,
          apellidos,
          email
        )
      `)
      .eq('grado', grado)
      .eq('semana', semana)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('horarios')
      .select(`
        *,
        clases (
          id_clase,
          nombre_materia,
          grado_asignado,
          id_docente_asignado,
          es_ingles_primaria,
          nivel_ingles,
          skill_rutina,
          id_aula
        ),
        docentes (
          id_docente,
          nombres,
          apellidos,
          email
        )
      `)
      .order('grado', { ascending: true })
      .order('semana', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(horario: Omit<Horario, 'id_horario' | 'created_at' | 'updated_at'>): Promise<Horario> {
    const { data, error } = await supabase
      .from('horarios')
      .insert([horario])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Horario>): Promise<Horario> {
    const { data, error } = await supabase
      .from('horarios')
      .update(updates)
      .eq('id_horario', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('horarios')
      .delete()
      .eq('id_horario', id);

    if (error) throw error;
  },

  async deleteByGradeAndWeek(grado: string, semana: number): Promise<void> {
    const { error } = await supabase
      .from('horarios')
      .delete()
      .eq('grado', grado)
      .eq('semana', semana);

    if (error) throw error;
  },

  async getByGradeWeekAndLapso(grado: string, semana: number, lapso: string, anoEscolar: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('horarios')
      .select(`
        *,
        clases (
          id_clase,
          nombre_materia,
          grado_asignado,
          id_docente_asignado,
          es_ingles_primaria,
          nivel_ingles,
          skill_rutina,
          id_aula
        ),
        docentes (
          id_docente,
          nombres,
          apellidos,
          email
        )
      `)
      .eq('grado', grado)
      .eq('semana', semana)
      .eq('lapso', lapso)
      .eq('ano_escolar', anoEscolar)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// ============================================
// LAPSOS (Academic Periods)
// ============================================

export const lapsosService = {
  async getAll(anoEscolar?: string): Promise<Lapso[]> {
    let query = supabase
      .from('lapsos')
      .select('*')
      .eq('activo', true)
      .order('lapso', { ascending: true });

    if (anoEscolar) {
      query = query.eq('ano_escolar', anoEscolar);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Lapso | null> {
    const { data, error } = await supabase
      .from('lapsos')
      .select('*')
      .eq('id_lapso', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByAnoEscolar(anoEscolar: string): Promise<Lapso[]> {
    const { data, error } = await supabase
      .from('lapsos')
      .select('*')
      .eq('ano_escolar', anoEscolar)
      .eq('activo', true)
      .order('lapso', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(lapso: Omit<Lapso, 'id_lapso' | 'created_at' | 'updated_at'>): Promise<Lapso> {
    const { data, error } = await supabase
      .from('lapsos')
      .insert([lapso])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Lapso>): Promise<Lapso> {
    const { data, error } = await supabase
      .from('lapsos')
      .update(updates)
      .eq('id_lapso', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('lapsos')
      .delete()
      .eq('id_lapso', id);

    if (error) throw error;
  }
};

// ============================================
// SEMANAS_LAPSO (Weeks within a Lapso)
// ============================================

export const semanasLapsoService = {
  async getByLapso(idLapso: string): Promise<SemanaLapso[]> {
    const { data, error } = await supabase
      .from('semanas_lapso')
      .select('*')
      .eq('id_lapso', idLapso)
      .order('numero_semana', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByLapsoAndWeek(idLapso: string, numeroSemana: number): Promise<SemanaLapso | null> {
    const { data, error } = await supabase
      .from('semanas_lapso')
      .select('*')
      .eq('id_lapso', idLapso)
      .eq('numero_semana', numeroSemana)
      .single();

    if (error) throw error;
    return data;
  },

  async getByDate(date: Date, anoEscolar: string): Promise<SemanaLapso | null> {
    const dateStr = date.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('semanas_lapso')
      .select(`
        *,
        lapsos!inner(ano_escolar, lapso)
      `)
      .eq('lapsos.ano_escolar', anoEscolar)
      .lte('fecha_inicio', dateStr)
      .gte('fecha_fin', dateStr)
      .single();

    if (error) {
      // Si no se encuentra, retornar null en lugar de lanzar error
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getAll(anoEscolar?: string): Promise<Array<SemanaLapso & { lapso?: string; ano_escolar?: string }>> {
    let query = supabase
      .from('semanas_lapso')
      .select(`
        *,
        lapsos!inner(ano_escolar, lapso, activo)
      `)
      .eq('lapsos.activo', true)
      .order('fecha_inicio', { ascending: true });

    if (anoEscolar) {
      query = query.eq('lapsos.ano_escolar', anoEscolar);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Transformar los datos para incluir información del lapso
    return (data || []).map((item: any) => ({
      ...item,
      lapso: item.lapsos?.lapso,
      ano_escolar: item.lapsos?.ano_escolar
    }));
  }
};

// ============================================
// MINUTAS EVALUACION (Evaluation Minutes)
// ============================================

export const minutasService = {
  async getAll(): Promise<MinutaEvaluacion[]> {
    const { data, error } = await supabase
      .from('minutas_evaluacion')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<MinutaEvaluacion | null> {
    const { data, error } = await supabase
      .from('minutas_evaluacion')
      .select('*')
      .eq('id_minuta', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(minuta: Omit<MinutaEvaluacion, 'id_minuta' | 'fecha_creacion' | 'updated_at'>): Promise<MinutaEvaluacion> {
    const { data, error } = await supabase
      .from('minutas_evaluacion')
      .insert([minuta])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<MinutaEvaluacion>): Promise<MinutaEvaluacion> {
    const { data, error } = await supabase
      .from('minutas_evaluacion')
      .update(updates)
      .eq('id_minuta', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('minutas_evaluacion')
      .delete()
      .eq('id_minuta', id);

    if (error) throw error;
  }
};

// ============================================
// NOTIFICACIONES (Notifications)
// ============================================

export const notificacionesService = {
  async getByRecipient(recipientId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(notificacion: Omit<Notification, 'id' | 'timestamp' | 'created_at'>): Promise<Notification> {
    const dbData = {
      ...notificacion,
      link_to: typeof notificacion.link_to === 'string'
        ? notificacion.link_to
        : JSON.stringify(notificacion.link_to)
    };
    const { data, error } = await supabase
      .from('notificaciones')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      link_to: typeof data.link_to === 'string' ? JSON.parse(data.link_to) : data.link_to
    };
  },
};

// ============================================
// AULAS (Classrooms)
// ============================================

export const aulasService = {
  async getAll(): Promise<Aula[]> {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Aula | null> {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('id_aula', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(aula: Omit<Aula, 'id_aula' | 'created_at' | 'updated_at'>): Promise<Aula> {
    const { data, error } = await supabase
      .from('aulas')
      .insert([aula])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, aula: Partial<Omit<Aula, 'id_aula' | 'created_at' | 'updated_at'>>): Promise<Aula> {
    const { data, error } = await supabase
      .from('aulas')
      .update(aula)
      .eq('id_aula', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('aulas')
      .delete()
      .eq('id_aula', id);

    if (error) throw error;
  }
};

// ============================================
// DOCENTE_MATERIAS (Teacher Subject Capabilities)
// ============================================

export const docenteMateriasService = {
  async getByDocente(idDocente: string): Promise<DocenteMateria[]> {
    const { data, error } = await supabase
      .from('docente_materias')
      .select('*')
      .eq('id_docente', idDocente)
      .order('nivel_prioridad', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(docenteMateria: Omit<DocenteMateria, 'id' | 'created_at'>): Promise<DocenteMateria> {
    const { data, error } = await supabase
      .from('docente_materias')
      .insert([docenteMateria])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('docente_materias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// CLASE_REQUISITOS (Class Requirements)
// ============================================

export const claseRequisitosService = {
  async getByClase(idClase: string): Promise<ClaseRequisito | null> {
    const { data, error } = await supabase
      .from('clase_requisitos')
      .select('*')
      .eq('id_clase', idClase)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  },

  async createOrUpdate(requisito: Omit<ClaseRequisito, 'id' | 'created_at'>): Promise<ClaseRequisito> {
    // Check if exists
    const existing = await this.getByClase(requisito.id_clase);

    if (existing) {
      const { data, error } = await supabase
        .from('clase_requisitos')
        .update(requisito)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('clase_requisitos')
        .insert([requisito])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async delete(idClase: string): Promise<void> {
    const { error } = await supabase
      .from('clase_requisitos')
      .delete()
      .eq('id_clase', idClase);

    if (error) throw error;
  }
};

// ============================================
// CONFIGURACION_HORARIOS (Schedule Configuration)
// ============================================

export const configuracionHorariosService = {
  async getActive(anoEscolar: string): Promise<ConfiguracionHorario | null> {
    const { data, error } = await supabase
      .from('configuracion_horarios')
      .select('*')
      .eq('ano_escolar', anoEscolar)
      .eq('activa', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async create(config: Omit<ConfiguracionHorario, 'id' | 'created_at' | 'updated_at'>): Promise<ConfiguracionHorario> {
    // Deactivate other configs for the same year
    await supabase
      .from('configuracion_horarios')
      .update({ activa: false })
      .eq('ano_escolar', config.ano_escolar)
      .eq('activa', true);

    const { data, error } = await supabase
      .from('configuracion_horarios')
      .insert([config])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, config: Partial<Omit<ConfiguracionHorario, 'id' | 'created_at' | 'updated_at'>>): Promise<ConfiguracionHorario> {
    const { data, error } = await supabase
      .from('configuracion_horarios')
      .update(config)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============================================
// RESTRICCIONES_DURAS (Hard Constraints)
// ============================================

export const restriccionesDurasService = {
  async getByAnoEscolar(anoEscolar: string): Promise<RestriccionDura[]> {
    const { data, error } = await supabase
      .from('restricciones_duras')
      .select('*')
      .eq('ano_escolar', anoEscolar)
      .eq('activa', true)
      .order('tipo', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(restriccion: Omit<RestriccionDura, 'id' | 'created_at' | 'updated_at'>): Promise<RestriccionDura> {
    const { data, error } = await supabase
      .from('restricciones_duras')
      .insert([restriccion])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, restriccion: Partial<Omit<RestriccionDura, 'id' | 'created_at' | 'updated_at'>>): Promise<RestriccionDura> {
    const { data, error } = await supabase
      .from('restricciones_duras')
      .update(restriccion)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('restricciones_duras')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// RESTRICCIONES_SUAVES (Soft Constraints)
// ============================================

export const restriccionesSuavesService = {
  async getByAnoEscolar(anoEscolar: string): Promise<RestriccionSuave[]> {
    const { data, error } = await supabase
      .from('restricciones_suaves')
      .select('*')
      .eq('ano_escolar', anoEscolar)
      .eq('activa', true)
      .order('peso', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(restriccion: Omit<RestriccionSuave, 'id' | 'created_at' | 'updated_at'>): Promise<RestriccionSuave> {
    const { data, error } = await supabase
      .from('restricciones_suaves')
      .insert([restriccion])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, restriccion: Partial<Omit<RestriccionSuave, 'id' | 'created_at' | 'updated_at'>>): Promise<RestriccionSuave> {
    const { data, error } = await supabase
      .from('restricciones_suaves')
      .update(restriccion)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('restricciones_suaves')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// GENERACIONES_HORARIOS (Schedule Generation History)
// ============================================

export const generacionesHorariosService = {
  async getByAnoEscolar(anoEscolar: string): Promise<GeneracionHorario[]> {
    const { data, error } = await supabase
      .from('generaciones_horarios')
      .select('*')
      .eq('ano_escolar', anoEscolar)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(generacion: Omit<GeneracionHorario, 'id' | 'created_at' | 'updated_at'>): Promise<GeneracionHorario> {
    const { data, error } = await supabase
      .from('generaciones_horarios')
      .insert([generacion])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, generacion: Partial<Omit<GeneracionHorario, 'id' | 'created_at' | 'updated_at'>>): Promise<GeneracionHorario> {
    const { data, error } = await supabase
      .from('generaciones_horarios')
      .update(generacion)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<GeneracionHorario | null> {
    const { data, error } = await supabase
      .from('generaciones_horarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
};

// ============================================
// EVENTOS CALENDARIO (Calendar Events)
// ============================================

export const eventosCalendarioService = {
  async getAll(): Promise<EventoCalendario[]> {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .select('*')
      .order('fecha_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<EventoCalendario[]> {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .select('*')
      .gte('fecha_inicio', fechaInicio)
      .lte('fecha_fin', fechaFin)
      .order('fecha_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<EventoCalendario | null> {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .select('*')
      .eq('id_evento', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(evento: Omit<EventoCalendario, 'id_evento' | 'created_at' | 'updated_at'>): Promise<EventoCalendario> {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .insert([evento])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<EventoCalendario>): Promise<EventoCalendario> {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .update(updates)
      .eq('id_evento', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('eventos_calendario')
      .delete()
      .eq('id_evento', id);

    if (error) throw error;
  }
};

// ============================================
// GUARDIAS SERVICE
// ============================================
export const guardiasService = {
  async getAll(): Promise<Guardia[]> {
    const { data, error } = await supabase
      .from('maestra_guardias')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByUsuario(idUsuario: string): Promise<Guardia[]> {
    const { data, error } = await supabase
      .from('maestra_guardias')
      .select('*')
      .eq('id_usuario', idUsuario)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByDate(fecha: string): Promise<Guardia[]> {
    const { data, error } = await supabase
      .from('maestra_guardias')
      .select('*')
      .eq('fecha', fecha)
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(guardia: Omit<Guardia, 'id_guardia' | 'created_at' | 'updated_at'>): Promise<Guardia> {
    const { data, error } = await supabase
      .from('maestra_guardias')
      .insert([guardia])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Guardia>): Promise<Guardia> {
    const { data, error } = await supabase
      .from('maestra_guardias')
      .update(updates)
      .eq('id_guardia', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('maestra_guardias')
      .delete()
      .eq('id_guardia', id);

    if (error) throw error;
  }
};

// ============================================
// LOG REUNIONES COORDINACION SERVICE
// ============================================
export const logReunionesService = {
  async getAll(): Promise<LogReunionCoordinacion[]> {
    const { data, error } = await supabase
      .from('log_reuniones_coordinacion')
      .select('*')
      .order('fecha_reunion', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByGrado(grado: string): Promise<LogReunionCoordinacion[]> {
    const { data, error } = await supabase
      .from('log_reuniones_coordinacion')
      .select('*')
      .eq('grado', grado)
      .order('fecha_reunion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByTipoAlerta(tipoAlerta: string): Promise<LogReunionCoordinacion[]> {
    const { data, error } = await supabase
      .from('log_reuniones_coordinacion')
      .select('*')
      .eq('tipo_alerta', tipoAlerta)
      .order('fecha_reunion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAlertasRecientes(limit: number = 10): Promise<LogReunionCoordinacion[]> {
    const { data, error } = await supabase
      .from('log_reuniones_coordinacion')
      .select('*')
      .eq('estado', 'Pendiente')
      .order('fecha_reunion', { ascending: false })
      .order('frecuencia', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async create(log: Omit<LogReunionCoordinacion, 'id_log' | 'created_at' | 'updated_at'>): Promise<LogReunionCoordinacion> {
    const { data, error } = await supabase
      .from('log_reuniones_coordinacion')
      .insert([log])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<LogReunionCoordinacion>): Promise<LogReunionCoordinacion> {
    const { data, error } = await supabase
      .from('log_reuniones_coordinacion')
      .update(updates)
      .eq('id_log', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('log_reuniones_coordinacion')
      .delete()
      .eq('id_log', id);

    if (error) throw error;
  }
};

// ============================================
// TAREAS COORDINADOR SERVICE
// ============================================
export const tareasCoordinadorService = {
  async getAll(): Promise<TareaCoordinador[]> {
    const { data, error } = await supabase
      .from('tareas_coordinador')
      .select('*')
      .order('completada', { ascending: true })
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByUsuario(idUsuario: string): Promise<TareaCoordinador[]> {
    const { data, error } = await supabase
      .from('tareas_coordinador')
      .select('*')
      .eq('id_usuario', idUsuario)
      .order('completada', { ascending: true })
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPendientes(idUsuario: string): Promise<TareaCoordinador[]> {
    const { data, error } = await supabase
      .from('tareas_coordinador')
      .select('*')
      .eq('id_usuario', idUsuario)
      .eq('completada', false)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(tarea: Omit<TareaCoordinador, 'id_tarea' | 'created_at' | 'updated_at'>): Promise<TareaCoordinador> {
    const { data, error } = await supabase
      .from('tareas_coordinador')
      .insert([tarea])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<TareaCoordinador>): Promise<TareaCoordinador> {
    const { data, error } = await supabase
      .from('tareas_coordinador')
      .update(updates)
      .eq('id_tarea', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tareas_coordinador')
      .delete()
      .eq('id_tarea', id);

    if (error) throw error;
  }
};

// ============================================
// MAESTRA INDICADORES (Master Indicators)
// ============================================

export const maestraIndicadoresService = {
  async getAll(): Promise<MaestraIndicador[]> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByClase(idClase: string): Promise<MaestraIndicador[]> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .select('*')
      .eq('id_clase', idClase)
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<MaestraIndicador | null> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .select('*')
      .eq('id_indicador', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(indicador: Omit<MaestraIndicador, 'id_indicador' | 'created_at' | 'updated_at'>): Promise<MaestraIndicador> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .insert([indicador])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createBulk(indicadores: Omit<MaestraIndicador, 'id_indicador' | 'created_at' | 'updated_at'>[]): Promise<MaestraIndicador[]> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .insert(indicadores)
      .select();

    if (error) throw error;
    return data || [];
  },

  async getByCodigoUnico(codigo: string): Promise<MaestraIndicador | null> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .select('*')
      .eq('codigo_unico', codigo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  async searchByCodigo(codigoPartial: string): Promise<MaestraIndicador[]> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .select('*')
      .ilike('codigo_unico', `%${codigoPartial}%`)
      .eq('activo', true)
      .order('codigo_unico', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Partial<MaestraIndicador>): Promise<MaestraIndicador> {
    const { data, error } = await supabase
      .from('maestra_indicadores')
      .update(updates)
      .eq('id_indicador', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('maestra_indicadores')
      .delete()
      .eq('id_indicador', id);

    if (error) throw error;
  }
};

// ============================================
// DETALLE EVALUACION ALUMNO (Student Evaluation Detail)
// ============================================

export const detalleEvaluacionService = {
  async getByMinuta(idMinuta: string): Promise<DetalleEvaluacionAlumno[]> {
    const { data, error } = await supabase
      .from('detalle_evaluacion_alumno')
      .select('*')
      .eq('id_minuta', idMinuta);

    if (error) throw error;
    return data || [];
  },

  async getByAlumno(idAlumno: string): Promise<DetalleEvaluacionAlumno[]> {
    const { data, error } = await supabase
      .from('detalle_evaluacion_alumno')
      .select(`
        *,
        maestra_indicadores (
          descripcion,
          categoria
        )
      `)
      .eq('id_alumno', idAlumno)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByMinutaAndAlumno(idMinuta: string, idAlumno: string): Promise<DetalleEvaluacionAlumno[]> {
    const { data, error } = await supabase
      .from('detalle_evaluacion_alumno')
      .select('*')
      .eq('id_minuta', idMinuta)
      .eq('id_alumno', idAlumno);

    if (error) throw error;
    return data || [];
  },

  async create(detalle: Omit<DetalleEvaluacionAlumno, 'id_detalle' | 'created_at' | 'updated_at'>): Promise<DetalleEvaluacionAlumno> {
    const { data, error } = await supabase
      .from('detalle_evaluacion_alumno')
      .insert([detalle])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createBulk(detalles: Omit<DetalleEvaluacionAlumno, 'id_detalle' | 'created_at' | 'updated_at'>[]): Promise<DetalleEvaluacionAlumno[]> {
    if (detalles.length === 0) return [];

    const { data, error } = await supabase
      .from('detalle_evaluacion_alumno')
      .insert(detalles)
      .select();

    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Partial<DetalleEvaluacionAlumno>): Promise<DetalleEvaluacionAlumno> {
    const { data, error } = await supabase
      .from('detalle_evaluacion_alumno')
      .update(updates)
      .eq('id_detalle', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('detalle_evaluacion_alumno')
      .delete()
      .eq('id_detalle', id);

    if (error) throw error;
  },

  async deleteByMinuta(idMinuta: string): Promise<void> {
    const { error } = await supabase
      .from('detalle_evaluacion_alumno')
      .delete()
      .eq('id_minuta', idMinuta);

    if (error) throw error;
  }
};


// ============================================
// RESUMEN EVALUACION ALUMNO (Pedagogical Intelligence)
// ============================================

export const resumenEvaluacionService = {
  async getByMinuta(idMinuta: string): Promise<ResumenEvaluacionAlumno[]> {
    const { data, error } = await supabase
      .from('resumen_evaluacion_alumno')
      .select('*')
      .eq('id_minuta', idMinuta);

    if (error) throw error;
    return data || [];
  },

  async createBulk(resumenes: Omit<ResumenEvaluacionAlumno, 'id_resumen' | 'created_at' | 'updated_at'>[]): Promise<ResumenEvaluacionAlumno[]> {
    const { data, error } = await supabase
      .from('resumen_evaluacion_alumno')
      .insert(resumenes)
      .select();

    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Partial<ResumenEvaluacionAlumno>): Promise<ResumenEvaluacionAlumno> {
    const { data, error } = await supabase
      .from('resumen_evaluacion_alumno')
      .update(updates)
      .eq('id_resumen', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('resumen_evaluacion_alumno')
      .delete()
      .eq('id_resumen', id);

    if (error) throw error;
  }
};
