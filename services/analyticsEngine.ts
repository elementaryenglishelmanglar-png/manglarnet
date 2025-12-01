// Analytics Engine
// Core calculation and simulation logic for The Red Bull Suite

import { supabase } from './supabaseClient';
import { analyzeSentimentBatch } from './geminiService';
import type {
    RiskScoreResult,
    ScenarioModifiers,
    CurrentMetrics,
    SimulationResult,
    SentimentInput,
    SentimentAnalysis,
    HistoricalBenchmark,
    AnomalyDetectionResult,
    AnomalyAlert,
    TelemetryKPIs,
    HistoricalAverage,
    EmotionalState, // Added EmotionalState import
} from '../types/analytics';

// ============================================
// Risk Score Calculation
// ============================================

/**
 * Calculates the risk score for a student using the SQL function
 * @param studentId - UUID of the student
 * @param anoEscolar - Optional school year filter
 * @param lapso - Optional period filter
 * @returns Risk score result with level and factors
 */
export async function calculateRiskScore(
    studentId: string,
    anoEscolar?: string,
    lapso?: string
): Promise<RiskScoreResult | null> {
    try {
        const { data, error } = await supabase.rpc('calculate_risk_score', {
            p_id_alumno: studentId,
            p_ano_escolar: anoEscolar || null,
            p_lapso: lapso || null,
        });

        if (error) {
            console.error('Error calculating risk score:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        return data[0] as RiskScoreResult;
    } catch (error) {
        console.error('Exception in calculateRiskScore:', error);
        return null;
    }
}

/**
 * Calculates risk scores for multiple students in batch
 * @param studentIds - Array of student UUIDs
 * @param anoEscolar - Optional school year filter
 * @param lapso - Optional period filter
 * @returns Array of risk score results
 */
export async function calculateRiskScoresBatch(
    studentIds: string[],
    anoEscolar?: string,
    lapso?: string
): Promise<RiskScoreResult[]> {
    try {
        const promises = studentIds.map((id) =>
            calculateRiskScore(id, anoEscolar, lapso)
        );
        const results = await Promise.all(promises);
        return results.filter((r): r is RiskScoreResult => r !== null);
    } catch (error) {
        console.error('Error in batch risk calculation:', error);
        return [];
    }
}

// ============================================
// Strategy Simulator (What-If Analysis)
// ============================================

/**
 * Simulates a scenario with modified parameters
 * @param currentData - Current metrics baseline
 * @param modifiers - Scenario modifications
 * @returns Projected results with breakdown
 */
export function simulateScenario(
    currentData: CurrentMetrics,
    modifiers: ScenarioModifiers
): SimulationResult {
    const { promedio, aprobados, totalEstudiantes } = currentData;
    const { asistenciaModifier, notasModifier, apoyoPedagogico } = modifiers;

    // Calculate support multiplier
    const apoyoMultiplier = {
        ninguno: 1.0,
        bajo: 1.15,
        medio: 1.3,
        alto: 1.5,
    }[apoyoPedagogico];

    // Effect of attendance on grades (empirical correlation: ~0.3)
    const asistenciaEffect =
        (asistenciaModifier / 100) * promedio * 0.3 * apoyoMultiplier;

    // Direct effect of grade modifier
    const notasEffect = notasModifier * apoyoMultiplier;

    // Total projected average
    const promedioProyectado = Math.max(
        0,
        Math.min(20, promedio + asistenciaEffect + notasEffect)
    );

    // Calculate projected pass rate
    // Assumption: Students near passing threshold (9-11) are most affected
    const currentPassRate = aprobados / 100;
    const avgImprovement = promedioProyectado - promedio;

    // Estimate how many students would cross the 10-point threshold
    // Using a logistic-like function for realistic projection
    const passRateIncrease = avgImprovement > 0
        ? Math.min(0.25, avgImprovement * 0.08) // Max 25% increase
        : Math.max(-0.25, avgImprovement * 0.08); // Max 25% decrease

    const aprobadosProyectados = Math.max(
        0,
        Math.min(100, (currentPassRate + passRateIncrease) * 100)
    );

    // Calculate students who would improve
    const estudiantesMejorados = Math.round(
        totalEstudiantes * Math.abs(passRateIncrease)
    );

    // Calculate absolute and relative changes
    const cambioAbsoluto = promedioProyectado - promedio;
    const cambioRelativo = promedio > 0 ? (cambioAbsoluto / promedio) * 100 : 0;

    return {
        promedioProyectado: Math.round(promedioProyectado * 100) / 100,
        aprobadosProyectados: Math.round(aprobadosProyectados * 100) / 100,
        cambioAbsoluto: Math.round(cambioAbsoluto * 100) / 100,
        cambioRelativo: Math.round(cambioRelativo * 100) / 100,
        estudiantesMejorados,
        detalles: {
            efectoAsistencia: Math.round(asistenciaEffect * 100) / 100,
            efectoNotas: Math.round(notasEffect * 100) / 100,
            efectoApoyo: Math.round((apoyoMultiplier - 1) * 100),
        },
    };
}

// ============================================
// Sentiment Analysis
// ============================================

/**
 * Analyzes sentiment from student observations using AI
 * @param observaciones - Array of student observations
 * @param idMinuta - Evaluation minute ID for caching
 * @returns Sentiment analysis with emotional climate
 */
export async function analyzeSentiment(
    observaciones: SentimentInput[],
    idMinuta: string
): Promise<SentimentAnalysis | null> {
    try {
        // Check cache first
        const { data: cached } = await supabase
            .from('cache_analisis_sentimiento')
            .select('*')
            .eq('id_minuta', idMinuta)
            .single();

        if (cached) {
            console.log('Using cached sentiment analysis');
            return {
                climaEmocional: cached.clima_emocional,
                sentimientoPredominante: cached.sentimiento_predominante,
                scorePositivo: cached.score_positivo,
                palabrasClave: cached.palabras_clave,
                totalObservaciones: cached.total_observaciones,
            };
        }

        // Call AI service
        const aiResult = await analyzeSentimentBatch(observaciones);

        if (!aiResult) {
            return null;
        }

        // Cache the result
        const { data: minuta } = await supabase
            .from('minutas_evaluacion')
            .select('grado, materia')
            .eq('id_minuta', idMinuta)
            .single();

        if (minuta) {
            await supabase.from('cache_analisis_sentimiento').insert({
                id_minuta: idMinuta,
                grado: minuta.grado,
                materia: minuta.materia,
                clima_emocional: aiResult.climaEmocional,
                sentimiento_predominante: aiResult.sentimientoPredominante,
                score_positivo: aiResult.scorePositivo,
                palabras_clave: aiResult.palabrasClave,
                total_observaciones: observaciones.length,
                modelo_usado: 'gemini-1.5-flash',
            });
        }

        return {
            ...aiResult,
            sentimientoPredominante: aiResult.sentimientoPredominante as EmotionalState,
            totalObservaciones: observaciones.length,
        };
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        return null;
    }
}

// ============================================
// Historical Benchmark (Ghost Car)
// ============================================

/**
 * Gets historical benchmark data for comparison
 * @param grado - Grade level
 * @param materia - Subject
 * @param lapso - Period
 * @param anoEscolar - Current school year
 * @returns Historical and current data for charting
 */
export async function getHistoricalBenchmark(
    grado: string,
    materia: string,
    lapso: string,
    anoEscolar: string
): Promise<HistoricalBenchmark | null> {
    try {
        // Get historical data (previous years)
        const { data: historical, error: histError } = await supabase
            .from('historico_promedios')
            .select('mes, promedio_general, promedio_asistencia')
            .eq('grado', grado)
            .eq('materia', materia)
            .eq('lapso', lapso)
            .neq('ano_escolar', anoEscolar) // Exclude current year
            .order('mes');

        if (histError) {
            console.error('Error fetching historical data:', histError);
            return null;
        }

        // Get current year data
        const { data: current, error: currError } = await supabase
            .from('historico_promedios')
            .select('mes, promedio_general, promedio_asistencia')
            .eq('grado', grado)
            .eq('materia', materia)
            .eq('lapso', lapso)
            .eq('ano_escolar', anoEscolar)
            .order('mes');

        if (currError) {
            console.error('Error fetching current data:', currError);
            return null;
        }

        // Aggregate historical data by month (average across years)
        const historicalByMonth = new Map<number, { total: number; count: number }>();

        historical?.forEach((record: any) => {
            const existing = historicalByMonth.get(record.mes) || { total: 0, count: 0 };
            historicalByMonth.set(record.mes, {
                total: existing.total + record.promedio_general,
                count: existing.count + 1,
            });
        });

        const historicalData = Array.from(historicalByMonth.entries())
            .map(([mes, { total, count }]) => ({
                mes,
                promedio: Math.round((total / count) * 100) / 100,
                label: getMonthLabel(mes, lapso),
            }))
            .sort((a, b) => a.mes - b.mes);

        const currentData = (current || []).map((record: any) => ({
            mes: record.mes,
            promedio: record.promedio_general,
            asistencia: record.promedio_asistencia,
            label: getMonthLabel(record.mes, lapso),
        }));

        // Calculate trend
        const avgCurrent =
            currentData.reduce((sum, d) => sum + d.promedio, 0) / (currentData.length || 1);
        const avgHistorical =
            historicalData.reduce((sum, d) => sum + d.promedio, 0) / (historicalData.length || 1);
        const difference = avgCurrent - avgHistorical;

        let trend: 'mejorando' | 'declinando' | 'estable';
        if (difference > 0.5) trend = 'mejorando';
        else if (difference < -0.5) trend = 'declinando';
        else trend = 'estable';

        return {
            current: currentData,
            historical: historicalData,
            trend,
            difference: Math.round(difference * 100) / 100,
            metadata: { grado, materia, lapso, anoEscolar },
        };
    } catch (error) {
        console.error('Error in getHistoricalBenchmark:', error);
        return null;
    }
}

/**
 * Helper function to get month label based on period
 */
function getMonthLabel(mes: number, lapso: string): string {
    const labels: Record<string, Record<number, string>> = {
        'I Lapso': { 9: 'Sep', 10: 'Oct', 11: 'Nov' },
        'II Lapso': { 1: 'Ene', 2: 'Feb', 3: 'Mar' },
        'III Lapso': { 4: 'Abr', 5: 'May', 6: 'Jun' },
    };

    return labels[lapso]?.[mes] || `M${mes}`;
}

// ============================================
// Anomaly Detection
// ============================================

/**
 * Detects anomalies by comparing current vs historical metrics
 * @param currentMetrics - Current performance metrics
 * @param historicalMetrics - Historical baseline metrics
 * @returns Detected anomalies with severity
 */
export function detectAnomalies(
    currentMetrics: TelemetryKPIs,
    historicalMetrics: HistoricalAverage[]
): AnomalyDetectionResult {
    const alerts: AnomalyAlert[] = [];

    if (historicalMetrics.length === 0) {
        return { anomaliesDetected: false, alerts: [] };
    }

    // Calculate historical average
    const historicalAvg =
        historicalMetrics.reduce((sum, h) => sum + h.promedio_general, 0) /
        historicalMetrics.length;

    // Check for grade drop
    const gradeDrop = ((currentMetrics.promedio_general - historicalAvg) / historicalAvg) * 100;

    if (gradeDrop < -15) {
        alerts.push({
            tipo: 'bajada_brusca',
            severidad: gradeDrop < -25 ? 'critica' : 'alta',
            titulo: `Bajada significativa en ${currentMetrics.grado} - ${currentMetrics.materia}`,
            mensaje: `El promedio bajó de ${historicalAvg.toFixed(1)} a ${currentMetrics.promedio_general.toFixed(1)} (${gradeDrop.toFixed(1)}%)`,
            valorActual: currentMetrics.promedio_general,
            valorEsperado: historicalAvg,
            desviacion: Math.abs(gradeDrop),
            contexto: {
                grado: currentMetrics.grado,
                materia: currentMetrics.materia,
            },
        });
    }

    // Check for low attendance
    if (currentMetrics.promedio_asistencia < 70) {
        alerts.push({
            tipo: 'asistencia_critica',
            severidad: currentMetrics.promedio_asistencia < 60 ? 'critica' : 'alta',
            titulo: `Asistencia crítica en ${currentMetrics.grado}`,
            mensaje: `La asistencia promedio es ${currentMetrics.promedio_asistencia.toFixed(1)}% (umbral: 70%)`,
            valorActual: currentMetrics.promedio_asistencia,
            valorEsperado: 85,
            desviacion: ((85 - currentMetrics.promedio_asistencia) / 85) * 100,
            contexto: {
                grado: currentMetrics.grado,
                materia: currentMetrics.materia,
            },
        });
    }

    // Check for low pass rate
    if (currentMetrics.porcentaje_aprobados < 60) {
        alerts.push({
            tipo: 'rendimiento_bajo',
            severidad: currentMetrics.porcentaje_aprobados < 50 ? 'critica' : 'alta',
            titulo: `Bajo porcentaje de aprobados en ${currentMetrics.materia}`,
            mensaje: `Solo ${currentMetrics.porcentaje_aprobados.toFixed(1)}% de estudiantes aprobaron`,
            valorActual: currentMetrics.porcentaje_aprobados,
            valorEsperado: 85,
            desviacion: 85 - currentMetrics.porcentaje_aprobados,
            contexto: {
                grado: currentMetrics.grado,
                materia: currentMetrics.materia,
            },
        });
    }

    // Check for improvement (positive anomaly)
    if (gradeDrop > 15) {
        alerts.push({
            tipo: 'mejora_significativa',
            severidad: 'baja',
            titulo: `Mejora notable en ${currentMetrics.grado} - ${currentMetrics.materia}`,
            mensaje: `El promedio mejoró de ${historicalAvg.toFixed(1)} a ${currentMetrics.promedio_general.toFixed(1)} (+${gradeDrop.toFixed(1)}%)`,
            valorActual: currentMetrics.promedio_general,
            valorEsperado: historicalAvg,
            desviacion: gradeDrop,
            contexto: {
                grado: currentMetrics.grado,
                materia: currentMetrics.materia,
            },
        });
    }

    return {
        anomaliesDetected: alerts.length > 0,
        alerts,
    };
}

/**
 * Saves anomaly alerts to the database
 * @param alerts - Array of anomaly alerts to save
 */
export async function saveAnomalyAlerts(alerts: AnomalyAlert[]): Promise<void> {
    try {
        const records = alerts.map((alert) => ({
            tipo_alerta: alert.tipo,
            severidad: alert.severidad,
            titulo: alert.titulo,
            mensaje: alert.mensaje,
            grado: alert.contexto?.grado,
            materia: alert.contexto?.materia,
            id_alumno: alert.contexto?.id_alumno,
            valor_actual: alert.valorActual,
            valor_anterior: alert.valorEsperado,
            umbral_activacion: alert.valorEsperado,
            estado: 'pendiente',
        }));

        const { error } = await supabase
            .from('notificaciones_inteligentes')
            .insert(records);

        if (error) {
            console.error('Error saving anomaly alerts:', error);
        }
    } catch (error) {
        console.error('Exception in saveAnomalyAlerts:', error);
    }
}
