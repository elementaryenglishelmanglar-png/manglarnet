// Supabase Data Service
// This service handles all database operations for the ManglarNet application

import { supabase } from './supabaseClient';

// Types (imported from shared types)
import type {
  Alumno,
  Docente,
  Clase,
  Planificacion,
  Lapso,
  Aula,

  Notification,
  ReunionRepresentante,
  SeguimientoAcuerdo,
  FrecuenciaReuniones,
  AnalisisSentimiento,
  TemaInquietud
} from '@/types';

export type { Alumno, Docente, Clase, Planificacion, Lapso, Aula, Notification };

export interface SemanaLapso {
  id_semana_lapso: string;
  id_lapso: string;
  numero_semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  created_at?: string;
  updated_at?: string;
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
    return (data || []).map((clase: any) => ({
      ...clase,
      studentIds: clase.student_ids || []
    }));
  },

  async getById(id: string): Promise<Clase | null> {
    const { data, error } = await supabase
      .from('clases')
      .select('*')
      .eq('id_clase', id)
      .single();

    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      studentIds: data.student_ids || []
    };
  },

  async create(clase: Omit<Clase, 'id_clase' | 'created_at' | 'updated_at'>): Promise<Clase> {
    const { studentIds, ...rest } = clase;
    const dbClase = {
      ...rest,
      student_ids: studentIds
    };

    const { data, error } = await supabase
      .from('clases')
      .insert([dbClase])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      studentIds: data.student_ids || []
    };
  },

  async update(id: string, updates: Partial<Clase>): Promise<Clase> {
    const { studentIds, ...rest } = updates;
    const dbUpdates: any = { ...rest };
    if (studentIds) {
      dbUpdates.student_ids = studentIds;
    }

    const { data, error } = await supabase
      .from('clases')
      .update(dbUpdates)
      .eq('id_clase', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      studentIds: data.student_ids || []
    };
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
    return (data || []).map((n: any) => ({
      ...n,
      isRead: n.is_read,
      recipientId: n.recipient_id,
      linkTo: typeof n.link_to === 'string' ? JSON.parse(n.link_to || '{}') : n.link_to
    }));
  },

  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return (data || []).map((n: any) => ({
      ...n,
      isRead: n.is_read,
      recipientId: n.recipient_id,
      linkTo: typeof n.link_to === 'string' ? JSON.parse(n.link_to || '{}') : n.link_to
    }));
  },

  async create(notificacion: Omit<Notification, 'id' | 'timestamp' | 'created_at'>): Promise<Notification> {
    const { isRead, recipientId, linkTo, ...rest } = notificacion;
    const dbData = {
      ...rest,
      is_read: isRead,
      recipient_id: recipientId,
      link_to: typeof linkTo === 'string' ? linkTo : JSON.stringify(linkTo || {})
    };

    const { data, error } = await supabase
      .from('notificaciones')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      isRead: data.is_read,
      recipientId: data.recipient_id,
      linkTo: typeof data.link_to === 'string' ? JSON.parse(data.link_to) : data.link_to
    };
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notificaciones')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
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
// REUNIONES REPRESENTANTES (Parent Meetings)
// ============================================



export const reunionesService = {
  async getAll(): Promise<ReunionRepresentante[]> {
    const { data, error } = await supabase
      .from('reuniones_representantes')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ReunionRepresentante | null> {
    const { data, error } = await supabase
      .from('reuniones_representantes')
      .select('*')
      .eq('id_reunion', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByAlumno(idAlumno: string): Promise<ReunionRepresentante[]> {
    const { data, error } = await supabase
      .from('reuniones_representantes')
      .select('*')
      .eq('id_alumno', idAlumno)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByGrado(grado: string): Promise<ReunionRepresentante[]> {
    const { data, error } = await supabase
      .from('reuniones_representantes')
      .select('*')
      .eq('grado', grado)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<ReunionRepresentante[]> {
    const { data, error } = await supabase
      .from('reuniones_representantes')
      .select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(reunion: Omit<ReunionRepresentante, 'id_reunion' | 'created_at' | 'updated_at'>): Promise<ReunionRepresentante> {
    const { data, error } = await supabase
      .from('reuniones_representantes')
      .insert([reunion])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ReunionRepresentante>): Promise<ReunionRepresentante> {
    const { data, error } = await supabase
      .from('reuniones_representantes')
      .update(updates)
      .eq('id_reunion', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('reuniones_representantes')
      .delete()
      .eq('id_reunion', id);

    if (error) throw error;
  },

  // Analytics Functions
  async getFrecuenciaReuniones(
    idAlumno: string,
    diasPeriodo: number = 90
  ): Promise<FrecuenciaReuniones> {
    const { data, error } = await supabase.rpc('calcular_frecuencia_reuniones', {
      p_id_alumno: idAlumno,
      p_dias_periodo: diasPeriodo,
    });

    if (error) throw error;
    return data[0] || {
      total_reuniones: 0,
      frecuencia_mensual: 0,
      dias_ultima_reunion: 999,
      tendencia: 'Sin reuniones',
    };
  },

  async getAnalisisSentimiento(idReunion: string): Promise<AnalisisSentimiento> {
    const { data, error } = await supabase.rpc('analizar_sentimiento_inquietudes', {
      p_id_reunion: idReunion,
    });

    if (error) throw error;
    return data[0] || {
      sentimiento: 'Sin datos',
      palabras_clave: [],
      urgencia: 'Baja',
    };
  },

  async getTemasInquietudes(idAlumno: string, limit: number = 10): Promise<TemaInquietud[]> {
    const { data, error } = await supabase.rpc('extraer_temas_inquietudes', {
      p_id_alumno: idAlumno,
      p_limit: limit,
    });

    if (error) throw error;
    return data || [];
  },

  async getMetricasAlumno(idAlumno: string): Promise<any> {
    const { data, error } = await supabase
      .from('vista_metricas_reuniones_alumno')
      .select('*')
      .eq('id_alumno', idAlumno)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
};

// ============================================
// SEGUIMIENTO ACUERDOS (Agreement Follow-up)
// ============================================

export const seguimientoAcuerdosService = {
  async getByReunion(idReunion: string): Promise<SeguimientoAcuerdo[]> {
    const { data, error } = await supabase
      .from('seguimiento_acuerdos')
      .select('*')
      .eq('id_reunion', idReunion)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByAlumno(idAlumno: string): Promise<SeguimientoAcuerdo[]> {
    const { data, error } = await supabase
      .from('seguimiento_acuerdos')
      .select('*')
      .eq('id_alumno', idAlumno)
      .order('fecha_limite', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPendientes(idAlumno?: string): Promise<SeguimientoAcuerdo[]> {
    let query = supabase
      .from('seguimiento_acuerdos')
      .select('*')
      .in('estado_cumplimiento', ['Pendiente', 'En Proceso'])
      .order('fecha_limite', { ascending: true });

    if (idAlumno) {
      query = query.eq('id_alumno', idAlumno);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(seguimiento: Omit<SeguimientoAcuerdo, 'id_seguimiento' | 'created_at' | 'updated_at'>): Promise<SeguimientoAcuerdo> {
    const { data, error } = await supabase
      .from('seguimiento_acuerdos')
      .insert([seguimiento])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<SeguimientoAcuerdo>): Promise<SeguimientoAcuerdo> {
    const { data, error } = await supabase
      .from('seguimiento_acuerdos')
      .update(updates)
      .eq('id_seguimiento', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('seguimiento_acuerdos')
      .delete()
      .eq('id_seguimiento', id);

    if (error) throw error;
  },
};
