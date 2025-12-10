# 🎯 RRHH Evaluation Builder - Sistema de Evaluaciones de Desempeño

## 📋 Descripción General

El **Evaluation Builder** es un sistema completo de gestión de evaluaciones de desempeño que permite crear, configurar y administrar plantillas de evaluación dinámicas sin necesidad de tocar código. Es como tener tu propio "Google Forms" especializado para RRHH con lógica de pesos y cálculos automáticos.

## 🏗️ Arquitectura del Sistema

### Estructura Jerárquica

```
Plantilla de Evaluación
├── Área 1 (ej: Liderazgo - 40%)
│   ├── Subárea 1.1 (ej: Planificación - 50%)
│   │   ├── Ítem 1.1.1 (Pregunta específica)
│   │   ├── Ítem 1.1.2
│   │   └── Ítem 1.1.3
│   └── Subárea 1.2 (ej: Toma de Decisiones - 50%)
│       ├── Ítem 1.2.1
│       └── Ítem 1.2.2
└── Área 2 (ej: Competencias Técnicas - 60%)
    └── ...
```

### Cálculo de Puntajes

El sistema calcula automáticamente el score final usando la siguiente fórmula:

```
Score Final = Σ (Respuesta × Peso_Área × Peso_Subárea)
```

**Ejemplo:**
- Área: Liderazgo (40%)
- Subárea: Planificación (50% del área)
- Ítem: "Planifica con anticipación" → Respuesta: 4/5
- Contribución al score: 4 × 0.40 × 0.50 = 0.80

## 🚀 Guía de Uso

### 1. Crear una Plantilla (Administradores)

#### Paso 1: Acceder al Constructor
```typescript
// En tu App.tsx, agregar la ruta:
import { TemplatesList } from './components/rrhh/TemplatesList';

// Dentro del routing:
{currentView === 'rrhh-templates' && <TemplatesList />}
```

#### Paso 2: Crear Nueva Plantilla
1. Click en "Nueva Plantilla"
2. Asignar nombre (ej: "Evaluación Docentes 2025")
3. Agregar descripción opcional
4. Click en "Guardar"

#### Paso 3: Construir la Estructura

**Agregar Áreas:**
1. Click en "+ Agregar Área"
2. Nombrar el área (ej: "Liderazgo Pedagógico")
3. Asignar peso usando el slider o input (ej: 40%)

**Agregar Subáreas:**
1. Dentro de un área, click en "+ Agregar Subárea"
2. Nombrar la subárea (ej: "Planificación de Clases")
3. Asignar peso relativo (ej: 50% del área)

**Agregar Ítems (Preguntas):**
1. Dentro de una subárea, click en "+ Agregar Ítem"
2. Escribir la pregunta (ej: "Planifica sus clases con anticipación")
3. Repetir para todas las preguntas

#### Paso 4: Validar Pesos

El sistema muestra alertas en tiempo real:
- ✅ **Verde**: Total = 100% (correcto)
- ⚠️ **Amarillo**: Total < 100% (falta peso)
- ❌ **Rojo**: Total > 100% (exceso de peso)

### 2. Asignar Evaluaciones

#### Asignación Masiva
1. En la lista de plantillas, click en "Asignar"
2. Configurar:
   - Período de evaluación (ej: "2025-I Lapso")
   - Fecha límite (opcional)
3. Seleccionar usuarios:
   - Buscar por nombre o email
   - Usar "Seleccionar Todos" para asignación masiva
   - Click en checkboxes individuales
4. Click en "Asignar a X usuario(s)"

### 3. Completar Evaluaciones (Usuarios)

#### Vista del Usuario
Los usuarios ven sus evaluaciones en "Mis Evaluaciones":
- **Pendientes**: Evaluaciones sin completar
- **Completadas**: Historial con scores

#### Proceso de Evaluación
1. Click en "Iniciar Evaluación"
2. Para cada pregunta, seleccionar score (1-5):
   - 1: Muy por debajo de lo esperado
   - 2: Por debajo de lo esperado
   - 3: Cumple expectativas
   - 4: Supera expectativas
   - 5: Excelente desempeño
3. El sistema muestra:
   - Progreso en tiempo real
   - Score calculado automáticamente
4. Click en "Finalizar Evaluación" cuando esté 100% completo

## 📊 Base de Datos

### Tablas Principales

