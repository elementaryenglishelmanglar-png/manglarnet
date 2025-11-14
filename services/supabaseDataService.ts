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
  student_ids: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Planificacion {
  id_planificacion: string;
  id_docente: string;
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
}

export interface Horario {
  id_horario: string;
  id_docente: string | null;
  id_clase: string | null;
  grado: string;
  semana: number;
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
  async getByGradeAndWeek(grado: string, semana: number): Promise<Horario[]> {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('grado', grado)
      .eq('semana', semana)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getAll(): Promise<Horario[]> {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
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

  async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notificaciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notificaciones')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

