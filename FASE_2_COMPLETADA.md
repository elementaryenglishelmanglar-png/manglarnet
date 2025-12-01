# ✅ FASE 2 COMPLETADA - Services Layer (TypeScript)

## 📦 Archivos Creados

### 1. **`types/analytics.ts`** (350 líneas)
Tipos TypeScript completos para toda la plataforma de analytics:
- `RiskScoreResult` - Resultados de cálculo de riesgo
- `TelemetryKPIs` - Métricas en tiempo real
- `ScenarioModifiers` & `SimulationResult` - Simulador de estrategia
- `SentimentAnalysis` & `EmotionalClimate` - Análisis de sentimiento
- `HistoricalBenchmark` - Datos históricos para Ghost Car
- `IntelligentNotification` - Alertas inteligentes
- `FilterOptions` & `NotificationFilters` - Filtros
- `StudentWithRisk` - Estudiantes con datos de riesgo

---

### 2. **`services/analyticsEngine.ts`** (450 líneas)
Motor de cálculos y lógica de negocio:

#### Funciones Principales:

**`calculateRiskScore(studentId, anoEscolar, lapso)`**
- Wrapper para la función SQL `calculate_risk_score`
- Retorna score 0-100, nivel de riesgo, y factores
- Maneja errores y casos sin datos

**`calculateRiskScoresBatch(studentIds, anoEscolar, lapso)`**
- Versión batch para múltiples estudiantes
- Optimizada con `Promise.all`

**`simulateScenario(currentData, modifiers)`**
- Simula escenarios What-If
- Calcula efectos de:
  - Cambios en asistencia (±20%)
  - Cambios en notas (±3 puntos)
  - Apoyo pedagógico (ninguno/bajo/medio/alto)
- Multiplica efectividad según nivel de apoyo
- Proyecta promedio y % de aprobados
- Estima estudiantes que mejorarían

**`analyzeSentiment(observaciones, idMinuta)`**
- Llama a Gemini AI para clasificar emociones
- Implementa cache lookup automático
- Guarda resultados en `cache_analisis_sentimiento`
- Retorna clima emocional, score positivo, palabras clave

**`getHistoricalBenchmark(grado, materia, lapso, anoEscolar)`**
- Obtiene datos históricos vs actuales
- Agrega promedios por mes
- Calcula tendencia (mejorando/declinando/estable)
- Genera labels de meses según lapso

**`detectAnomalies(currentMetrics, historicalMetrics)`**
- Compara métricas actuales vs históricas
- Detecta:
  - Bajadas bruscas (>15%)
  - Asistencia crítica (<70%)
  - Bajo porcentaje de aprobados (<60%)
  - Mejoras significativas (+15%)
- Genera alertas con severidad automática

**`saveAnomalyAlerts(alerts)`**
- Guarda alertas en `notificaciones_inteligentes`
- Estado inicial: "pendiente"

---

### 3. **`services/geminiService.ts`** (Modificado - +80 líneas)
Extendido con análisis de sentimiento:

**`analyzeSentimentBatch(observaciones)`**
- Nueva función para clasificación emocional
- Llama a Edge Function con tipo `'sentiment-analysis'`
- Procesa múltiples observaciones en un solo prompt
- Retorna:
  - `climaEmocional`: Distribución de estados emocionales
  - `sentimientoPredominante`: Estado más común
  - `scorePositivo`: 0-100
  - `palabrasClave`: Array de términos clave

**Formato de Request:**
```typescript
{
  type: 'sentiment-analysis',
  data: [
    { id_alumno: '...', observaciones: 'Participa activamente...' },
    { id_alumno: '...', observaciones: 'Se ve cansado...' },
    ...
  ]
}
```

**Formato de Response:**
```typescript
{
  climaEmocional: {
    enfocado: 12,
    ansioso: 3,
    distraido: 5,
    apatia: 1,
    cansado: 4,
    participativo: 8
  },
  sentimientoPredominante: 'Enfocado',
  scorePositivo: 72.5,
  palabrasClave: ['participa', 'atento', 'concentrado', 'cansado']
}
```

---

### 4. **`services/analyticsDataService.ts`** (250 líneas)
Capa de acceso a datos de Supabase:

