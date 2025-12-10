# 🎯 RRHH Evaluation Builder - Guía de Integración

## ✅ Lo que se ha creado

### 1. Base de Datos (Supabase)
- ✅ **053_create_rrhh_evaluation_builder.sql** - Schema completo con 6 tablas
- ✅ **054_seed_rrhh_templates.sql** - Datos de ejemplo (2 plantillas completas)

### 2. Servicios TypeScript
- ✅ **rrhhEvaluationService.ts** - CRUD completo para todas las tablas
- ✅ Cálculo automático de scores
- ✅ Tipos TypeScript completos

### 3. Componentes React
- ✅ **TemplatesList.tsx** - Lista de plantillas con búsqueda
- ✅ **TemplateBuilder.tsx** - Constructor visual jerárquico
- ✅ **TemplateAssignment.tsx** - Asignación masiva
- ✅ **EvaluationForm.tsx** - Formulario dinámico de evaluación
- ✅ **MyEvaluations.tsx** - Dashboard de usuario

### 4. Documentación
- ✅ **RRHH_EVALUATION_BUILDER_README.md** - Guía completa de uso

## 🚀 Pasos para Integrar en App.tsx

### Paso 1: Aplicar Migraciones en Supabase

```bash
# Conectar a tu proyecto Supabase
supabase link --project-ref rnycynatrhxhbfpydqvd

# Aplicar las migraciones
supabase db push

# Verificar que se crearon las tablas
supabase db diff
```

### Paso 2: Agregar Imports en App.tsx

```typescript
// Agregar al inicio del archivo App.tsx
import { TemplatesList } from './components/rrhh/TemplatesList';
import { MyEvaluations } from './components/rrhh/MyEvaluations';
```

### Paso 3: Agregar Opciones al Menú

```typescript
// En la sección del sidebar, agregar nuevas opciones:

// Para Coordinadores/Directivos
{currentUser?.role === 'coordinador' || currentUser?.role === 'directivo' ? (
    <button
        onClick={() => setCurrentView('rrhh-templates')}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'rrhh-templates'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
        }`}
    >
        <EvaluationIcon className="h-5 w-5" />
        <span>Evaluaciones RRHH</span>
    </button>
) : null}

// Para Todos los Usuarios
<button
    onClick={() => setCurrentView('my-evaluations')}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === 'my-evaluations'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
    }`}
>
    <EvaluationIcon className="h-5 w-5" />
    <span>Mis Evaluaciones</span>
</button>
```

### Paso 4: Agregar Rutas en el Contenido Principal

```typescript
// En la sección de renderizado condicional del contenido:

{currentView === 'rrhh-templates' && (
    <TemplatesList />
)}

{currentView === 'my-evaluations' && currentUser && (
    <MyEvaluations userId={currentUser.id_usuario} />
)}
```

### Paso 5: Agregar al Command Palette (Opcional)

```typescript
// En el array de comandos del CommandPalette:
{
    id: 'rrhh-templates',
    label: 'Evaluaciones RRHH',
    icon: <EvaluationIcon />,
    action: () => setCurrentView('rrhh-templates'),
    keywords: ['evaluacion', 'rrhh', 'desempeño', 'plantillas'],
    roles: ['coordinador', 'directivo']
},
{
    id: 'my-evaluations',
    label: 'Mis Evaluaciones',
    icon: <EvaluationIcon />,
    action: () => setCurrentView('my-evaluations'),
    keywords: ['evaluacion', 'autoevaluacion', 'desempeño']
}
```

## 📋 Checklist de Integración

### Base de Datos
- [ ] Conectar a Supabase con `supabase link`
- [ ] Aplicar migración 053 (schema)
- [ ] Aplicar migración 054 (seed data)
- [ ] Verificar que las tablas existan
- [ ] Probar políticas RLS

### Frontend
- [ ] Agregar imports en App.tsx
- [ ] Agregar opciones al menú lateral
- [ ] Agregar rutas de renderizado
- [ ] Probar navegación entre vistas
- [ ] Verificar que los componentes carguen

### Testing
- [ ] Crear una plantilla de prueba
- [ ] Agregar áreas, subáreas e ítems
- [ ] Verificar validación de pesos (debe sumar 100%)
- [ ] Asignar evaluación a un usuario de prueba
- [ ] Completar una evaluación
- [ ] Verificar cálculo de score final

## 🎨 Personalización Opcional

### Colores del Tema

Si quieres personalizar los colores, edita en cada componente:

