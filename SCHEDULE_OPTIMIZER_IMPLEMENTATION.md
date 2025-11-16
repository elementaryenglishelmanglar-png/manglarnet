# 🚀 Generador de Horarios - Plan de Implementación

## ✅ Fase 1: Base de Datos - COMPLETADA

### Migración SQL Creada
- ✅ Archivo: `supabase/migrations/009_create_schedule_optimizer_tables.sql`
- ✅ 8 nuevas tablas creadas:
  - `aulas` - Salones/Aulas físicas
  - `docente_materias` - Capacidades de docentes
  - `clase_requisitos` - Requisitos de clases
  - `configuracion_horarios` - Configuración del colegio
  - `restricciones_duras` - Restricciones obligatorias
  - `restricciones_suaves` - Preferencias
  - `generaciones_horarios` - Historial de generaciones
- ✅ Modificación: Tabla `horarios` ahora incluye `id_aula`
- ✅ Políticas RLS configuradas para todas las tablas
- ✅ Índices creados para optimización

### Servicios TypeScript Creados
- ✅ Archivo: `services/supabaseDataService.ts` actualizado
- ✅ Nuevas interfaces TypeScript:
  - `Aula`, `DocenteMateria`, `ClaseRequisito`
  - `ConfiguracionHorario`, `RestriccionDura`, `RestriccionSuave`
  - `GeneracionHorario`
- ✅ Servicios CRUD completos para todas las nuevas entidades

## 🔄 Fase 2: Backend - EN PROGRESO

### Edge Function Estructura
- ✅ Archivo: `supabase/functions/schedule-optimizer/index.ts`
- ✅ Estructura básica creada
- ✅ Carga de datos desde Supabase implementada
- ⏳ Pendiente: Implementación del solver OR-Tools

### Próximos Pasos Backend
1. Instalar dependencias de OR-Tools para Deno
2. Implementar modelo matemático básico
3. Agregar restricciones duras
4. Agregar restricciones suaves y función objetivo
5. Testing y optimización

## 📋 Fase 3: Frontend - PENDIENTE

### Componente React
- ⏳ Crear `ScheduleGeneratorView.tsx`
- ⏳ UI para configuración inicial
- ⏳ UI para gestión de restricciones
- ⏳ Visualización de resultados
- ⏳ Integración con Edge Function

## 📝 Instrucciones para Continuar

### 1. Ejecutar Migración SQL

Ve a Supabase Dashboard y ejecuta la migración:

```sql
-- Copia y pega el contenido de:
-- supabase/migrations/009_create_schedule_optimizer_tables.sql
```

### 2. Verificar Tablas Creadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'aulas', 
  'docente_materias', 
  'clase_requisitos',
  'configuracion_horarios',
  'restricciones_duras',
  'restricciones_suaves',
  'generaciones_horarios'
)
ORDER BY table_name;
```

### 3. Poblar Datos Iniciales

#### Crear Aulas de Ejemplo:
```sql
INSERT INTO aulas (nombre, tipo_aula, capacidad, activa) VALUES
('Aula 101', 'Aula Regular', 30, true),
('Aula 102', 'Aula Regular', 30, true),
('Laboratorio de Química', 'Laboratorio', 24, true),
('Laboratorio de Física', 'Laboratorio', 24, true),
('Sala de Computación 1', 'Sala de Computación', 30, true),
('Gimnasio', 'Gimnasio', 50, true);
```

#### Asignar Capacidades a Docentes:
```sql
-- Ejemplo: Asignar materias a un docente
INSERT INTO docente_materias (id_docente, nombre_materia, nivel_prioridad)
SELECT id_docente, 'Matemática', 3
FROM docentes
WHERE nombres = 'Juan' AND apellidos = 'Pérez';
```

### 4. Desplegar Edge Function

```bash
# Desde la raíz del proyecto
supabase functions deploy schedule-optimizer
```

### 5. Configurar Variables de Entorno

En Supabase Dashboard > Edge Functions > schedule-optimizer:
- `SUPABASE_URL`: Tu URL de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Tu service role key

## 🎯 Estado Actual

- ✅ **Base de Datos**: 100% completada
- ✅ **Servicios TypeScript**: 100% completados
- 🔄 **Backend (Edge Function)**: 30% completado (estructura básica)
- ⏳ **Frontend**: 0% (pendiente)

## 📚 Recursos

- [Google OR-Tools Documentation](https://developers.google.com/optimization)
- [OR-Tools CP-SAT Solver](https://developers.google.com/optimization/cp/cp_solver)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🔧 Notas Técnicas

### Modelo Matemático (Pendiente de Implementación)

Variables de decisión:
```
x[clase][docente][aula][dia][bloque] ∈ {0, 1}
```

Restricciones duras:
1. Un docente no puede estar en dos lugares a la vez
2. Un aula no puede usarse para dos clases a la vez
3. Un grado no puede tener dos clases a la vez
4. La clase debe estar en un aula compatible
5. El docente debe poder dar la materia

Restricciones suaves (minimizar):
1. Preferencias de horarios
2. Preferencias de días
3. Orden preferido de materias
4. Agrupación de horas
5. Evitar huecos