**`getTelemetryKPIs(filters)`**
- Query a vista `vista_telemetria_academica`
- Filtros opcionales: grado, materia, lapso, año escolar
- Retorna métricas en tiempo real

**`getRiskScores(studentIds, anoEscolar, lapso)`**
- Llama a función SQL `calculate_risk_score` para cada estudiante
- Retorna array de resultados

**`getStudentsWithRisk(filters)`**
- Combina datos de `alumnos` con risk scores
- Retorna estudiantes con toda su información + riesgo
- Filtro opcional por nivel de riesgo

**`getHistoricalBenchmark(grado, materia, lapso, anoEscolar)`**
- Query a tabla `historico_promedios`
- Ordenado por mes
- Para gráficos Ghost Car

**`getIntelligentNotifications(filters)`**
- Query a `notificaciones_inteligentes`
- Filtros múltiples: tipo, severidad, estado, grado, materia, fechas
- Ordenado por fecha (más recientes primero)

**`updateNotificationStatus(id, status, userId, notas)`**
- Actualiza estado de notificación
- Registra quién y cuándo la revisó
- Permite agregar notas

**`getSentimentCache(idMinuta)`**
- Busca análisis de sentimiento en cache
- Evita llamadas redundantes a Gemini
- Retorna null si no existe

**`populateHistoricalAverages()`**
- Ejecuta función SQL one-time
- Retorna cantidad de registros creados

---

## 🔗 Integración entre Capas

### Flujo de Datos:

```
┌─────────────────────────────────────────────┐
│  Frontend Components (FASE 3 - Pendiente)  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  analyticsEngine.ts (Lógica de Negocio)    │
│  - Cálculos complejos                       │
│  - Simulaciones                             │
│  - Detección de anomalías                   │
└──────────────┬──────────────────────────────┘
               │
               ├──────────────┬───────────────┐
               ▼              ▼               ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│ analyticsData    │  │ geminiService│  │ supabase     │
│ Service.ts       │  │ .ts          │  │ Client.ts    │
│ (Queries)        │  │ (AI)         │  │ (DB)         │
└──────────────────┘  └──────────────┘  └──────────────┘
        │                     │                 │
        └─────────────────────┴─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Supabase        │
                    │  - PostgreSQL    │
                    │  - Edge Functions│
                    └──────────────────┘
```

---

## 🧪 Ejemplos de Uso

### 1. Calcular Risk Score
```typescript
import { calculateRiskScore } from '@/services/analyticsEngine';

const result = await calculateRiskScore(
  'student-uuid-123',
  '2024-2025',
  'I Lapso'
);

console.log(result);
// {
//   id_alumno: 'student-uuid-123',
//   risk_score: 45.5,
//   risk_level: 'Medio',
//   factores_riesgo: {
//     promedio_bajo: true,
//     asistencia_promedio: 78.5,
//     promedio_notas: 12.3,
//     total_evaluaciones: 8
//   }
// }
```

### 2. Simular Escenario
```typescript
import { simulateScenario } from '@/services/analyticsEngine';

const result = simulateScenario(
  {
    promedio: 14.5,
    asistencia: 75,
    aprobados: 68,
    totalEstudiantes: 25
  },
  {
    asistenciaModifier: 10,  // +10%
    notasModifier: 0,
    apoyoPedagogico: 'medio'
  }
);

console.log(result);
// {
//   promedioProyectado: 15.2,
//   aprobadosProyectados: 76.5,
//   cambioAbsoluto: 0.7,
//   cambioRelativo: 4.83,
//   estudiantesMejorados: 2,
//   detalles: {
//     efectoAsistencia: 0.58,
//     efectoNotas: 0,
//     efectoApoyo: 30
//   }
// }
```

### 3. Analizar Sentimiento
```typescript
import { analyzeSentiment } from '@/services/analyticsEngine';

const result = await analyzeSentiment(
  [
    { id_alumno: 'uuid-1', observaciones: 'Muy participativo y enfocado' },
    { id_alumno: 'uuid-2', observaciones: 'Se ve cansado, distraído' },
    { id_alumno: 'uuid-3', observaciones: 'Ansioso durante la evaluación' }
  ],
  'minuta-uuid-123'
);

console.log(result);
// {
//   climaEmocional: {
//     enfocado: 1,
//     ansioso: 1,
//     distraido: 1,
//     apatia: 0,
//     cansado: 1,
//     participativo: 1
//   },
//   sentimientoPredominante: 'Enfocado',
//   scorePositivo: 60,
//   palabrasClave: ['participativo', 'enfocado', 'cansado', 'ansioso'],
//   totalObservaciones: 3
// }
```

