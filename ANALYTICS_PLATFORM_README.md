# 🏎️ The Red Bull Suite - Analytics Platform

> **Plataforma de Data Science Educativo de Alto Rendimiento para ManglarNet**

## 🎯 Visión General

The Red Bull Suite transforma el dashboard tradicional de ManglarNet en una plataforma de análisis educativo inspirada en la telemetría de Fórmula 1. Proporciona insights en tiempo real, predicciones basadas en IA, y herramientas de simulación para toma de decisiones pedagógicas basadas en datos.

## 🚀 Los 6 Módulos

### 1. **KPIs en Tiempo Real (Telemetría)**
Métricas vivas que se actualizan automáticamente:
- 📊 Promedio Global
- 📅 Asistencia Promedio
- ✅ % de Aprobados
- ⚠️ Estudiantes en Riesgo

**Auto-refresh:** Cada 30 segundos

---

### 2. **Early Warning System (EWS - Sistema de Riesgo)**
Algoritmo de scoring de riesgo académico (0-100) basado en:
- **40%** Promedio de notas recientes
- **25%** Asistencia
- **20%** Frecuencia de evaluaciones reprobadas
- **15%** Problemas emocionales/independencia

**Niveles de Riesgo:**
- 🟢 **Mínimo** (0-14): Sin intervención necesaria
- 🟡 **Bajo** (15-29): Monitoreo
- 🟠 **Medio** (30-49): Atención recomendada
- 🔴 **Alto** (50-69): Intervención necesaria
- ⚫ **Crítico** (70-100): Acción inmediata

---

### 3. **Simulador de Estrategia (What-If)**
Panel interactivo para simular escenarios:
- **Sliders de Control:**
  - Asistencia: ±20%
  - Promedio de notas: ±3 puntos
  - Nivel de apoyo pedagógico: Ninguno/Bajo/Medio/Alto
- **Resultados Proyectados:**
  - Promedio general proyectado
  - % de aprobados proyectado
  - Estudiantes que mejorarían

**Uso:** Planificar intervenciones pedagógicas y predecir su impacto

---

### 4. **Notificaciones Inteligentes (Radio)**
Sistema de alertas automáticas con detección de anomalías:

**Tipos de Alerta:**
- 🔴 **Crítica:** Rendimiento muy bajo, riesgo alto
- 🟠 **Alta:** Bajada brusca (>15%), asistencia crítica (<70%)
- 🟡 **Media:** Anomalía grupal
- 🟢 **Baja:** Mejora significativa

**Características:**
- Análisis IA de causas probables
- Acciones sugeridas automáticas
- Seguimiento de estado (Pendiente/Revisada/Resuelta)

---

### 5. **Análisis de Sentimiento (IA)**
Usa Gemini AI para analizar observaciones de texto y generar:
- **Clima Emocional:** Distribución de estados (Enfocado, Ansioso, Distraído, etc.)
- **Score Positivo:** 0-100 basado en sentimiento general
- **Palabras Clave:** Términos más frecuentes en observaciones
- **Nube de Palabras:** Visualización de temas recurrentes

**Optimización:** Sistema de caché para evitar llamadas redundantes a la API

---

### 6. **Benchmarking Histórico (Ghost Car)**
Comparación de rendimiento actual vs. promedio histórico:
- **Línea Sólida:** Rendimiento actual
- **Línea Punteada:** Promedio histórico del colegio
- **Área Sombreada:** Diferencia entre ambas
- **Indicador de Tendencia:** ↗️ Mejorando / ↘️ Declinando / → Estable

**Datos Históricos:** Calculados automáticamente desde evaluaciones pasadas

---

## 🛠️ Stack Tecnológico

### Backend
- **Supabase PostgreSQL** - Base de datos con funciones SQL avanzadas
- **Edge Functions** - Procesamiento serverless
- **Row Level Security** - Seguridad granular

### Frontend
- **Next.js 14** - App Router con Server/Client Components
- **TypeScript** - Type safety
- **shadcn/ui** - Componentes UI minimalistas
- **Recharts** - Visualizaciones de datos
- **Tailwind CSS** - Styling

### AI/ML
- **Google Gemini 1.5 Flash** - Análisis de sentimiento y generación de insights

---

## 📁 Estructura de Archivos