#### `rrhh_templates`
Plantillas maestras de evaluación.

```sql
id                  UUID PRIMARY KEY
name                TEXT NOT NULL
description         TEXT
total_weight_check  NUMERIC(5,2)  -- Suma automática de pesos
active              BOOLEAN
created_by          UUID
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

#### `rrhh_areas`
Áreas de competencia (primer nivel).

```sql
id                  UUID PRIMARY KEY
template_id         UUID REFERENCES rrhh_templates
name                TEXT NOT NULL
weight_percentage   NUMERIC(5,2)  -- 0-100
order_index         INTEGER
```

#### `rrhh_subareas`
Subáreas de competencia (segundo nivel).

```sql
id                  UUID PRIMARY KEY
area_id             UUID REFERENCES rrhh_areas
name                TEXT NOT NULL
relative_weight     NUMERIC(5,2)  -- Peso relativo al área
order_index         INTEGER
```

#### `rrhh_items`
Ítems/preguntas específicas (tercer nivel).

```sql
id                  UUID PRIMARY KEY
subarea_id          UUID REFERENCES rrhh_subareas
text                TEXT NOT NULL
order_index         INTEGER
```

#### `rrhh_assignments`
Asignaciones de evaluaciones a usuarios.

```sql
id                  UUID PRIMARY KEY
template_id         UUID REFERENCES rrhh_templates
evaluator_id        UUID REFERENCES usuarios
evaluatee_id        UUID REFERENCES usuarios
status              TEXT  -- pending, in_progress, completed, cancelled
final_score         NUMERIC(5,2)
evaluation_period   TEXT
due_date            DATE
completed_at        TIMESTAMPTZ
```

#### `rrhh_responses`
Respuestas individuales a cada ítem.

```sql
id                  UUID PRIMARY KEY
assignment_id       UUID REFERENCES rrhh_assignments
item_id             UUID REFERENCES rrhh_items
self_score          NUMERIC(3,1)  -- 1-5
supervisor_score    NUMERIC(3,1)  -- 1-5
comment             TEXT
```

### Triggers Automáticos

#### Validación de Pesos
```sql
CREATE TRIGGER check_area_weights_after_insert
    AFTER INSERT ON rrhh_areas
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_weights();
```

Este trigger actualiza automáticamente `total_weight_check` en la plantilla cada vez que se agrega, modifica o elimina un área.

## 🔐 Seguridad (RLS)

### Políticas de Acceso

**Plantillas:**
- ✅ Todos pueden ver plantillas activas
- 🔒 Solo coordinadores/directivos pueden crear/editar

**Asignaciones:**
- ✅ Los usuarios ven solo sus propias asignaciones
- 🔒 Solo coordinadores/directivos pueden asignar

**Respuestas:**
- ✅ Los evaluados pueden crear/editar sus autoevaluaciones
- ✅ Los evaluadores pueden ver/editar evaluaciones asignadas
- 🔒 Otros usuarios no tienen acceso

## 🎨 Componentes React

### Componentes Principales

#### `TemplatesList`
Lista de plantillas con búsqueda y acciones.

```tsx
<TemplatesList />
```

#### `TemplateBuilder`
Constructor visual de plantillas.

```tsx
<TemplateBuilder
    templateId={id}  // Opcional para edición
    onSave={(template) => console.log('Guardado')}
    onCancel={() => console.log('Cancelado')}
/>
```

#### `TemplateAssignment`
Asignación masiva de evaluaciones.

```tsx
<TemplateAssignment
    templateId={id}
    onClose={() => console.log('Cerrado')}
/>
```

#### `EvaluationForm`
Formulario dinámico de evaluación.

```tsx
<EvaluationForm
    assignmentId={id}
    mode="self"  // 'self' o 'supervisor'
    onComplete={() => console.log('Completado')}
    onCancel={() => console.log('Cancelado')}
/>
```

#### `MyEvaluations`
Dashboard de evaluaciones del usuario.

```tsx
<MyEvaluations userId={currentUserId} />
```

## 🔧 Servicios TypeScript

### Uso de Servicios

```typescript
import {
    rrhhTemplatesService,
    rrhhAreasService,
    rrhhSubareasService,
    rrhhItemsService,
    rrhhAssignmentsService,
    rrhhResponsesService
} from './services/rrhhEvaluationService';

