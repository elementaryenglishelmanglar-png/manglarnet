// Analytics Data Service
// Supabase data access layer for The Red Bull Suite analytics features

import { supabase } from './supabaseClient';
import type {
    RiskScoreResult,
    TelemetryKPIs,
    HistoricalAverage,
    IntelligentNotification,
    FilterOptions,
    NotificationFilters,
    StudentWithRisk,
} from '../types/analytics';

export const analyticsService = {
    /**
     * Get telemetry KPIs from the real-time view
     */
    async getTelemetryKPIs(filters?: FilterOptions): Promise<TelemetryKPIs[]> {
        let query = supabase.from('vista_telemetria_academica').select('*');

        if (filters?.grado) {
            query = query.eq('grado', filters.grado);
        }
        if (filters?.materia) {
            query = query.eq('materia', filters.materia);
        }
        if (filters?.lapso) {
            query = query.eq('lapso', filters.lapso);
        }
        if (filters?.anoEscolar) {
            query = query.eq('ano_escolar', filters.anoEscolar);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    /**
     * Get risk scores for students
     */
    async getRiskScores(
        studentIds: string[],
        anoEscolar?: string,
        lapso?: string
    ): Promise<RiskScoreResult[]> {
        const results: RiskScoreResult[] = [];

        for (const studentId of studentIds) {
            const { data, error } = await supabase.rpc('calculate_risk_score', {
                p_id_alumno: studentId,
                p_ano_escolar: anoEscolar || null,
                p_lapso: lapso || null,
            });

            if (!error && data && data.length > 0) {
                results.push(data[0]);
            }
        }

        return results;
    },

    /**
     * Get students with their risk data
     */
    async getStudentsWithRisk(
        filters?: FilterOptions
    ): Promise<StudentWithRisk[]> {
        // Get students
        let query = supabase.from('alumnos').select('*');

        if (filters?.grado) {
            query = query.eq('salon', filters.grado);
        }

        const { data: students, error: studentsError } = await query;

        if (studentsError) throw studentsError;
        if (!students || students.length === 0) return [];

        // Get risk scores for all students
        const studentIds = students.map((s) => s.id_alumno);
        const riskScores = await this.getRiskScores(
            studentIds,
            filters?.anoEscolar,
            filters?.lapso
        );

        // Merge data
        const studentsWithRisk: StudentWithRisk[] = students.map((student) => {
            const risk = riskScores.find((r) => r.id_alumno === student.id_alumno);

            return {
                id_alumno: student.id_alumno,
                nombres: student.nombres,
                apellidos: student.apellidos,
                salon: student.salon,
                grupo: student.grupo,
                email_alumno: student.email_alumno,
                riskScore: risk?.risk_score || 0,
                riskLevel: risk?.risk_level || 'Sin Datos',
                factores: risk?.factores_riesgo || {
                    promedio_notas: 0,
                    asistencia_promedio: 0,
                    total_evaluaciones: 0,
                },
            };
        });

        // Filter by risk level if specified
        if (filters?.riskLevel) {
            return studentsWithRisk.filter(
                (s) => s.riskLevel === filters.riskLevel
            );
        }

        return studentsWithRisk;
    },

    /**
     * Get historical benchmark data
     */
    async getHistoricalBenchmark(
        grado: string,
        materia: string,
        lapso: string,
        anoEscolar: string
    ): Promise<HistoricalAverage[]> {
        const { data, error } = await supabase
            .from('historico_promedios')
            .select('*')
            .eq('grado', grado)
            .eq('materia', materia)
            .eq('lapso', lapso)
            .order('mes');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get intelligent notifications
     */
    async getIntelligentNotifications(
        filters?: NotificationFilters
    ): Promise<IntelligentNotification[]> {
        let query = supabase
            .from('notificaciones_inteligentes')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.tipo) {
            query = query.eq('tipo_alerta', filters.tipo);
        }
        if (filters?.severidad) {
            query = query.eq('severidad', filters.severidad);
        }
        if (filters?.estado) {
            query = query.eq('estado', filters.estado);
        }
        if (filters?.grado) {
            query = query.eq('grado', filters.grado);
        }
        if (filters?.materia) {
            query = query.eq('materia', filters.materia);
        }
        if (filters?.fechaDesde) {
            query = query.gte('created_at', filters.fechaDesde);
        }
        if (filters?.fechaHasta) {
            query = query.lte('created_at', filters.fechaHasta);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    /**
     * Update notification status
     */
    async updateNotificationStatus(
        id: string,
        status: 'pendiente' | 'revisada' | 'resuelta' | 'descartada',
        userId?: string,
        notas?: string
    ): Promise<void> {
        const updates: any = {
            estado: status,
            updated_at: new Date().toISOString(),
        };

        if (status !== 'pendiente') {
            updates.revisada_por = userId;
            updates.fecha_revision = new Date().toISOString();
        }

        if (notas) {
            updates.notas_revision = notas;
        }

        const { error } = await supabase
            .from('notificaciones_inteligentes')
            .update(updates)
            .eq('id_notificacion', id);

        if (error) throw error;
    },

    /**
     * Get sentiment cache for a specific evaluation
     */
    async getSentimentCache(idMinuta: string) {
        const { data, error } = await supabase
            .from('cache_analisis_sentimiento')
            .select('*')
            .eq('id_minuta', idMinuta)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned
            throw error;
        }

        return data;
    },

    /**
     * Populate historical averages (one-time operation)
     */
    async populateHistoricalAverages(): Promise<{
        records_created: number;
        message: string;
    }> {
        const { data, error } = await supabase.rpc('populate_historical_averages');

        if (error) throw error;
        return data[0];
    },
};