```
manglarnet/
├── supabase/
│   └── migrations/
│       ├── 046_create_analytics_infrastructure.sql  # Tablas, funciones, vistas
│       └── 047_seed_historical_data.sql             # Población de datos históricos
├── services/
│   ├── analyticsEngine.ts         # Motor de cálculos y simulaciones
│   ├── geminiService.ts           # Análisis de sentimiento (modificado)
│   └── supabaseDataService.ts     # Queries de datos (modificado)
├── components/
│   └── analytics/
│       ├── LiveKPICards.tsx              # Tarjetas de métricas en tiempo real
│       ├── RiskTelemetryTable.tsx        # Tabla de riesgo académico
│       ├── StrategySimulator.tsx         # Simulador What-If
│       ├── EmotionalClimateChart.tsx     # Gráfico de clima emocional
│       ├── GhostCarChart.tsx             # Comparación histórica
│       └── IntelligentNotifications.tsx  # Sistema de alertas
├── app/
│   └── (dashboard)/
│       └── intelligence/
│           └── page.tsx           # Página principal de analytics
└── types/
    └── analytics.ts               # Tipos TypeScript para analytics
```

---

## 🗄️ Schema de Base de Datos

### Nuevas Tablas

#### `historico_promedios`
Almacena promedios históricos para benchmarking.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_historico` | UUID | Primary key |
| `ano_escolar` | TEXT | Año escolar (ej. "2024-2025") |
| `lapso` | TEXT | I/II/III Lapso |
| `mes` | INTEGER | Mes (1-12) |
| `grado` | TEXT | Grado (ej. "5to Grado") |
| `materia` | TEXT | Materia |
| `promedio_general` | NUMERIC(5,2) | Promedio de notas (0-20) |
| `promedio_asistencia` | NUMERIC(5,2) | Promedio de asistencia (0-100) |
| `total_estudiantes` | INTEGER | Cantidad de estudiantes |
| `metadata` | JSONB | Estadísticas adicionales (mediana, desv. estándar) |

**Índices:** `grado+materia`, `ano_escolar+lapso`, `mes`

---

#### `notificaciones_inteligentes`
Sistema de alertas con detección de anomalías.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_notificacion` | UUID | Primary key |
| `tipo_alerta` | TEXT | rendimiento_bajo, bajada_brusca, riesgo_alto, etc. |
| `severidad` | TEXT | baja, media, alta, critica |
| `titulo` | TEXT | Título de la alerta |
| `mensaje` | TEXT | Descripción detallada |
| `grado` | TEXT | Grado afectado (opcional) |
| `materia` | TEXT | Materia afectada (opcional) |
| `id_alumno` | UUID | Alumno afectado (opcional) |
| `valor_actual` | NUMERIC | Valor que disparó la alerta |
| `valor_anterior` | NUMERIC | Valor previo para comparación |
| `analisis_ia` | JSONB | Insights generados por IA |
| `acciones_sugeridas` | TEXT[] | Acciones recomendadas |
| `estado` | TEXT | pendiente, revisada, resuelta, descartada |

**Índices:** `tipo_alerta`, `severidad`, `estado`, `grado`, `created_at`

---

#### `cache_analisis_sentimiento`
Cache de análisis de sentimiento para optimizar API calls.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_cache` | UUID | Primary key |
| `id_minuta` | UUID | FK a minutas_evaluacion |
| `grado` | TEXT | Grado |
| `materia` | TEXT | Materia |
| `clima_emocional` | JSONB | {enfocado: 12, ansioso: 3, ...} |
| `sentimiento_predominante` | TEXT | Estado emocional más común |
| `score_positivo` | NUMERIC(5,2) | Score 0-100 de clima positivo |
| `palabras_clave` | TEXT[] | Palabras más frecuentes |
| `total_observaciones` | INTEGER | Cantidad de observaciones analizadas |
| `modelo_usado` | TEXT | Modelo de IA usado |

**Índices:** `id_minuta`, `grado`

---

### Nuevas Funciones SQL

#### `calculate_risk_score(id_alumno, ano_escolar, lapso)`
Calcula el score de riesgo académico de un estudiante.

**Parámetros:**
- `p_id_alumno` (UUID): ID del estudiante
- `p_ano_escolar` (TEXT, opcional): Filtrar por año
- `p_lapso` (TEXT, opcional): Filtrar por lapso

**Retorna:**
```sql
TABLE (
  id_alumno UUID,
  risk_score NUMERIC(5,2),    -- 0-100
  risk_level TEXT,             -- Crítico/Alto/Medio/Bajo/Mínimo
  factores_riesgo JSONB        -- Desglose de factores
)
```

**Ejemplo:**
```sql
SELECT * FROM calculate_risk_score(
  '123e4567-e89b-12d3-a456-426614174000',
  '2024-2025',
  'I Lapso'
);
```

---

#### `populate_historical_averages()`
Función one-time para poblar datos históricos desde evaluaciones existentes.

**Retorna:**
```sql
TABLE (
  records_created INTEGER,
  message TEXT
)
```

**Uso:**
```sql
SELECT * FROM populate_historical_averages();
-- Resultado: (47, 'Successfully populated 47 historical records')
```

---

### Nueva Vista

#### `vista_telemetria_academica`
KPIs en tiempo real por grado/materia/lapso.

**Columnas:**
- `grado`, `materia`, `lapso`, `ano_escolar`
- `total_estudiantes`
- `promedio_general` (NUMERIC)
- `promedio_asistencia` (NUMERIC)
- `porcentaje_aprobados` (NUMERIC)
- `ultima_actualizacion` (TIMESTAMPTZ)

**Uso:**
```sql
SELECT * FROM vista_telemetria_academica
WHERE grado = '5to Grado'
  AND lapso = 'I Lapso'