### 4. Detectar Anomalías
```typescript
import { detectAnomalies, saveAnomalyAlerts } from '@/services/analyticsEngine';

const current = {
  grado: '5to Grado',
  materia: 'Matemáticas',
  lapso: 'I Lapso',
  ano_escolar: '2024-2025',
  total_estudiantes: 25,
  promedio_general: 12.8,
  promedio_asistencia: 65,
  porcentaje_aprobados: 55,
  ultima_actualizacion: new Date().toISOString()
};

const historical = [
  { promedio_general: 15.2, promedio_asistencia: 85, ... },
  { promedio_general: 14.8, promedio_asistencia: 82, ... }
];

const result = detectAnomalies(current, historical);

if (result.anomaliesDetected) {
  await saveAnomalyAlerts(result.alerts);
  console.log(`${result.alerts.length} alertas generadas`);
}
```

### 5. Obtener Estudiantes con Riesgo
```typescript
import { analyticsService } from '@/services/analyticsDataService';

const students = await analyticsService.getStudentsWithRisk({
  grado: '5to Grado',
  anoEscolar: '2024-2025',
  lapso: 'I Lapso',
  riskLevel: 'Alto'  // Filtrar solo alto riesgo
});

console.log(`${students.length} estudiantes en riesgo alto`);
students.forEach(s => {
  console.log(`${s.nombres} ${s.apellidos}: ${s.riskScore}`);
});
```

---

## ⚠️ Notas Importantes

### 1. Edge Function Requerida
El análisis de sentimiento requiere que la Edge Function `gemini-api` soporte el tipo `'sentiment-analysis'`. Necesitarás actualizar la Edge Function con este handler:

```typescript
// supabase/functions/gemini-api/index.ts
if (type === 'sentiment-analysis') {
  const prompt = `
Analiza las siguientes observaciones de estudiantes y clasifica el clima emocional del grupo.

Observaciones:
${data.map((o, i) => `${i + 1}. ${o.observaciones}`).join('\n')}

Retorna un JSON con este formato exacto:
{
  "climaEmocional": {
    "enfocado": <número>,
    "ansioso": <número>,
    "distraido": <número>,
    "apatia": <número>,
    "cansado": <número>,
    "participativo": <número>
  },
  "sentimientoPredominante": "<estado más común>",
  "scorePositivo": <0-100>,
  "palabrasClave": ["palabra1", "palabra2", ...]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  return new Response(JSON.stringify({ result: text }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 2. Dependencias de Tipos
Los archivos de servicios dependen de `types/analytics.ts`. Asegúrate de que esté importado correctamente.

### 3. Supabase Client
Todos los servicios usan el cliente de Supabase desde `./supabaseClient`. Verifica que esté configurado correctamente.

---

## ✅ Checklist de Verificación

Antes de proceder a FASE 3:

- [x] `types/analytics.ts` creado con todos los tipos
- [x] `analyticsEngine.ts` creado con todas las funciones
- [x] `geminiService.ts` extendido con `analyzeSentimentBatch`
- [x] `analyticsDataService.ts` creado con queries de Supabase
- [x] Errores de TypeScript resueltos
- [ ] Edge Function actualizada con handler de sentimiento (Pendiente)
- [ ] Tests unitarios de servicios (Opcional)

---

## 🎯 Próximos Pasos - FASE 3

Con la capa de servicios completa, ahora podemos crear los componentes visuales:

1. **LiveKPICards** - Tarjetas de métricas en tiempo real
2. **RiskTelemetryTable** - Tabla de estudiantes con riesgo
3. **StrategySimulator** - Panel interactivo de simulación
4. **EmotionalClimateChart** - Gráfico de clima emocional
5. **GhostCarChart** - Comparación histórica
6. **IntelligentNotifications** - Sistema de alertas

¿Deseas continuar con FASE 3 (Componentes Visuales)?