```typescript
// Cambiar colores de las áreas
className="border-l-4 border-l-blue-500"  // Cambiar blue-500

// Cambiar colores de badges
variant="success"  // success, warning, destructive, etc.
```

### Textos y Labels

Todos los textos están en español y pueden editarse directamente en los componentes.

### Escalas de Evaluación

Actualmente usa escala 1-5. Para cambiar:

```typescript
// En EvaluationForm.tsx, línea ~250
{[1, 2, 3, 4, 5].map((score) => (
    // Cambiar a [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] para escala 1-10
```

## 🔧 Troubleshooting

### Error: "Cannot find module"
**Solución**: Verificar que todos los imports estén correctos y que los archivos existan en las rutas especificadas.

### Error: "RLS policy violation"
**Solución**: Verificar que el usuario actual tenga el rol correcto (coordinador/directivo para crear plantillas).

### Error: "Total weight check failed"
**Solución**: Asegurarse de que la suma de los pesos de las áreas sea exactamente 100%.

### Los componentes no se muestran
**Solución**: 
1. Verificar que `currentView` esté configurado correctamente
2. Revisar la consola del navegador para errores
3. Verificar que `currentUser` exista y tenga `id_usuario`

## 📊 Estructura de Archivos

```
manglarnet/
├── supabase/
│   └── migrations/
│       ├── 053_create_rrhh_evaluation_builder.sql
│       └── 054_seed_rrhh_templates.sql
├── services/
│   └── rrhhEvaluationService.ts
├── components/
│   └── rrhh/
│       ├── TemplatesList.tsx
│       ├── TemplateBuilder.tsx
│       ├── TemplateAssignment.tsx
│       ├── EvaluationForm.tsx
│       └── MyEvaluations.tsx
├── App.tsx (modificar)
└── RRHH_EVALUATION_BUILDER_README.md
```

## 🎯 Flujo de Uso Completo

### Para Administradores (Coordinadores/Directivos)

1. **Crear Plantilla**
   - Ir a "Evaluaciones RRHH"
   - Click en "Nueva Plantilla"
   - Usar el constructor visual para agregar áreas, subáreas e ítems
   - Asignar pesos (debe sumar 100%)
   - Guardar

2. **Asignar Evaluación**
   - Seleccionar plantilla
   - Click en "Asignar"
   - Configurar período y fecha límite
   - Seleccionar usuarios (individual o masivo)
   - Confirmar asignación

3. **Monitorear Progreso**
   - Ver estadísticas de completitud
   - Revisar scores finales
   - Exportar resultados (próxima feature)

### Para Usuarios (Docentes/Personal)

1. **Ver Evaluaciones Asignadas**
   - Ir a "Mis Evaluaciones"
   - Ver pendientes y completadas

2. **Completar Evaluación**
   - Click en "Iniciar Evaluación"
   - Responder cada ítem (escala 1-5)
   - Ver progreso en tiempo real
   - Ver score calculado automáticamente
   - Finalizar cuando esté 100% completo

3. **Revisar Historial**
   - Ver evaluaciones completadas
   - Revisar scores anteriores
   - Comparar desempeño en el tiempo

## 🚀 Próximas Mejoras (Opcional)

### Fase 2 - Funcionalidades Avanzadas

- [ ] **Reportes PDF**: Exportar evaluaciones a PDF
- [ ] **Gráficos de Desempeño**: Visualizar evolución en el tiempo
- [ ] **Comparativas**: Comparar scores entre departamentos
- [ ] **Notificaciones**: Alertas de evaluaciones pendientes
- [ ] **Comentarios**: Sistema de feedback entre evaluador y evaluado
- [ ] **Planes de Mejora**: Generar planes basados en resultados
- [ ] **Integración con IA**: Sugerencias de mejora con Gemini

### Fase 3 - Analytics

- [ ] Dashboard de métricas RRHH
- [ ] Identificación de fortalezas/debilidades
- [ ] Predicción de necesidades de capacitación
- [ ] Benchmarking interno

## 📞 Soporte

Si tienes dudas durante la integración:

1. **Documentación**: Revisa `RRHH_EVALUATION_BUILDER_README.md`
2. **Código**: Todos los componentes tienen comentarios explicativos
3. **Consola**: Revisa errores en la consola del navegador
4. **Supabase**: Verifica logs en el dashboard de Supabase

---

**¡Listo para integrar!** 🎉

Sigue los pasos en orden y tendrás un sistema completo de evaluaciones funcionando en minutos.