ORDER BY promedio_general DESC;
```

---

## 🔧 API de `analyticsEngine.ts`

### `calculateRiskScore(studentData)`
Wrapper TypeScript para la función SQL.

```typescript
interface RiskScoreResult {
  riskScore: number;        // 0-100
  riskLevel: string;        // Crítico/Alto/Medio/Bajo/Mínimo
  factors: {
    promedio_bajo?: boolean;
    asistencia_critica?: boolean;
    evaluaciones_reprobadas?: number;
    problemas_emocionales?: boolean;
    promedio_notas: number;
    asistencia_promedio: number;
    total_evaluaciones: number;
  };
}

async function calculateRiskScore(
  studentId: string,
  anoEscolar?: string,
  lapso?: string
): Promise<RiskScoreResult>
```

---

### `simulateScenario(currentData, modifiers)`
Simula escenarios What-If.

```typescript
interface ScenarioModifiers {
  asistenciaModifier: number;    // -20 a +20 (porcentaje)
  notasModifier: number;         // -3 a +3 (puntos)
  apoyoPedagogico: 'ninguno' | 'bajo' | 'medio' | 'alto';
}

interface SimulationResult {
  promedioProyectado: number;
  aprobadosProyectados: number;
  cambioAbsoluto: number;
  cambioRelativo: number;       // Porcentaje
  estudiantesMejorados: number;
}

async function simulateScenario(
  currentData: CurrentMetrics,
  modifiers: ScenarioModifiers
): Promise<SimulationResult>
```

---

### `analyzeSentiment(observaciones)`
Analiza sentimiento con Gemini AI.

```typescript
interface SentimentAnalysis {
  climaEmocional: {
    enfocado: number;
    ansioso: number;
    distraido: number;
    apatia: number;
    cansado: number;
    participativo: number;
  };
  sentimientoPredominante: string;
  scorePositivo: number;         // 0-100
  palabrasClave: string[];
}

async function analyzeSentiment(
  observaciones: Array<{ id_alumno: string; observaciones: string }>,
  idMinuta: string
): Promise<SentimentAnalysis>
```

**Nota:** Implementa cache lookup automático.

---

### `detectAnomalies(currentMetrics, historicalMetrics)`
Detecta anomalías y genera alertas.

```typescript
interface AnomalyDetectionResult {
  anomaliesDetected: boolean;
  alerts: Array<{
    tipo: string;
    severidad: string;
    titulo: string;
    mensaje: string;
    valorActual: number;
    valorEsperado: number;
    desviacion: number;
  }>;
}

async function detectAnomalies(
  currentMetrics: Metrics,
  historicalMetrics: Metrics
): Promise<AnomalyDetectionResult>
```

**Criterios de Anomalía:**
- Bajada >15% en promedio general
- Asistencia <70%
- Aumento >20% en reprobados
- Cambio brusco en clima emocional

---

### `getHistoricalBenchmark(grado, materia, lapso)`
Obtiene datos históricos para Ghost Car.

```typescript
interface HistoricalBenchmark {
  current: Array<{ mes: number; promedio: number }>;
  historical: Array<{ mes: number; promedio: number }>;
  trend: 'mejorando' | 'declinando' | 'estable';
  difference: number;           // Diferencia promedio
}

async function getHistoricalBenchmark(
  grado: string,
  materia: string,
  lapso: string
): Promise<HistoricalBenchmark>
```

---

## 🎨 Guía de Diseño UI

### Paleta de Colores Semánticos

```css
/* Risk Levels */
--risk-minimo: #10b981;    /* Green 500 */
--risk-bajo: #84cc16;      /* Lime 500 */
--risk-medio: #f59e0b;     /* Amber 500 */
--risk-alto: #f97316;      /* Orange 500 */
--risk-critico: #ef4444;   /* Red 500 */

