// Week Calculator Service
// Helper functions to calculate weeks from dates and manage lapso-week relationships

import type { SupabaseClient } from '@supabase/supabase-js';
import { Lapso, SemanaLapso } from './supabaseDataService';
import { supabase } from './supabaseClient';

// Helper to get the appropriate Supabase client (Vite compatibility only)
// In Next.js, the client should always be passed as a parameter
let cachedSupabaseClient: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  // In Next.js, we should always pass the client
  // This is a fallback for Vite compatibility only
  if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
    throw new Error('Supabase client must be provided in Next.js environment. Pass it as a parameter.');
  }
  
  // Vite environment - use the imported client
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }
  
  // Cache and return the imported supabase client
  cachedSupabaseClient = supabase;
  return supabase;
};

export interface SemanaInfo {
  numero_semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  lapso: string;
  ano_escolar: string;
  id_lapso?: string;
}

/**
 * Obtiene la semana actual basada en una fecha
 * @param date Fecha a evaluar
 * @param anoEscolar Año escolar (ej: '2025-2026')
 * @param supabaseClient Cliente de Supabase opcional (si no se provee, se detecta automáticamente)
 * @returns Información de la semana o null si no se encuentra
 */
export const getWeekFromDate = async (
  date: Date,
  anoEscolar: string,
  supabaseClient?: SupabaseClient
): Promise<SemanaInfo | null> => {
  const dateStr = date.toISOString().split('T')[0];
  const client = supabaseClient || getSupabaseClient();
  
  const { data, error } = await client
    .from('semanas_lapso')
    .select(`
      numero_semana,
      fecha_inicio,
      fecha_fin,
      id_lapso,
      lapsos!inner(ano_escolar, lapso, activo)
    `)
    .eq('lapsos.ano_escolar', anoEscolar)
    .eq('lapsos.activo', true)
    .lte('fecha_inicio', dateStr)
    .gte('fecha_fin', dateStr)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw error;
  }
  
  if (!data) return null;
  
  return {
    numero_semana: data.numero_semana,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    lapso: data.lapsos.lapso,
    ano_escolar: data.lapsos.ano_escolar,
    id_lapso: data.id_lapso
  };
};

/**
 * Obtiene todas las semanas de un lapso específico
 * @param lapsoId ID del lapso
 * @param supabaseClient Cliente de Supabase opcional
 * @returns Array de información de semanas
 */
export const getWeeksForLapso = async (
  lapsoId: string,
  supabaseClient?: SupabaseClient
): Promise<SemanaInfo[]> => {
  const client = supabaseClient || getSupabaseClient();
  const { data, error } = await client
    .from('semanas_lapso')
    .select(`
      numero_semana,
      fecha_inicio,
      fecha_fin,
      id_lapso,
      lapsos!inner(ano_escolar, lapso)
    `)
    .eq('id_lapso', lapsoId)
    .order('numero_semana', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map((item: any) => ({
    numero_semana: item.numero_semana,
    fecha_inicio: item.fecha_inicio,
    fecha_fin: item.fecha_fin,
    lapso: item.lapsos.lapso,
    ano_escolar: item.lapsos.ano_escolar,
    id_lapso: item.id_lapso
  }));
};

/**
 * Obtiene todas las semanas de un año escolar
 * @param anoEscolar Año escolar (ej: '2025-2026')
 * @param supabaseClient Cliente de Supabase opcional
 * @returns Array de información de semanas agrupadas por lapso
 */
export const getAllWeeksForAnoEscolar = async (
  anoEscolar: string,
  supabaseClient?: SupabaseClient
): Promise<Map<string, SemanaInfo[]>> => {
  const client = supabaseClient || getSupabaseClient();
  const { data, error } = await client
    .from('semanas_lapso')
    .select(`
      numero_semana,
      fecha_inicio,
      fecha_fin,
      id_lapso,
      lapsos!inner(ano_escolar, lapso, activo)
    `)
    .eq('lapsos.ano_escolar', anoEscolar)
    .eq('lapsos.activo', true)
    .order('fecha_inicio', { ascending: true });
  
  if (error) throw error;
  
  const semanasMap = new Map<string, SemanaInfo[]>();
  
  (data || []).forEach((item: any) => {
    const semanaInfo: SemanaInfo = {
      numero_semana: item.numero_semana,
      fecha_inicio: item.fecha_inicio,
      fecha_fin: item.fecha_fin,
      lapso: item.lapsos.lapso,
      ano_escolar: item.lapsos.ano_escolar,
      id_lapso: item.id_lapso
    };
    
    const lapso = item.lapsos.lapso;
    if (!semanasMap.has(lapso)) {
      semanasMap.set(lapso, []);
    }
    semanasMap.get(lapso)!.push(semanaInfo);
  });
  
  return semanasMap;
};

/**
 * Formatea una fecha para mostrar en español
 * @param dateStr Fecha en formato ISO (YYYY-MM-DD)
 * @returns Fecha formateada (ej: "9 de Septiembre, 2025")
 */
export const formatDateSpanish = (dateStr: string): string => {
  const date = new Date(dateStr);
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
};

/**
 * Formatea un rango de fechas
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @returns Rango formateado (ej: "9-15 Sep, 2025")
 */
export const formatDateRange = (fechaInicio: string, fechaFin: string): string => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  if (inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear()) {
    return `${inicio.getDate()}-${fin.getDate()} ${months[inicio.getMonth()]}, ${inicio.getFullYear()}`;
  } else {
    return `${inicio.getDate()} ${months[inicio.getMonth()]} - ${fin.getDate()} ${months[fin.getMonth()]}, ${inicio.getFullYear()}`;
  }
};

