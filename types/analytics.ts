// Analytics Types
// Comprehensive TypeScript types for The Red Bull Suite analytics platform

// ============================================
// Risk Score Types
// ============================================
export interface RiskScoreResult {
  id_alumno: string;
  risk_score: number; // 0-100
  risk_level: 'Crítico' | 'Alto' | 'Medio' | 'Bajo' | 'Mínimo' | 'Sin Datos';
  factores_riesgo: RiskFactors;
}

export interface RiskFactors {
  promedio_bajo?: boolean;
  asistencia_critica?: boolean;
  asistencia_baja?: boolean;
  evaluaciones_reprobadas?: number;
  problemas_emocionales?: boolean;
  promedio_notas: number;
  asistencia_promedio: number;
  total_evaluaciones: number;
}

// ============================================
// Telemetry / KPI Types
// ============================================
export interface TelemetryKPIs {
  grado: string;
  materia: string;
  lapso: string;
  ano_escolar: string;
  total_estudiantes: number;
  promedio_general: number;
  promedio_asistencia: number;
  porcentaje_aprobados: number;
  ultima_actualizacion: string; // ISO timestamp
}

// ============================================
// Strategy Simulator Types
// ============================================
export interface ScenarioModifiers {
  asistenciaModifier: number; // -20 to +20 (percentage points)
  notasModifier: number; // -3 to +3 (grade points)
  apoyoPedagogico: 'ninguno' | 'bajo' | 'medio' | 'alto';
}

export interface CurrentMetrics {
  promedio: number;
  asistencia: number;
  aprobados: number;
  totalEstudiantes: number;
}

export interface SimulationResult {
  promedioProyectado: number;
  aprobadosProyectados: number;
  cambioAbsoluto: number;
  cambioRelativo: number; // Percentage
  estudiantesMejorados: number;
  detalles: {
    efectoAsistencia: number;
    efectoNotas: number;
    efectoApoyo: number;
  };
}

// ============================================
// Sentiment Analysis Types
// ============================================
export interface SentimentInput {
  id_alumno: string;
  observaciones: string;
}

export interface SentimentAnalysis {
  climaEmocional: EmotionalClimate;
  sentimientoPredominante: EmotionalState;
  scorePositivo: number; // 0-100
  palabrasClave: string[];
  totalObservaciones: number;
}

export interface EmotionalClimate {
  enfocado: number;
  ansioso: number;
  distraido: number;
  apatia: number;
  cansado: number;
  participativo: number;
}

export type EmotionalState = 
  | 'Enfocado'
  | 'Ansioso/Nervioso'
  | 'Distraído'
  | 'Apatía/Desinterés'
  | 'Cansado'
  | 'Participativo';

// ============================================
// Historical Benchmark Types
// ============================================
export interface HistoricalBenchmark {
  current: DataPoint[];
  historical: DataPoint[];
  trend: 'mejorando' | 'declinando' | 'estable';
  difference: number; // Average difference
  metadata: {
    grado: string;
    materia: string;
    lapso: string;
    anoEscolar: string;
  };
}

export interface DataPoint {
  mes: number;
  promedio: number;
  asistencia?: number;
  label?: string; // e.g., "Sep", "Oct", "Nov"
}

// ============================================
// Intelligent Notifications Types
// ============================================
export interface IntelligentNotification {
  id_notificacion: string;
  tipo_alerta: AlertType;
  severidad: Severity;
  titulo: string;
  mensaje: string;
  grado?: string;
  materia?: string;
  id_alumno?: string;
  id_minuta?: string;
  valor_actual?: number;
  valor_anterior?: number;
  umbral_activacion?: number;
  analisis_ia?: Record<string, any>;
  acciones_sugeridas?: string[];
  estado: NotificationStatus;
  revisada_por?: string;
  fecha_revision?: string;
  notas_revision?: string;
  created_at: string;
  updated_at: string;
}

export type AlertType =
  | 'rendimiento_bajo'
  | 'bajada_brusca'
  | 'riesgo_alto'
  | 'asistencia_critica'
  | 'anomalia_grupal'
  | 'mejora_significativa';

export type Severity = 'baja' | 'media' | 'alta' | 'critica';

export type NotificationStatus = 'pendiente' | 'revisada' | 'resuelta' | 'descartada';

// ============================================
// Anomaly Detection Types
// ============================================
export interface AnomalyDetectionResult {
  anomaliesDetected: boolean;
  alerts: AnomalyAlert[];
}

export interface AnomalyAlert {
  tipo: AlertType;
  severidad: Severity;
  titulo: string;
  mensaje: string;
  valorActual: number;
  valorEsperado: number;
  desviacion: number; // Percentage
  contexto?: {
    grado?: string;
    materia?: string;
    id_alumno?: string;
  };
}

// ============================================
// Filter Types
// ============================================
export interface FilterOptions {
  grado?: string;
  materia?: string;
  lapso?: string;
  anoEscolar?: string;
  riskLevel?: RiskScoreResult['risk_level'];
}

export interface NotificationFilters {
  tipo?: AlertType;
  severidad?: Severity;
  estado?: NotificationStatus;
  grado?: string;
  materia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

// ============================================
// Historical Data Types
// ============================================
export interface HistoricalAverage {
  id_historico: string;
  ano_escolar: string;
  lapso: string;
  mes: number;
  grado: string;
  materia: string;
  promedio_general: number;
  promedio_asistencia: number;
  total_estudiantes: number;
  metadata?: {
    mediana?: number;
    desviacion_estandar?: number;
    total_evaluaciones?: number;
  };
  created_at: string;
  updated_at: string;
}

// ============================================
// Sentiment Cache Types
// ============================================
export interface SentimentCache {
  id_cache: string;
  id_minuta: string;
  grado: string;
  materia: string;
  clima_emocional: EmotionalClimate;
  sentimiento_predominante: string;
  score_positivo: number;
  palabras_clave: string[];
  total_observaciones: number;
  fecha_analisis: string;
  modelo_usado: string;
  created_at: string;
}

// ============================================
// Student with Risk Data
// ============================================
export interface StudentWithRisk {
  id_alumno: string;
  nombres: string;
  apellidos: string;
  salon: string;
  grupo?: string;
  email_alumno?: string;
  riskScore: number;
  riskLevel: RiskScoreResult['risk_level'];
  factores: RiskFactors;
}

// ============================================
// Dashboard Summary Types
// ============================================
export interface DashboardSummary {
  kpis: TelemetryKPIs;
  riskDistribution: {
    critico: number;
    alto: number;
    medio: number;
    bajo: number;
    minimo: number;
  };
  topRiskStudents: StudentWithRisk[];
  recentAlerts: IntelligentNotification[];
  sentimentSummary?: SentimentAnalysis;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

export interface Error {
  message: string;
  code?: string;
  details?: any;
}