/* Sentiment */
--sentiment-positive: #10b981;
--sentiment-neutral: #6b7280;
--sentiment-negative: #ef4444;

/* Alerts */
--alert-baja: #10b981;
--alert-media: #f59e0b;
--alert-alta: #f97316;
--alert-critica: #dc2626;
```

### Tipografía
- **Headings:** Inter Bold
- **Body:** Inter Regular
- **Numbers/Metrics:** Inter SemiBold (tabular-nums)

### Espaciado
- **Cards:** padding: 24px
- **Gaps:** 16px entre elementos
- **Margins:** 32px entre secciones

---

## 📊 Ejemplos de Uso

### Obtener estudiantes en riesgo
```typescript
import { calculateRiskScore } from '@/services/analyticsEngine';

const students = await getStudents('5to Grado');
const riskScores = await Promise.all(
  students.map(s => calculateRiskScore(s.id_alumno, '2024-2025', 'I Lapso'))
);

const highRisk = riskScores.filter(r => r.riskScore >= 50);
console.log(`${highRisk.length} estudiantes en riesgo alto/crítico`);
```

### Simular mejora de asistencia
```typescript
import { simulateScenario } from '@/services/analyticsEngine';

const result = await simulateScenario(
  { promedio: 14.5, asistencia: 75, aprobados: 68 },
  { asistenciaModifier: 10, notasModifier: 0, apoyoPedagogico: 'medio' }
);

console.log(`Proyección: ${result.promedioProyectado} (+${result.cambioAbsoluto})`);
// Output: "Proyección: 15.2 (+0.7)"
```

### Analizar clima emocional
```typescript
import { analyzeSentiment } from '@/services/analyticsEngine';

const observaciones = [
  { id_alumno: '...', observaciones: 'Participa activamente, muy enfocado' },
  { id_alumno: '...', observaciones: 'Se ve cansado, distraído' },
  // ...
];

const sentiment = await analyzeSentiment(observaciones, idMinuta);
console.log(`Clima: ${sentiment.sentimientoPredominante} (${sentiment.scorePositivo}% positivo)`);
// Output: "Clima: Enfocado (72% positivo)"
```

---

## 🚦 Instalación y Configuración

### 1. Ejecutar Migraciones SQL

```bash
# Opción A: Supabase CLI (local)
cd /Users/elementary/Desktop/manglarnet
supabase db reset

# Opción B: Supabase Dashboard (producción)
# 1. Ir a SQL Editor en Supabase Dashboard
# 2. Copiar contenido de 046_create_analytics_infrastructure.sql
# 3. Ejecutar
# 4. Copiar contenido de 047_seed_historical_data.sql
# 5. Ejecutar
```

### 2. Poblar Datos Históricos

```sql
-- En Supabase SQL Editor:
SELECT * FROM populate_historical_averages();
```

### 3. Verificar Instalación

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('historico_promedios', 'notificaciones_inteligentes', 'cache_analisis_sentimiento');

-- Verificar función de riesgo
SELECT * FROM calculate_risk_score(
  (SELECT id_alumno FROM alumnos LIMIT 1),
  '2024-2025',
  'I Lapso'
);

-- Verificar vista de telemetría
SELECT * FROM vista_telemetria_academica LIMIT 5;
```

---

## 📈 Roadmap Futuro

### Fase 2 (Q1 2025)
- [ ] Machine Learning para predicción de riesgo
- [ ] Recomendaciones personalizadas por estudiante
- [ ] Dashboard móvil (React Native)

### Fase 3 (Q2 2025)
- [ ] Integración con Google Classroom
- [ ] Análisis de video de clases (engagement detection)
- [ ] Chatbot pedagógico con Gemini

### Fase 4 (Q3 2025)
- [ ] Plataforma multi-colegio (SaaS)
- [ ] Benchmarking inter-institucional
- [ ] API pública para integraciones

---

## 🤝 Contribución

Para contribuir al desarrollo de The Red Bull Suite:

1. Revisar el [Implementation Plan](./implementation_plan.md)
2. Seguir la [Task List](./task.md)
3. Mantener el estilo de código (Prettier + ESLint)
4. Documentar nuevas funciones
5. Agregar tests unitarios

---

## 📞 Soporte

Para preguntas o issues:
- **Email:** soporte@manglarnet.edu
- **Slack:** #analytics-platform
- **Docs:** https://docs.manglarnet.edu/analytics

---

## 📄 Licencia

Propiedad de ManglarNet © 2024. Todos los derechos reservados.