// Obtener todas las plantillas
const templates = await rrhhTemplatesService.getAll();

// Obtener plantilla con estructura completa
const template = await rrhhTemplatesService.getById(id);

// Crear área
const area = await rrhhAreasService.create({
    template_id: templateId,
    name: 'Liderazgo',
    weight_percentage: 40,
    order_index: 0
});

// Asignar evaluación
const assignment = await rrhhAssignmentsService.create({
    template_id: templateId,
    evaluatee_id: userId,
    status: 'pending',
    evaluation_period: '2025-I Lapso'
});

// Guardar respuesta
const response = await rrhhResponsesService.upsert({
    assignment_id: assignmentId,
    item_id: itemId,
    self_score: 4
});

// Calcular score final
const finalScore = await rrhhResponsesService.calculateFinalScore(assignmentId);
```

## 📈 Ejemplo Completo

### Caso de Uso: Evaluación de Docentes 2025

#### 1. Estructura de la Plantilla

```
Evaluación Docentes 2025 (100%)
├── Liderazgo Pedagógico (40%)
│   ├── Planificación (50%)
│   │   ├── Planifica con anticipación
│   │   ├── Usa recursos variados
│   │   └── Adapta según necesidades
│   └── Gestión del Aula (50%)
│       ├── Mantiene disciplina positiva
│       └── Fomenta participación
├── Competencias Técnicas (35%)
│   ├── Dominio de Contenido (60%)
│   │   ├── Conoce su materia
│   │   └── Actualiza conocimientos
│   └── Metodología (40%)
│       ├── Usa métodos innovadores
│       └── Evalúa efectivamente
└── Desarrollo Profesional (25%)
    └── Formación Continua (100%)
        ├── Participa en capacitaciones
        └── Comparte conocimientos
```

#### 2. Asignación

- Período: "2025-I Lapso"
- Usuarios: Todos los docentes (50 personas)
- Fecha límite: 2025-03-31

#### 3. Resultados

Un docente completa su autoevaluación:
- Liderazgo: Promedio 4.2/5
- Competencias: Promedio 4.5/5
- Desarrollo: Promedio 3.8/5

**Score Final Calculado:**
```
(4.2 × 0.40) + (4.5 × 0.35) + (3.8 × 0.25) = 4.21/5
```

## 🚀 Migración y Despliegue

### 1. Aplicar Migración

```bash
# Conectar a Supabase
supabase link --project-ref tu-proyecto-id

# Aplicar migración
supabase db push
```

### 2. Verificar Tablas

```sql
-- Verificar que las tablas existan
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'rrhh_%';
```

### 3. Seed Data (Opcional)

```sql
-- Crear plantilla de ejemplo
INSERT INTO rrhh_templates (name, description, active)
VALUES ('Evaluación Docentes 2025', 'Plantilla de ejemplo', true);
```

## 🎯 Ventajas del Sistema

### vs. Excel Manual

| Característica | Excel | Evaluation Builder |
|----------------|-------|-------------------|
| Validación de pesos | ❌ Manual | ✅ Automática |
| Cálculo de scores | ❌ Fórmulas propensas a errores | ✅ Automático |
| Asignación masiva | ❌ Copiar/pegar | ✅ Un click |
| Historial | ❌ Archivos separados | ✅ Base de datos |
| Acceso | ❌ Compartir archivos | ✅ Web, tiempo real |
| Seguridad | ❌ Cualquiera puede editar | ✅ RLS por rol |

### Beneficios Clave

1. **🎨 Experiencia Visual**: Interfaz tipo "Apple" vs. celdas de Excel
2. **⚡ Validación en Tiempo Real**: Alertas inmediatas si los pesos no suman 100%
3. **🔄 Flexibilidad Total**: Crea plantillas diferentes para cada departamento
4. **📊 Cálculos Automáticos**: Score final calculado en vivo
5. **👥 Asignación Masiva**: Asigna a 50 personas en segundos
6. **📱 Acceso Web**: Desde cualquier dispositivo
7. **🔐 Seguridad**: Cada usuario ve solo lo que le corresponde

## 📞 Soporte

Para dudas o problemas:
1. Consulta esta documentación
2. Revisa los comentarios en el código
3. Verifica los logs de la consola del navegador
4. Revisa las políticas RLS en Supabase

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2025  
**Autor**: Sistema ManglarNet
